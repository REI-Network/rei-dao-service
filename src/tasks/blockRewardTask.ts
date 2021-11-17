import path from "path";
import { BlockReward } from "../models/BlockReward";
import { logger } from "../logger/logger";
import { config } from "../config/config";
import sequelize from "../db/db";
import { web3, getBlcokRewardFactor } from "../web3";
import { Queue } from "../queue";
import { BlockHeader } from "web3-eth";
import { Op } from "sequelize";

const STATE_FILE = path.resolve("./output/gxchain.json");
const debug = process.env["NODE_ENV"] == "debug" ? 1 : 0;
const countOnce = 10;
const countLimit = 100;

const headerQueue = new Queue<BlockHeader>();
let currentBlockNumber = 0;
let rewardPerBlock: bigint;

export async function readState() {
  logger.info("Start to read and sync state");
  const rewardFactor = await getBlcokRewardFactor();
  rewardPerBlock = BigInt(config.gxchain2.rewardPerBlock * rewardFactor);
  let blockNumberNow = (await web3.eth.getBlock("latest")).number;
  let acientblockNumber = await findAncient(blockNumberNow);
  await _deleteForkBlocks(acientblockNumber);
  while (blockNumberNow <= (await web3.eth.getBlock("latest")).number) {
    await _catchBlock(acientblockNumber, blockNumberNow);
    acientblockNumber = blockNumberNow++;
  }
  currentBlockNumber = acientblockNumber;
}

async function _tryGetBlcoks(latestHeight: number, count: number) {
  const transaction = await sequelize.transaction();
  try {
    const blocks = await BlockReward.findAll({
      offset: latestHeight,
      order: [["blockNumber", "DESC"]],
      limit: count,
      transaction,
    });
    await transaction.commit();
    return blocks;
  } catch (err) {
    await transaction.rollback();
    logger.error(err);
  }
}

async function _findAncient(latestHeight: number, counter: number) {
  while (counter > 0) {
    const count = latestHeight >= countOnce ? countOnce : latestHeight;
    counter -= count;
    const blocks = await _tryGetBlcoks(latestHeight, count);
    for (let i = blocks.length - 1; i >= 0; i--) {
      try {
        const databaseBlock = blocks[i];
        const remoteBlock = await web3.eth.getBlock(databaseBlock.blockNumber);
        if (remoteBlock.hash == databaseBlock.blockHash) {
          return remoteBlock.number;
        }
      } catch (err) {
        throw err;
      }
    }
    latestHeight -= count;
  }
  return -1;
}

async function findAncient(latestHeight: number): Promise<number> {
  if (latestHeight == 0) {
    return 0;
  }
  const ifEnough = latestHeight > countLimit ? true : false;
  const counter = ifEnough ? countLimit : latestHeight;
  const result = await _findAncient(latestHeight, counter);
  if (result !== -1) {
    return result;
  }
  if (ifEnough) {
    let end = latestHeight - counter;
    let start = 0;
    let result = -1;
    while (start <= end) {
      const check = Math.floor((start + end) / 2);
      const blocks = await _tryGetBlcoks(check, 1);
      try {
        const remoteBlock = await web3.eth.getBlock(blocks[0].blockNumber);
        if (remoteBlock.hash == blocks[0].blockHash) {
          start = check + 1;
          result = remoteBlock.number;
        } else {
          end = check - 1;
        }
      } catch (err) {
        throw err;
      }
    }
    if (result !== -1) {
      return result;
    }
  }
  return 0;
}

async function checkAncient(blockheader: BlockHeader) {
  const checkBlockNumber = blockheader.number - 1;
  if (checkBlockNumber < 0) {
    return true;
  } else {
    const transaction = await sequelize.transaction();
    const databaseBlock = await BlockReward.findOne({
      where: { blockHash: blockheader.parentHash },
      transaction,
    });
    if (databaseBlock) {
      return true;
    } else {
      return false;
    }
  }
}

async function _deleteForkBlocks(ancientHeight: number) {
  const transaction = await sequelize.transaction();
  try {
    await BlockReward.destroy({
      where: {
        blockNumber: { [Op.gt]: ancientHeight },
      },
      transaction,
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function _catchBlock(fromBlock: number, targetBlock: number) {
  while (fromBlock <= targetBlock) {
    const blockNow = await web3.eth.getBlock(fromBlock++);
    await _createRecord(blockNow);
  }
}

async function _createRecord(block) {
  const transaction = await sequelize.transaction();
  try {
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
  } catch (err) {
    await transaction.rollback();
    logger.error(err);
  }
}

async function dealwithNewBlock(blockheader) {
  if (currentBlockNumber > blockheader.number) {
    logger.error("The new blockheader is behand local record");
  } else {
    headerQueue.push(blockheader);
  }
}

async function headersLoop() {
  logger.info("start headersLoop loop");
  while (1) {
    let header = headerQueue.pop();
    if (!header) {
      header = await new Promise<BlockHeader>((resolve) => {
        headerQueue.queueresolve = resolve;
      });
    }
    if (checkAncient(header)) {
    } else {
    }
  }
}

async function _startAfterSync(callback) {
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
}

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
