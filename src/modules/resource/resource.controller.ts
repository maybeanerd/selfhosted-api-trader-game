import { Controller, Get, Param } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { ResourceInPath } from './dto/ResourceInPath';

@Controller({ path: 'resource', version: '1' })
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get(':type')
  getAmountOfResource(@Param() params: ResourceInPath) {
    return this.resourceService.getAmountOfResource(params.type);
  }
}

