import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { TreatyService } from '@/modules/treaty/treaty.service';
import {
  ProposeTreatyDto,
  TreatyDto,
  UpdateTreatyDto,
} from '@/modules/treaty/dto/Treaty.dto';

@Controller({ path: 'crossroads/treaty', version: '1' })
export class TreatyController {
  constructor(private readonly treatyService: TreatyService) {}

  @Post()
  async proposeTreaty(@Body() body: ProposeTreatyDto): Promise<TreatyDto> {
    return this.treatyService.createTreaty(body.instanceId, body.url);
  }

  @Put()
  async updateTreaty(@Body() body: UpdateTreatyDto): Promise<TreatyDto> {
    const updatedTreaty = await this.treatyService.updateTreaty(
      body.instanceId,
      { url: body.url, status: body.status },
    );
    if (updatedTreaty === null) {
      throw new HttpException('Treaty not found.', HttpStatus.NOT_FOUND);
    }
    return updatedTreaty;
  }
}
