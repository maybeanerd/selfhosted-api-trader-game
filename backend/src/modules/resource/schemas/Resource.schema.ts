import { Column, Model, Table, DataType } from 'sequelize-typescript';
import { ResourceType } from '../types';

const uniqueKey = 'ownerAndType';

@Table
export class Resource extends Model {
  @Column({ allowNull: false, type: DataType.UUID, unique: uniqueKey })
    ownerId: string;

  @Column({ allowNull: false })
    amount: number;

  @Column({ allowNull: false })
    upgradeLevel: number;

  @Column({
    allowNull: false,
    type: DataType.ENUM(...Object.values(ResourceType)),
    unique: uniqueKey,
  })
    type: ResourceType;
}
