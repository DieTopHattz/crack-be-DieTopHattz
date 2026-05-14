import { Test, TestingModule } from '@nestjs/testing';
import { FerriesService } from './ferries.service';

describe('FerriesService', () => {
  let service: FerriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FerriesService],
    }).compile();

    service = module.get<FerriesService>(FerriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
