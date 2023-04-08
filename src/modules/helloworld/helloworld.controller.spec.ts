import { Test, TestingModule } from '@nestjs/testing';
import { HelloWorldController } from '@/modules/helloworld/helloworld.controller';
import { HelloWorldService } from '@/modules/helloworld/helloworld.service';

describe('HelloWorldController', () => {
  let helloWorldController: HelloWorldController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HelloWorldController],
      providers: [HelloWorldService],
    }).compile();

    helloWorldController = app.get<HelloWorldController>(HelloWorldController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(helloWorldController.getHello()).toBe('Hello World!');
    });
  });
});
