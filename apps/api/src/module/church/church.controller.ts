import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '@src/module/auth/auth.constants';
import { AuthService } from '@src/module/auth/auth.service';
import { CurrentAuth, RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { ConfigProvider } from '@src/config';
import { ChurchService } from './church.service';
import { CreateChurchDto } from './dto/create-church.dto';

@Controller('churches')
@UseGuards(JwtAuthGuard)
export class ChurchController {
  constructor(
    private readonly churches: ChurchService,
    private readonly auth: AuthService
  ) {}

  /** 온보딩 — 첫 교회를 만들고, JWT를 churchId 포함으로 재발급 */
  @Post()
  async create(@CurrentAuth() auth: AuthContext, @Body() dto: CreateChurchDto, @Res() res: Response) {
    const { church, membership } = await this.churches.create(auth.accountId, dto);
    const reissue = await this.auth.selectChurch(auth.accountId, church.id);

    res.cookie(ACCESS_TOKEN_COOKIE, reissue.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: ConfigProvider.cookie.isSecure,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    res.status(201).json({ church, membership });
  }

  @Get('me')
  async me(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.churches.findById(auth.churchId);
  }
}
