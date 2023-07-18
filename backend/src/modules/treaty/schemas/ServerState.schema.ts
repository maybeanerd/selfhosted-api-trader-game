import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table
export class ServerState extends Model {
  /**
   * The Id we created for this instance.
   */
  @Column({
    allowNull: false,
    unique: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
    instanceId: string;
}
