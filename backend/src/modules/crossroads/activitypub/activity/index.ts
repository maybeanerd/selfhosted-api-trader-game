export enum SupportedActivityType {
  'Create' = 'Create',
  'Update' = 'Update',
  'Delete' = 'Delete',
  'Follow' = 'Follow',
  'Accept' = 'Accept',
  'Like' = 'Like',
  'Undo' = 'Undo',
}

export function isSupportedActivityType(
  type: string,
): type is SupportedActivityType {
  return Object.values(SupportedActivityType).includes(
    type as SupportedActivityType,
  );
}
