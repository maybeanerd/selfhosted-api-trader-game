import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { TreatyService } from './treaty.service';
import { SignTreatyDto } from './dto/Treaty.dto';

@Controller({ path: 'crossroads/treaty', version: '1' })
export class TreatyController {
  constructor(private readonly treatyService: TreatyService) {}

  @Post()
  async signTreaty(@Body() body: SignTreatyDto): Promise<SignTreatyDto> {
    return this.treatyService.signTreaty(body.instanceId, body.url);
  }

  @Put()
  async updateTreaty(@Body() body: SignTreatyDto): Promise<SignTreatyDto> {
    const updatedTreaty = await this.treatyService.updateTreaty(
      body.instanceId,
      body.url,
    );
    if (updatedTreaty === null) {
      throw new HttpException('Treaty not found.', HttpStatus.NOT_FOUND);
    }
    return updatedTreaty;
  }

  // TODO remove treaty
}
