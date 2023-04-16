import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreatyController } from './treaty.controller';
import { TreatyService } from './treaty.service';
import { StoredTreaty, StoredTreatySchema } from './schemas/Treaty.schema';
import {
  StoredTreatyBasis,
  StoredTreatyBasisSchema,
} from './schemas/TreatyBasis.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoredTreaty.name, schema: StoredTreatySchema },
      { name: StoredTreatyBasis.name, schema: StoredTreatyBasisSchema },
    ]),
  ],
  controllers: [TreatyController],
  providers: [TreatyService],
})
export class TreatyModule {}
