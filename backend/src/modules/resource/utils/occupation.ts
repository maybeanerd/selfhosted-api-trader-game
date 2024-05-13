import { Occupation, ResourceType } from '@/modules/resource/types';

const occupationResources: Record<Occupation, Array<ResourceType>> = {
  [Occupation.MINER]: [ResourceType.STONE],
  [Occupation.LOGGER]: [ResourceType.WOOD],
  [Occupation.HUNTER]: [ResourceType.LEATHER],
};

export function getOccupationalResources(
  occupation: Occupation,
): Array<ResourceType> {
  return occupationResources[occupation];
}
