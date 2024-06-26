import { Test, TestingModule } from '@nestjs/testing';
import { UserconfigService } from '../userconfig.service';

describe('UserconfigService', () => {
  let service: UserconfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserconfigService],
    }).compile();

    service = module.get<UserconfigService>(UserconfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
