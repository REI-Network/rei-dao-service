import sequelize from "../db/db";
import { Model, DataTypes } from "sequelize";

export class BlockReward extends Model {}

export declare interface BlockReward {
  blockNumber: number;
  blockHash: string;
  blockMiner: string;
  blockReward: bigint;
  nocne: string;
  transactionRoot: string;
  stateRoot: string;
  receiptRoot: string;
  gasLimit: number;
  gasUsed: number;
  timestamp: string;
}

BlockReward.init(
  {
    blockNumber: {
      type: DataTypes.INTEGER,
    },
    blockHash: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    blockMiner: {
      type: DataTypes.STRING,
    },
    blockReward: {
      type: DataTypes.BIGINT({ length: 80, unsigned: true }),
    },
    nonce: {
      type: DataTypes.STRING,
    },
    transactionRoot: {
      type: DataTypes.STRING,
    },
    stateRoot: {
      type: DataTypes.STRING,
    },
    receiptRoot: {
      type: DataTypes.STRING,
    },
    gasLimit: {
      type: DataTypes.INTEGER,
    },
    gasUsed: {
      type: DataTypes.INTEGER,
    },
    timestamp: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
    tableName: "blockReward",
  }
);
