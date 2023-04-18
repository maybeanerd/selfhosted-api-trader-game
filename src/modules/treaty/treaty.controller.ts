import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { TreatyService } from './treaty.service';
import { TreatyDto, TreatyOfferDto, UpdateTreatyDto } from './dto/Treaty.dto';
import { IdDto } from '@/dto/Id.dto';

@Controller({ path: 'treaty', version: '1' })
export class TreatyController {
  constructor(private readonly treatyService: TreatyService) {}

  @Get()
  async getAllTreaties(): Promise<Array<TreatyDto>> {
    return this.treatyService.getAllTreaties();
  }

  @Post()
  async proposeTreaty(@Body() body: TreatyOfferDto): Promise<TreatyDto> {
    const treaty = await this.treatyService.offerTreaty(body.url);
    if (treaty === null) {
      throw new HttpException('Treaty not created.', HttpStatus.BAD_REQUEST);
    }
    return treaty;
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

  @Delete()
  async removeTreaty(@Body() body: IdDto): Promise<boolean> {
    return this.treatyService.removeTreaty(body.id);
  }
}
