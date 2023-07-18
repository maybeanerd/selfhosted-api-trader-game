import { Column, Model, Table, DataType } from 'sequelize-typescript';
import { ResourceType } from '../types';

@Table
export class Resource extends Model {
  @Column({ allowNull: false, type: DataType.UUID  })
    ownerId: string;

  @Column({ allowNull: false })
    amount: number;

  @Column({ allowNull: false  })
    upgradeLevel: number;

  @Column({
    allowNull: false,
    type: DataType.ENUM(...Object.values(ResourceType)),
  })
    type: ResourceType;
}
