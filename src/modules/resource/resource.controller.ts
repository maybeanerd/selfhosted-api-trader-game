import { Controller, Get, Param } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { ResourceType } from './dto/ResourceInPath.dto';
import { ResourceStatistic } from './dto/ResourceStatistic.dto';

@Controller({ path: 'resource', version: '1' })
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get(':type')
  getAmountOfResource(@Param() params: ResourceType): ResourceStatistic {
    return this.resourceService.getStatisticOfResource(params.type);
  }
}
