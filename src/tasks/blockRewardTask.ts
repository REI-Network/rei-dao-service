import fs from "fs";
import path from "path";
import { BlockReward } from "../models/BlockReward";
import { logger } from "../logger/logger";
import { config } from "../config/config";
import sequelize from "../db/db";
import { web3, getBlcokRewardFactor } from "../web3";

const STATE_FILE = path.resolve("./output/gxchain.json");
const debug = process.env["NODE_ENV"] == "debug" ? 1 : 0;

let currentblock = 0;
let rewardPerBlock: number;

export const saveState = () => {
  web3.eth.clearSubscriptions(() => {});
  let dataToSave = {
    timestamp: Date.now(),
    currentblock,
  };

  const fileContent = JSON.stringify(dataToSave, null, "  ");
  logger.debug("Saving gxchain2.json", fileContent);

  try {
    fs.writeFileSync(STATE_FILE, fileContent);
  } catch (err) {
    logger.error("ERROR : Saving gxchain2.json", err);
  }
};

const readState = async () => {
  logger.info("Start to read and sync state");
  const rewardFactor = await getBlcokRewardFactor();
  rewardPerBlock = config.gxchain2.rewardPerBlock * rewardFactor;
  try {
    const transaction = await sequelize.transaction();
    const lastInstance = await BlockReward.findOne({
      order: [["blockNumber", "DESC"]],
      transaction,
    });
    currentblock = lastInstance ? lastInstance.blockNumber : 0;
    await transaction.commit();
  } catch (err) {
    throw err;
  }

  while (currentblock <= (await web3.eth.getBlock("latest")).number) {
    const blockNow = await web3.eth.getBlock(currentblock++);
    await _createRecord(blockNow);
  }
  logger.info("readState end");
};

const _createRecord = async (block) => {
  const transaction = await sequelize.transaction();
  const instance = await BlockReward.findByPk(block.number, { transaction });
  if (!instance) {
    await BlockReward.create(
      {
        blockNumber: block.number,
        blockHash: block.hash,
        blockMiner: block.miner,
        blockReward: rewardPerBlock,
      },
      { transaction }
    );
    await transaction.commit();
  } else {
    logger.error("the block exist in record, skip");
  }
};

const dealwithNewBlock = async (blockheader) => {
  if (currentblock > blockheader.number) {
    logger.error("The new blockheader is behand local record");
  } else {
    await _createRecord(blockheader);
  }
};

const _startAfterSync = async (callback) => {
  try {
    let isSyncing = await web3.eth.isSyncing();
    if (isSyncing) {
      logger.info(
        "GXC2.0 block syncing, current block :",
        await web3.eth.getBlock("latest")
      );
      setTimeout(() => {
        _startAfterSync(callback);
      }, 60000);
    } else {
      callback();
    }
  } catch (err) {
    logger.error("ERROR: Get GXC2.0 syncing status failed", err);
    setTimeout(() => {
      _startAfterSync(callback);
    }, 60000);
  }
};

export const start = async () => {
  await readState();
  _startAfterSync(async () => {
    web3.eth
      .subscribe("newBlockHeaders")
      .on("connected", (subscriptionId) => {
        logger.info("New block header subscribed", { subscriptionId });
      })
      .on("data", (blockheader: any) => {
        if (debug) {
          if (blockheader.transactions.length >= 1) {
            dealwithNewBlock(blockheader);
          }
        } else {
          dealwithNewBlock(blockheader);
        }
      })
      .on("changed", function (changed) {
        logger.warn("changed", JSON.stringify(changed, null, "  "));
      })
      .on("error", function (err) {
        logger.error("Error: logs", JSON.stringify(err, null, "  "));
      });
  });
};
