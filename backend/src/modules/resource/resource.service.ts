import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResourceType } from './types';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';
import { randomUUID } from 'crypto';
import { Resource } from '@/modules/resource/schemas/Resource.schema';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions } from 'sequelize';
import { Op } from 'sequelize';

function mapResourceDocumentToResourceStatisticDto(
  resource: Resource,
): ResourceStatisticDto {
  return {
    ownerId: resource.ownerId,
    type: resource.type,
    amount: resource.amount,
    upgradeLevel: resource.upgradeLevel,
  };
}

// TODO make this logic more sophisticated
function getResourceAccumulationPerTick(upgradeLevel: number) {
  return upgradeLevel * 2;
}

const userIdForTestingResourceGeneration = randomUUID();

@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource)
    private resourceModel: typeof Resource,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    console.log('Cron is running...');
    console.time('resource-cron');

    const resources = await this.getStatisticOfAllResources();
    // TODO this could probably be a dedicated function that uses mongoose directly, to limit the amount of requests we send
    await Promise.all(
      resources.map((resource) =>
        this.addAmountOfResource(
          resource.type,
          getResourceAccumulationPerTick(resource.upgradeLevel),
          resource.ownerId,
        ),
      ),
    );

    console.log(resources);

    // TODO remove this temporary solution to creating some initial resource growth
    const stone = await this.getStatisticOfResource(
      ResourceType.STONE,
      userIdForTestingResourceGeneration,
    );
    if (stone.upgradeLevel === 0) {
      await this.addAmountOfResource(
        ResourceType.STONE,
        0,
        userIdForTestingResourceGeneration,
      );
    }
    const wood = await this.getStatisticOfResource(
      ResourceType.WOOD,
      userIdForTestingResourceGeneration,
    );
    if (wood.upgradeLevel === 0) {
      await this.addAmountOfResource(
        ResourceType.WOOD,
        0,
        userIdForTestingResourceGeneration,
      );
    }
    console.timeEnd('resource-cron');
  }

  async getStatisticOfAllResources(
    ownerId?: string,
  ): Promise<Array<ResourceStatisticDto>> {
    const query: FindOptions<Resource>['where'] = {};
    if (ownerId) {
      query.ownerId = ownerId;
    }

    const resources = await this.resourceModel.findAll({ where: query });

    return resources.map(mapResourceDocumentToResourceStatisticDto);
  }

  async getStatisticOfResource(
    type: ResourceType,
    ownerId: string,
  ): Promise<ResourceStatisticDto> {
    const resource = await this.resourceModel.findOne({
      where: { type, ownerId },
    });
    if (resource === null) {
      return {
        ownerId,
        type,
        amount: 0,
        upgradeLevel: 0,
      };
    }
    return mapResourceDocumentToResourceStatisticDto(resource);
  }

  async addAmountOfResource(
    type: ResourceType,
    amount: number,
    ownerId: string,
  ): Promise<number> {
    const entryToIncrement = await this.resourceModel.findOne({
      where: { type, ownerId },
    });

    if (entryToIncrement === null) {
      const createdEntry = await this.resourceModel.create({
        ownerId,
        type,
        amount,
        upgradeLevel: 1,
      });
      return createdEntry.amount;
    }
    entryToIncrement.amount += amount;
    await entryToIncrement.save();
    return entryToIncrement.amount;
  }

  async takeAmountOfResource(
    type: ResourceType,
    amount: number,
    ownerId: string,
  ): Promise<number> {
    const decrementedEntry = await this.resourceModel.findOne({
      where: {
        ownerId,
        type,
        amount: {
          [Op.gte]: amount,
        },
      },
    });
    if (decrementedEntry === null) {
      return 0;
    }
    decrementedEntry.amount -= amount;
    await decrementedEntry.save();
    return amount;
  }

  async addAmountsOfResources(
    resources: Array<{ type: ResourceType; amount: number }>,
    ownerId: string,
    passedTransactionSession?: ClientSession,
  ): Promise<boolean> {
    return transaction(
      this.connection,
      async (session) => {
        await Promise.all(
          resources.map(async ({ type, amount }) => {
            const updatedResource = await this.resourceModel
              .findOneAndUpdate({ type, ownerId }, { $inc: { amount } })
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
    ownerId: string,
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
                  type,
                  ownerId,
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

  async upgradeResource(ownerId: string, type: ResourceType) {
    return transaction(this.connection, async (session) => {
      const resource = await this.resourceModel
        .findOne({ type, ownerId })
        .session(session)
        .exec();

      if (resource === null) {
        throw new Error('You dont have access to this resource yet.');
      }

      // TODO make this logic more sophisticated
      const upgradeCost = resource.upgradeLevel * 25;

      // TODO make this logic more sophisticated
      const upgradeTypeNeeded =
        type === ResourceType.WOOD ? ResourceType.STONE : ResourceType.WOOD;

      const updatedResource = await this.resourceModel
        .findOneAndUpdate(
          {
            type: upgradeTypeNeeded,
            ownerId,
            amount: {
              $gte: upgradeCost,
            },
          },
          { $inc: { amount: -upgradeCost } },
        )
        .session(session)
        .exec();

      if (updatedResource === null) {
        throw new Error(
          'Not enough resources to upgrade. Needed: ' + upgradeCost,
        );
      }

      resource.upgradeLevel += 1;
      await resource.save({ session });

      return mapResourceDocumentToResourceStatisticDto(resource);
    });
  }
}
