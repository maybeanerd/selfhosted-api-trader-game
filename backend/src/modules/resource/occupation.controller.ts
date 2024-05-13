import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { ResourceService } from '@/modules/resource/resource.service';
import { getUser } from '@/modules/resource/utils/testUser';
import { OccupationTypeDto } from '@/modules/resource/dto/OccupationType.dto';
import { Occupation } from '@/modules/resource/types';

@Controller({ path: 'occupations', version: '1' })
export class OccupationController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  async getCurrentOccupation(): Promise<Occupation> {
    const occupation = await this.resourceService.getCurrentOccupation();
    return occupation;
  }

  @Put(':type')
  async upgradeResource(@Param() params: OccupationTypeDto): Promise<void> {
    const { id } = await getUser();

    try {
      await this.resourceService.changeOccupation(id, params.occupation);
    } catch (e) {
      throw new HttpException(
        'Failed to change occupation: ' + e,
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
