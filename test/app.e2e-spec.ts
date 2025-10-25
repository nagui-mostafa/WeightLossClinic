import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/modules/common';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const prismaStub = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    } as unknown as PrismaService;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns application info', () => {
    const controller = app.get(AppController);
    const info = controller.getInfo();

    expect(info).toHaveProperty('name', 'Weight Loss Clinic API');
    expect(info).toHaveProperty('environment');
    expect(info).toHaveProperty('version');
  });
});
