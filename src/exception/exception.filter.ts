import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

export interface RequestExceptionResponse {
  status: number;
  code: number;
  message: string | string[];
  desc: string | string[];
  error: { reqId: string; code: string; desc: string[] };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const headers = ctx.getRequest().headers;
    const message = exception.toString();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    response.errorStack = exception.stack;
    if (exception instanceof HttpException) {
      let desc;
      const res = exception.getResponse() as RequestExceptionResponse;

      if (res.desc) {
        desc = Array.isArray(res.desc) ? res.desc : [res.desc];
      } else {
        desc = Array.isArray(res.message) ? res.message : [res.message];
      }

      return response.status(status).json({
        status: status,
        message: message,
        error: { reqId: headers.reqId, code: res.code || String(status), desc },
      });
    } else {
      console.error(exception);
      return response.status(status).json({
        status: status,
        message: message,
        error: {
          reqId: headers.reqId,
          code: '0000',
          desc: ['예기치 못한 오류가 발생했습니다.'],
        },
      });
    }
  }
}
