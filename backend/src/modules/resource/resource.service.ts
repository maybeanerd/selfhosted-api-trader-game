import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResourceType } from './types';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';
import { Resource, resource } from 'db/schema';
import { userIdForTestingResourceGeneration } from '@/modules/resource/utils/testUser';
import { drizz } from 'db';
import { and, eq } from 'drizzle-orm';

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
    const resources = await drizz.query.resource.findMany({
      where: (r) => eq(r.ownerId, ownerId ?? r.ownerId),
    });

    return resources.map(mapResourceDocumentToResourceStatisticDto);
  }

  async getStatisticOfResource(
    type: ResourceType,
    ownerId: string,
  ): Promise<ResourceStatisticDto> {
    const res = await drizz.query.resource.findFirst({
      where: (r) => and(eq(r.type, type), eq(r.ownerId, ownerId)),
    });

    if (res === undefined) {
      return {
        ownerId,
        type,
        amount: 0,
        upgradeLevel: 0,
      };
    }
    return mapResourceDocumentToResourceStatisticDto(res);
  }

  async addAmountOfResource(
    type: ResourceType,
    amount: number,
    ownerId: string,
  ): Promise<number> {
    return drizz.transaction(async (tx) => {
      const existingResource = await tx.query.resource.findFirst({
        where: (r) => and(eq(r.type, type), eq(r.ownerId, ownerId)),
      });

      if (existingResource === undefined) {
        await tx.insert(resource).values({
          ownerId,
          type,
          amount,
          upgradeLevel: 1,
        });
        return amount;
      }

      const updatedResources = await tx
        .update(resource)
        .set({ amount: existingResource.amount + amount })
        .where(and(eq(resource.type, type), eq(resource.ownerId, ownerId)))
        .returning({ amount: resource.amount });

      const updatedResource = updatedResources.at(0);
      if (updatedResource === undefined) {
        throw new Error('Failed updating resource amount.');
      }
      return updatedResource.amount;
    });
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
