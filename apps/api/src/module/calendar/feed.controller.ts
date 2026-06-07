import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FeedService } from './feed.service';

/**
 * 공개 iCal 피드 — 캘린더 앱(구글/애플)이 쿠키 없이 토큰 URL 로 구독.
 * JwtAuthGuard 없음 (토큰이 곧 인증).
 */
@Controller('calendar/feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get(':token')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  async ics(@Param('token') token: string, @Res() res: Response) {
    const clean = token.replace(/\.ics$/i, '');
    const body = await this.feed.buildIcs(clean);
    res.setHeader('Content-Disposition', 'inline; filename="calendar.ics"');
    res.send(body);
  }
}
