import { Model, DataTypes } from "sequelize";
import sequelize from "../db/db";
export class Withdraw extends Model {}

export declare interface Withdraw {
  txHash: string;
  by: string;
  amount: bigint;
  from: string;
}

Withdraw.init(
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
    from: {
      type: DataTypes.STRING,
      comment: "to address",
    },
  },
  {
    sequelize,
    tableName: "withdraw",
  }
);

export default Withdraw;
