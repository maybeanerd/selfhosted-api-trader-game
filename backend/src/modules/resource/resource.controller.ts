import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { ResourceTypeDto } from './dto/ResourceType.dto';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';
import { userIdForTestingResourceGeneration } from '@/modules/resource/utils/testUser';

@Controller({ path: 'resource', version: '1' })
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get(':type')
  async getStatisticOfResource(
    @Param() params: ResourceTypeDto,
  ): Promise<ResourceStatisticDto> {
    return this.resourceService.getStatisticOfResource(
      params.type,
      userIdForTestingResourceGeneration,
    );
  }

  @Get()
  getStatisticOfAllResources(): Promise<Array<ResourceStatisticDto>> {
    return this.resourceService.getStatisticOfAllResources(
      userIdForTestingResourceGeneration,
    );
  }

  @Put(':type')
  async upgradeResource(
    @Param() params: ResourceTypeDto,
  ): Promise<ResourceStatisticDto> {
    try {
      const updatedResource = await this.resourceService.upgradeResource(
        userIdForTestingResourceGeneration,
        params.type,
      );
      return updatedResource;
    } catch (e) {
      throw new HttpException(
        'Failed to upgrade resource: ' + e,
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
