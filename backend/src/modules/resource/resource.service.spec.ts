import { Test, TestingModule } from '@nestjs/testing';
import { ResourceService } from './resource.service';
import { ResourceType } from './types';

describe('ResourceService', () => {
  let resourceService: ResourceService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [ResourceService],
    }).compile();

    resourceService = app.get<ResourceService>(ResourceService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(resourceService.getStatisticOfResource(ResourceType.DIAMOND)).toBe(0);
    });
  });
});
