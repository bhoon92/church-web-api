import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { ConfirmPhotoDto, PresignPhotoDto } from './dto/photo.dto';
import { PhotoService } from './photo.service';

@Controller('events/:eventId/photos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PhotoController {
  constructor(private readonly photos: PhotoService) {}

  @Get()
  @Permissions('gallery:read')
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('eventId', ParseIntPipe) eventId: number) {
    return this.photos.listForEvent(auth.churchId, eventId);
  }

  /** 1단계: 업로드용 presigned URL 발급. */
  @Post('presign')
  @Permissions('gallery:write')
  presign(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: PresignPhotoDto
  ) {
    return this.photos.presign(auth.churchId, eventId, dto);
  }

  /** 2단계: S3 업로드 완료 후 메타데이터 확정. */
  @Post()
  @Permissions('gallery:write')
  confirm(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: ConfirmPhotoDto
  ) {
    return this.photos.confirm(auth.churchId, eventId, auth.accountId, dto);
  }

  @Delete(':photoId')
  @Permissions('gallery:write')
  @HttpCode(204)
  remove(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('photoId', ParseIntPipe) photoId: number
  ) {
    return this.photos.remove(auth.churchId, eventId, photoId);
  }
}
