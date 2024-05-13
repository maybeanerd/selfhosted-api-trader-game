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
import { getUser } from '@/modules/resource/utils/testUser';

@Controller({ path: 'resources', version: '1' })
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get(':type')
  async getStatisticOfResource(
    @Param() params: ResourceTypeDto,
  ): Promise<ResourceStatisticDto> {
    const { id } = await getUser();
    return this.resourceService.getStatisticOfResource(params.type, id);
  }

  @Get()
  async getStatisticOfAllResources(): Promise<Array<ResourceStatisticDto>> {
    const { id } = await getUser();

    return this.resourceService.getStatisticOfAllResources(id);
  }

  @Put(':type')
  async upgradeResource(
    @Param() params: ResourceTypeDto,
  ): Promise<ResourceStatisticDto> {
    const { id } = await getUser();

    try {
      const updatedResource = await this.resourceService.upgradeResource(
        id,
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
