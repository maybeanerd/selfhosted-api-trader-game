import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResourceType } from './types';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';
import { Resource, resource } from 'db/schema';
import { userIdForTestingResourceGeneration } from '@/modules/resource/utils/testUser';

function mapResourceDocumentToResourceStatisticDto(
  res: Resource,
): ResourceStatisticDto {
  return {
    ownerId: res.ownerId,
    type: res.type,
    amount: res.amount,
    upgradeLevel: res.upgradeLevel,
  };
}

// TODO make this logic more sophisticated
function getResourceAccumulationPerTick(upgradeLevel: number) {
  return upgradeLevel * 2;
}

@Injectable()
export class ResourceService {
  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    console.log('Cron is running...');
    console.time('resource-cron');

    const resources = await this.getStatisticOfAllResources();
    // TODO this could probably be a dedicated function that uses mongoose directly, to limit the amount of requests we send
    await Promise.all(
      resources.map((res) =>
        this.addAmountOfResource(
          res.type,
          getResourceAccumulationPerTick(res.upgradeLevel),
          res.ownerId,
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
    const resources = resource.query;
    // const resources = await this.resourceModel.findAll({ where: query });

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
    passedTransaction?: Transaction,
  ): Promise<boolean> {
    return this.sequelize.transaction(async (newTransaction) => {
      const transaction = passedTransaction ?? newTransaction;
      await Promise.all(
        resources.map(async ({ type, amount }) => {
          const resourceToBeUpdated = await this.resourceModel.findOne({
            where: { type, ownerId },
            transaction: transaction,
          });

          if (resourceToBeUpdated === null) {
            await this.resourceModel.create(
              {
                type,
                amount,
                accumulationPerTick: 0,
              },
              { transaction },
            );
          } else {
            resourceToBeUpdated.amount += amount;
            await resourceToBeUpdated.save({ transaction });
          }
        }),
      );

      return true;
    });
  }

  async takeAmountsOfResources(
    resources: Array<{ type: ResourceType; amount: number }>,
    ownerId: string,
    passedTransaction?: Transaction,
  ): Promise<boolean> {
    return this.sequelize.transaction(async (newTransaction) => {
      const transaction = passedTransaction ?? newTransaction;

      try {
        await Promise.all(
          resources.map(async ({ type, amount }) => {
            const resourceToReduce = await this.resourceModel.findOne({
              where: {
                type,
                ownerId,
                amount: {
                  [Op.gte]: amount,
                },
              },
              transaction,
            });

            if (resourceToReduce === null) {
              throw Error('Not enough resources to take.');
            } else {
              resourceToReduce.amount -= amount;
              await resourceToReduce.save({ transaction });
              return resourceToReduce;
            }
          }),
        );
        return true;
      } catch {
        return false;
      }
    });
  }

  async upgradeResource(ownerId: string, type: ResourceType) {
    return this.sequelize.transaction(async (transaction) => {
      const resource = await this.resourceModel.findOne({
        where: { type, ownerId },
        transaction,
      });

      if (resource === null) {
        throw new Error('You dont have access to this resource yet.');
      }

      // TODO make this logic more sophisticated
      const upgradeCost = resource.upgradeLevel * 25;

      // TODO make this logic more sophisticated
      const upgradeTypeNeeded =
        type === ResourceType.WOOD ? ResourceType.STONE : ResourceType.WOOD;

      const resourceToUpdate = await this.resourceModel.findOne({
        where: {
          type: upgradeTypeNeeded,
          ownerId,
          amount: {
            [Op.gte]: upgradeCost,
          },
        },
        transaction,
      });
      if (resourceToUpdate === null) {
        throw new Error(
          'Not enough resources to upgrade. Needed: ' + upgradeCost,
        );
      } else {
        resourceToUpdate.amount -= upgradeCost;
        await resourceToUpdate.save({ transaction });
      }

      resource.upgradeLevel += 1;
      await resource.save({ transaction });

      return mapResourceDocumentToResourceStatisticDto(resource);
    });
  }
}
