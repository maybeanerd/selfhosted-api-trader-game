import { Controller, Get, Param } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { Resource } from '@/modules/resource/types';

@Controller({ path: 'resource', version: '1' })
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get(':type')
  getAmountOfResource(@Param('type') type: Resource) {
    return this.resourceService.getAmountOfResource(type);
  }
}

