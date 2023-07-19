import { Column, Model, Table, DataType } from 'sequelize-typescript';

export enum TreatyStatus {
  Requested = 'requested',
  Denied = 'denied',
  Signed = 'signed',
}

@Table
export class StoredTreaty extends Model {
  /**
   * The Id of the instance this treaty was made with.
   */
  @Column({
    allowNull: false,
    unique: true,
    primaryKey: true,
    type: DataType.UUIDV4,
    defaultValue: DataType.UUIDV4,
  })
    instanceId: string;

  /**
   * The URL this instance can be reached at.
   * */

  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING,
  })
    instanceBaseUrl: string;

  /**
   * The state of the treaty. A treaty is a request at first, and then either gets accepted or denied by the other instance.
   */
  @Column({
    allowNull: false,
    type: DataType.ENUM(...Object.values(TreatyStatus)),
    defaultValue: TreatyStatus.Requested,
  })
    status: TreatyStatus;

  /**
   * The date this treaty was created on.
   */
  @Column({
    allowNull: false,
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
    createdOn: Date;
}
