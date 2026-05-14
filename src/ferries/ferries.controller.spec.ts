import { Test, TestingModule } from '@nestjs/testing';
import { FerriesController } from './ferries.controller';

describe('FerriesController', () => {
  let controller: FerriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FerriesController],
    }).compile();

    controller = module.get<FerriesController>(FerriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
