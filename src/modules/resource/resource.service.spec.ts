import { Test, TestingModule } from '@nestjs/testing';
import { ResourceService } from './resource.service';
import { Resource } from './types';

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
      expect(resourceService.getAmountOfResource(Resource.DIAMOND)).toBe(0);
    });
  });
});
