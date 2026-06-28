import { Test, TestingModule } from '@nestjs/testing';
import { HeathController } from './heath.controller';

describe('HeathController', () => {
  let controller: HeathController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeathController],
    }).compile();

    controller = module.get<HeathController>(HeathController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
