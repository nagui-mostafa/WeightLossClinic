import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return application info', () => {
      const info = appController.getInfo();
      expect(info).toHaveProperty('name', 'Weight Loss Clinic API');
      expect(info).toHaveProperty('environment');
      expect(info).toHaveProperty('version');
    });
  });
});
