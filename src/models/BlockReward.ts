import sequelize from "../db/db";
import { Model, DataTypes } from "sequelize";

export class BlockReward extends Model {}

export declare interface BlockReward {
  blockNumber: number;
  blockHash: string;
  blockMiner: string;
  blockReward: bigint;
}

BlockReward.init(
  {
    blockNumber: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
    },
    blockHash: {
      type: DataTypes.STRING,
    },
    blockMiner: {
      type: DataTypes.STRING,
    },
    blockReward: {
      type: DataTypes.BIGINT,
    },
  },
  {
    sequelize,
    tableName: "blockReward",
  }
);
