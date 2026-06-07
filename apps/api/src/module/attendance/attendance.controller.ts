import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { RosterQueryDto } from './dto/roster-query.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  /** 예배·날짜별 출석 명단 + 출석률. */
  @Get('roster')
  roster(@RequireChurch() auth: AuthContext & { churchId: number }, @Query() query: RosterQueryDto) {
    return this.attendance.roster(auth.churchId, query.worshipServiceId, query.date);
  }

  /** 출석 체크 토글. */
  @Post('mark')
  mark(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: MarkAttendanceDto) {
    return this.attendance.mark(auth.churchId, dto);
  }
}
