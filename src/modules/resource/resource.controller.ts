import { Controller, Get, Param } from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { ResourceTypeDto } from './dto/ResourceType.dto';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';

@Controller({ path: 'resource', version: '1' })
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get(':type')
  async getStatisticOfResource(
    @Param() params: ResourceTypeDto,
  ): Promise<ResourceStatisticDto> {
    return this.resourceService.getStatisticOfResource(params.type);
  }

  @Get()
  getStatisticOfAllResources(): Promise<Array<ResourceStatisticDto>> {
    return this.resourceService.getStatisticOfAllResources();
  }
}
