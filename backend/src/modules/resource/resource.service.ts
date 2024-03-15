import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResourceType } from './types';
import { ResourceStatisticDto } from './dto/ResourceStatistic.dto';
import { Resource, resource } from 'db/schema';
import { userIdForTestingResourceGeneration } from '@/modules/resource/utils/testUser';
import { type DbTransaction, drizz } from 'db';
import { and, eq, gte } from 'drizzle-orm';

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
    passedTransaction?: DbTransaction,
  ): Promise<number> {
    return drizz.transaction(async (newTransaction) => {
      const transaction = passedTransaction ?? newTransaction;
      const existingResource = await transaction.query.resource.findFirst({
        where: (r) => and(eq(r.type, type), eq(r.ownerId, ownerId)),
      });

      if (existingResource === undefined) {
        await transaction.insert(resource).values({
          ownerId,
          type,
          amount,
          upgradeLevel: 1,
        });
        return amount;
      }

      const updatedResources = await transaction
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
    passedTransaction?: DbTransaction,
  ): Promise<number> {
    return drizz.transaction(async (newTransaction) => {
      const transaction = passedTransaction ?? newTransaction;
      const existingResource = await transaction.query.resource.findFirst({
        where: (r) =>
          and(eq(r.type, type), eq(r.ownerId, ownerId), gte(r.amount, amount)),
      });

      if (existingResource === undefined) {
        throw new Error('Not enough resources to take.');
      }

      const updatedResources = await transaction
        .update(resource)
        .set({ amount: existingResource.amount - amount })
        .where(and(eq(resource.type, type), eq(resource.ownerId, ownerId)))
        .returning({ amount: resource.amount });

      const updatedResource = updatedResources.at(0);
      if (updatedResource === undefined) {
        throw new Error('Failed updating resource amount.');
      }
      return updatedResource.amount;
    });
  }

  async addAmountsOfResources(
    resources: Array<{ type: ResourceType; amount: number }>,
    ownerId: string,
    passedTransaction?: DbTransaction,
  ): Promise<boolean> {
    return drizz.transaction(async (newTransaction) => {
      const transaction = passedTransaction ?? newTransaction;
      await Promise.all(
        resources.map(({ type, amount }) =>
          // TODO solve this in a single query rather than many
          this.addAmountOfResource(type, amount, ownerId, transaction),
        ),
      );

      return true;
    });
  }

  async takeAmountsOfResources(
    resources: Array<{ type: ResourceType; amount: number }>,
    ownerId: string,
    passedTransaction?: DbTransaction,
  ): Promise<boolean> {
    try {
      await drizz.transaction(async (newTransaction) => {
        const transaction = passedTransaction ?? newTransaction;
        await Promise.all(
          resources.map(({ type, amount }) =>
            // TODO solve this in a single query rather than many
            this.takeAmountOfResource(type, amount, ownerId, transaction),
          ),
        );
      });
      return true;
    } catch {
      return false;
    }
  }

  async upgradeResource(ownerId: string, type: ResourceType) {
    return drizz.transaction(async (transaction) => {
      const existingResource = await transaction.query.resource.findFirst({
        where: (r) => and(eq(r.ownerId, ownerId), eq(r.type, type)),
      });

      if (existingResource === undefined) {
        throw new Error('You dont have access to this resource yet.');
      }

      // TODO make this logic more sophisticated
      const upgradeCost = existingResource.upgradeLevel * 25;

      // TODO make this logic more sophisticated
      const upgradeTypeNeeded =
        type === ResourceType.WOOD ? ResourceType.STONE : ResourceType.WOOD;

      await this.takeAmountOfResource(
        upgradeTypeNeeded,
        upgradeCost,
        ownerId,
        transaction,
      );

      const updatedResources = await transaction
        .update(resource)
        .set({
          upgradeLevel: existingResource.upgradeLevel + 1,
        })
        .where(and(eq(resource.ownerId, ownerId), eq(resource.type, type)))
        .returning();

      const updatedResource = updatedResources.at(0);

      if (updatedResource === undefined) {
        throw new Error('Failed updating resource upgrade level.');
      }

      return mapResourceDocumentToResourceStatisticDto(updatedResource);
    });
  }
}
