import { ResourceType } from '@/modules/resource/types';
import { Column, Model, Table, DataType } from 'sequelize-typescript';

export type ResourceWithAmount = {
  amount: number;
  type: ResourceType;
};

@Table
export class Trade extends Model {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
    id: string;

  @Column({ allowNull: false, type: DataType.UUID })
    creatorId: string;

  @Column({ allowNull: false, type: DataType.ARRAY(DataType.JSONB) })
    offeredResources: Array<ResourceWithAmount>;

  @Column({ allowNull: false, type: DataType.ARRAY(DataType.JSONB) })
    requestedResources: Array<ResourceWithAmount>;

  /**
   * The Id of a connected remote instance if the trade comes from a remote one.
   */
  @Column({ allowNull: true, type: DataType.UUID })
    remoteInstanceId?: string;
}
