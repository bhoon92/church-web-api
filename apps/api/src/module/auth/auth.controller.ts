import { Body, Controller, ForbiddenException, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { ConfigProvider } from '@src/config';
import { ACCESS_TOKEN_COOKIE } from './auth.constants';
import { AuthService, SessionResult } from './auth.service';
import { CurrentAuth } from './decorators/current-auth.decorator';
import { SelectChurchDto } from './dto/select-church.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { GoogleProfile } from './strategies/google.strategy';
import type { AuthContext } from './types/auth-context';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  googleAuth() {
    // Passport 가 Google 로 리다이렉트 — 빈 메서드 OK
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request & { user: GoogleProfile }, @Res() res: Response) {
    const session = await this.auth.upsertAndIssueSession(req.user);
    this.setSessionCookie(res, session.token);
    res.redirect(this.nextUrlFor(session));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentAuth() auth: AuthContext) {
    return this.auth.me(auth);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    res.status(204).end();
  }

  @Post('select-church')
  @UseGuards(JwtAuthGuard)
  async selectChurch(@CurrentAuth() auth: AuthContext, @Body() body: SelectChurchDto, @Res() res: Response) {
    const result = await this.auth.selectChurch(auth.accountId, body.churchId);
    this.setSessionCookie(res, result.token);
    res.json({ churchId: body.churchId, role: result.role });
  }

  /** localdev 전용: Google 자격증명 없이 흐름을 검증 */
  @Post('dev-login')
  async devLogin(@Body() body: { email: string; name?: string }, @Res() res: Response) {
    if (ConfigProvider.stage !== 'localdev') {
      throw new ForbiddenException('Dev login is disabled');
    }
    const profile: GoogleProfile = {
      googleId: `dev:${body.email}`,
      email: body.email,
      name: body.name ?? body.email.split('@')[0],
    };
    const session = await this.auth.upsertAndIssueSession(profile);
    this.setSessionCookie(res, session.token);
    res.json({
      account: { id: session.account.id, email: session.account.email, name: session.account.name },
      memberships: session.memberships,
      activeChurchId: session.activeChurchId,
      next: this.nextPathFor(session),
    });
  }

  private setSessionCookie(res: Response, token: string) {
    res.cookie(ACCESS_TOKEN_COOKIE, token, this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: ConfigProvider.cookie.isSecure,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    };
  }

  private nextPathFor(s: SessionResult): string {
    if (s.memberships.length === 0) return '/onboarding';
    if (s.activeChurchId) return '/app';
    return '/church-select';
  }

  private nextUrlFor(s: SessionResult): string {
    return `${ConfigProvider.web.baseUrl}${this.nextPathFor(s)}`;
  }
}
