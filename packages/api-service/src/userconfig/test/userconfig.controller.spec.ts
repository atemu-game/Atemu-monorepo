import { Test, TestingModule } from '@nestjs/testing';
import { UserconfigController } from '../userconfig.controller';

describe('UserconfigController', () => {
  let controller: UserconfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserconfigController],
    }).compile();

    controller = module.get<UserconfigController>(UserconfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
