import { EventPayload, EventType } from '@/modules/crossroads/event/types';
import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table
export class StoredEvent extends Model {
  @Column({
    allowNull: false,
    unique: true,
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
    id: string;

  /**
   * The date this event was created on.
   */
  @Column({
    allowNull: false,
    type: DataType.DATE,
  })
    createdOn: Date;

  /**
   * The date this instance first received this event.
   *
   * Maybe in the future this can be used to determine lag between instances or similar things.
   *
   */
  @Column({
    allowNull: false,
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
    receivedOn: Date;

  /**
   * The Id of a connected remote instance if the trade comes from a remote one.
   */
  @Column({
    allowNull: true,
    type: DataType.UUID,
  })
    remoteInstanceId: string | null;

  @Column({
    allowNull: false,
    type: DataType.ENUM(...Object.values(EventType)),
  })
    type: EventType;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
    payload: EventPayload;
}
