import { Model, DataTypes } from "sequelize";
import sequelize from "../db/db";
export class Deposit extends Model {}

export declare interface Deposit {
  txHash: string;
  by: string;
  amount: bigint;
  to: string;
}

Deposit.init(
  {
    txHash: {
      type: DataTypes.STRING,
      primaryKey: true,
      comment: "transaction hash",
    },
    by: {
      type: DataTypes.STRING,
      comment: "by address",
    },
    amount: {
      type: DataTypes.DECIMAL(65, 0),
    },
    to: {
      type: DataTypes.STRING,
      comment: "to address",
    },
  },
  {
    sequelize,
    tableName: "deposit",
  }
);

export default Deposit;
