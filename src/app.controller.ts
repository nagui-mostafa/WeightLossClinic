import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './modules/common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getInfo() {
    return this.appService.getInfo();
  }
}
