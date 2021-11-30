import path from "path";
import { BlockReward } from "../models/BlockReward";
import { logger } from "../logger/logger";
import { config } from "../config/config";
import sequelize from "../db/db";
import { web3, getBlcokRewardFactor } from "../web3";
import { Queue } from "../queue";
import { BlockHeader } from "web3-eth";
import Semaphore from "semaphore-async-await";
import { Op } from "sequelize";

// const STATE_FILE = path.resolve("./output/gxchain.json");
const debug = process.env["NODE_ENV"] == "debug" ? 1 : 0;
const countOnce = 10;
const countLimit = 100;
const lock = new Semaphore(1);

const headerQueue = new Queue<BlockHeader>();
let rewardPerBlock: string;

export async function readState() {
  await lock.acquire();
  logger.info("Start to read and sync state");
  const rewardFactor = await getBlcokRewardFactor();
  rewardPerBlock = BigInt(
    (config.gxchain2.rewardPerBlock * rewardFactor) / 100
  ).toString();
  const blockNow = await web3.eth.getBlock("latest");
  headerQueue.push(blockNow);
  logger.info("End read and sync state");
  lock.release();
}

async function _tryGetBlcoks(start: number, end: number) {
  const transaction = await sequelize.transaction();
  try {
    const blocks = await BlockReward.findAll({
      where: { blockNumber: { [Op.between]: [start, end] } },
      order: [["blockNumber", "DESC"]],
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
    const start = latestHeight - count;
    const blocks = await _tryGetBlcoks(start, latestHeight);
    for (let i = 0; i < blocks.length; i++) {
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
    counter -= count;
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
      const blocks = await _tryGetBlcoks(check, check);
      if (blocks[0]) {
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
      } else {
        end = check - 1;
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
    try {
      const databaseBlock = await BlockReward.findOne({
        where: { blockHash: blockheader.parentHash },
        transaction,
      });
      await transaction.commit();
      if (databaseBlock !== null) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      logger.error(err);
      await transaction.rollback();
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
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger.error(err);
  }
}

async function _restoreBlockRecord(blockNumberNow: number) {
  let acientblockNumber = await findAncient(blockNumberNow);
  await _deleteForkBlocks(acientblockNumber);
  await _catchBlock(acientblockNumber + 1, blockNumberNow);
}

async function _catchBlock(fromBlock: number, targetBlock: number) {
  while (fromBlock <= targetBlock) {
    const blockNow = await web3.eth.getBlock(fromBlock++);
    await _createRecord(blockNow);
  }
}

async function _createRecord(block: BlockHeader) {
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
          nonce: block.nonce,
          transactionRoot: block.transactionRoot,
          stateRoot: block.stateRoot,
          receiptRoot: block.receiptRoot,
          gasLimit: block.gasLimit,
          gasUsed: block.gasUsed,
          timestamp: block.timestamp,
        },
        { transaction }
      );
    } else {
      logger.error("the block exist in record, skip");
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger.error(err);
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
    if (await checkAncient(header)) {
      await _createRecord(header);
    } else {
      await _restoreBlockRecord(header.number);
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
  _startAfterSync(async () => {
    web3.eth
      .subscribe("newBlockHeaders")
      .on("connected", (subscriptionId) => {
        logger.info("New block header subscribed", { subscriptionId });
      })
      .on("data", async (blockheader: any) => {
        if (debug) {
          if ((await blockheader.transactions.length) >= 1) {
            headerQueue.push(blockheader);
          }
        } else {
          headerQueue.push(blockheader);
        }
      })
      .on("changed", function (changed) {
        logger.warn("changed", JSON.stringify(changed, null, "  "));
      })
      .on("error", function (err) {
        logger.error("Error: logs", JSON.stringify(err, null, "  "));
      });
  });
  headersLoop();
};
