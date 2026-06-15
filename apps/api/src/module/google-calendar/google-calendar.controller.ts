import { Controller, Delete, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { ConfigProvider } from '@src/config';
import { DataSources } from '@src/database/data-sources';
import { ChurchEntity } from '@src/database/entities/church.entity';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { GoogleCalendarClient } from './google-calendar.client';
import { GoogleCalendarConnectionService } from './connection.service';
import { GoogleCalendarSyncService } from './sync.service';
import { GoogleOauthService } from './google-oauth.service';

type Auth = AuthContext & { churchId: number };
type StatePayload = { accountId: number; churchId: number; purpose: 'gcal' };

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(
    private readonly oauth: GoogleOauthService,
    private readonly client: GoogleCalendarClient,
    private readonly connections: GoogleCalendarConnectionService,
    private readonly sync: GoogleCalendarSyncService,
    private readonly jwt: JwtService
  ) {}

  /** 연동 상태. */
  @Get('status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('calendar:read')
  async status(@RequireChurch() auth: Auth) {
    const connection = await this.connections.forAccount(auth.accountId, auth.churchId);
    if (!connection) return { connected: false };
    return {
      connected: true,
      googleEmail: connection.googleEmail,
      targetCalendarId: connection.targetCalendarId,
      calendarId: connection.calendarId,
    };
  }

  /** 동의 화면 URL 발급 (프론트가 top-level 이동). state 에 account/church 서명. */
  @Get('connect')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('calendar:write')
  connect(@RequireChurch() auth: Auth) {
    const state = this.jwt.sign({ accountId: auth.accountId, churchId: auth.churchId, purpose: 'gcal' } satisfies StatePayload, {
      expiresIn: '10m',
    });
    return { url: this.oauth.buildConsentUrl(state) };
  }

  /** Google redirect 콜백 — 가드 없음(state 서명으로 인증). 토큰 교환 → 전용 캘린더 생성 → 연결 저장. */
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const back = (status: string) => res.redirect(`${ConfigProvider.web.baseUrl}/app/calendar?gcal=${status}`);
    let payload: StatePayload;
    try {
      payload = this.jwt.verify<StatePayload>(state);
      if (payload.purpose !== 'gcal') throw new Error('bad purpose');
    } catch {
      return back('error');
    }
    if (!code) return back('error');

    try {
      const token = await this.oauth.exchangeCode(code);
      if (!token.refreshToken) return back('error'); // refresh token 없으면 push 불가
      const email = await this.oauth.userEmail(token.accessToken);
      const church = await DataSources.instance.getRepository(ChurchEntity).findOne({ where: { id: payload.churchId } });
      const calendarId = await this.client.createCalendar(token.accessToken, `${church?.name ?? '교회'} 일정`);
      await this.connections.upsert(payload.accountId, payload.churchId, email, calendarId, token);
      return back('connected');
    } catch {
      return back('error');
    }
  }

  /** 연동 해제 — 전용 구글 캘린더 삭제(best-effort) + 연결/링크 제거. */
  @Delete()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('calendar:write')
  async disconnect(@RequireChurch() auth: Auth) {
    const connection = await this.connections.forAccount(auth.accountId, auth.churchId);
    if (!connection) return { ok: true };
    try {
      const token = await this.connections.validAccessToken(connection);
      await this.client.deleteCalendar(token, connection.targetCalendarId);
    } catch {
      // 구글 쪽 정리는 best-effort — 로컬 연결은 무조건 제거.
    }
    await this.connections.remove(connection);
    return { ok: true };
  }

  /** 기존 미래 일정 일괄 push. */
  @Post('sync')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('calendar:write')
  async backfill(@RequireChurch() auth: Auth) {
    const connection = await this.connections.forAccount(auth.accountId, auth.churchId);
    if (!connection) return { pushed: 0 };
    return this.sync.backfill(connection);
  }
}
