import { Model, DataTypes } from "sequelize";
import sequelize from "../db/db";
export class Stake extends Model {}

export declare interface Stake {
  txHash: string;
  from: string;
  validator: string;
  value: bigint;
  to: string;
  shares: bigint;
}

Stake.init(
  {
    txHash: {
      type: DataTypes.STRING,
      primaryKey: true,
      comment: "transaction hash",
    },
    from: {
      type: DataTypes.STRING,
      comment: "from address",
    },
    validator: {
      type: DataTypes.STRING,
      comment: "validator address",
    },
    value: {
      type: DataTypes.DECIMAL(65, 0),
      comment: "stake value",
    },
    to: {
      type: DataTypes.STRING,
      comment: "to address",
    },
    shares: {
      type: DataTypes.DECIMAL(65, 0),
      comment: "shares value",
    },
  },
  {
    sequelize,
    tableName: "stake",
  }
);

export default Stake;
