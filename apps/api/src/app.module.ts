import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/auth.module';
import { ChurchModule } from './module/church/church.module';

@Module({
  imports: [AuthModule, ChurchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
