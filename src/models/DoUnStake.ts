import { Model, DataTypes } from "sequelize";
import sequelize from "../db/db";
export class DoUnStake extends Model {}

export declare interface DoUnStake {
  txHash: string;
  id: number;
  from: string;
  validator: string;
  to: string;
  amount: bigint;
  timestamp: string;
}

DoUnStake.init(
  {
    txHash: {
      type: DataTypes.STRING,
      primaryKey: true,
      comment: "Transaction hash",
    },
    id: {
      type: DataTypes.INTEGER,
      comment: "Unique unstake id",
    },
    from: {
      type: DataTypes.STRING,
      comment: "from address",
    },
    validator: {
      type: DataTypes.STRING,
      comment: "validator address",
    },
    to: {
      type: DataTypes.STRING,
      comment: "to address",
    },
    amount: {
      type: DataTypes.DECIMAL(65, 0),
      comment: "GXC amount",
    },
    timestamp: {
      type: DataTypes.STRING,
      comment: "timestamp",
    },
  },
  {
    sequelize,
    tableName: "doUnstake",
  }
);

export default DoUnStake;
