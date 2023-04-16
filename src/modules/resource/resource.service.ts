import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResourceType } from './types';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Resource, ResourceDocument } from './schemas/Resource.schema';
import { ClientSession, Connection, Model } from 'mongoose';
import { transaction } from '@/util/mongoDbTransaction';

function mapResourceDocumentToResourceStatisticDto(
  resourceDocument: ResourceDocument,
): ResourceStatisticDto {
  const resource = resourceDocument.toObject();
  return {
    type: resource.type,
    amount: resource.amount,
    accumulationPerTick: resource.accumulationPerTick,
  };
}

@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource.name)
    private resourceModel: Model<Resource>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    console.log('Cron is running...');
    console.time('resource-cron');

    const resources = await this.getStatisticOfAllResources();
    // TODO this could probably be a dedicated function that uses mongoose directly, to limit the amount of requests we send
    await Promise.all(
      resources.map((resource) =>
        this.addAmountOfResource(resource.type, resource.accumulationPerTick),
      ),
    );

    console.log(resources);

    // TODO remove this temporary solution to creating some initial resource growth
    const stone = await this.getStatisticOfResource(ResourceType.STONE);
    if (stone.accumulationPerTick === 0) {
      await this.addAmountOfResource(ResourceType.STONE, 0);
    }
    const wood = await this.getStatisticOfResource(ResourceType.WOOD);
    if (wood.accumulationPerTick === 0) {
      await this.addAmountOfResource(ResourceType.WOOD, 0);
    }

    console.timeEnd('resource-cron');
  }

  async getStatisticOfAllResources(): Promise<Array<ResourceStatisticDto>> {
    const resources = await this.resourceModel.find();

    return resources.map(mapResourceDocumentToResourceStatisticDto);
  }

  async getStatisticOfResource(
    type: ResourceType,
  ): Promise<ResourceStatisticDto> {
    const resource = await this.resourceModel.findOne({ type });
    if (resource === null) {
      return {
        type,
        amount: 0,
        accumulationPerTick: 0,
      };
    }
    return mapResourceDocumentToResourceStatisticDto(resource);
  }

  async addAmountOfResource(
    type: ResourceType,
    amount: number,
  ): Promise<number> {
    const incrementedEntry = await this.resourceModel.findOneAndUpdate(
      { type },
      { $inc: { amount } },
    );
    if (incrementedEntry === null) {
      const createdEntry = await this.resourceModel.create({
        type,
        amount,
        accumulationPerTick: 2,
      });
      return createdEntry.amount;
    }
    return incrementedEntry.amount;
  }

  async takeAmountOfResource(
    type: ResourceType,
    amount: number,
  ): Promise<number> {
    const decrementedEntry = await this.resourceModel.findOneAndUpdate(
      {
        type,
        amount: {
          $gte: amount,
        },
      },
      { $inc: { amount: -amount } },
    );
    if (decrementedEntry === null) {
      return 0;
    }
    return amount;
  }

  async addAmountsOfResources(
    resources: Array<{ type: ResourceType; amount: number }>,
    passedTransactionSession?: ClientSession,
  ): Promise<boolean> {
    return transaction(
      this.connection,
      async (session) => {
        await Promise.all(
          resources.map(async ({ type, amount }) => {
            const updatedResource = await this.resourceModel
              .findOneAndUpdate({ type }, { $inc: { amount } })
              .session(session)
              .exec();

            if (updatedResource === null) {
              await this.resourceModel.create(
                {
                  type,
                  amount,
                  accumulationPerTick: 0,
                },
                { session },
              );
            }
          }),
        );

        return true;
      },
      passedTransactionSession,
    );
  }

  async takeAmountsOfResources(
    resources: Array<{ type: ResourceType; amount: number }>,
    passedTransactionSession?: ClientSession,
  ): Promise<boolean> {
    return transaction(
      this.connection,
      async (session) => {
        const tookResources = await Promise.all(
          resources.map(({ type, amount }) =>
            this.resourceModel
              .findOneAndUpdate(
                {
                  type: type,
                  amount: {
                    $gte: amount,
                  },
                },
                { $inc: { amount: -amount } },
              )
              .session(session)
              .exec(),
          ),
        );

        const failedToTakeAllResources = tookResources.includes(null);

        return !failedToTakeAllResources;
      },
      passedTransactionSession,
    );
  }
}
