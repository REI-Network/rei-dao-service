import fs from "fs";
import path from "path";
import Deposit from "../models/Deposit";
import Withdraw from "../models/Withdraw";
import { logger } from "../logger/logger";
import { config } from "../config/config";
import { web3, getFeeAddress } from "../web3";
import { feeDecodeLog } from "../abi/Fee";
import sequelize from "../db/db";
import { Queue } from "../queue";
import { Log } from "web3-core";

const STATE_FILE = path.resolve("./output/fee.json");
const logQueue = new Queue<Log>();
let currentBlock = 0;

export const saveState = () => {
  let dataToSave = {
    timestamp: new Date().toISOString(),
    currentBlock,
  };

  let fileContent = JSON.stringify(dataToSave, null, "  ");
  logger.debug("Saving eth.json", fileContent);
  try {
    fs.writeFileSync(STATE_FILE, fileContent);
  } catch (ex) {
    logger.error("Error: Saving eth.json", ex);
  }
};

export const readState = async () => {
  try {
    let state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8") || "{}");
    currentBlock = state.currentBlock || config.gxchain2.origin_block;
  } catch (ex) {
    logger.error("Error reading eth.json", ex.message);
    currentBlock = config.gxchain2.origin_block;
  }
};

const dealWithDeposit = async (receipt, tx) => {
  logger.info("New Fee Deposit tx detected : ", tx.hash);
  const transaction = await sequelize.transaction();
  try {
    let instance = await Deposit.findByPk(tx.hash, { transaction });
    if (!instance) {
      let depositParams = feeDecodeLog(
        "Deposit",
        receipt.data,
        receipt.topics.slice(1)
      );
      if (depositParams.by && depositParams.to && depositParams.amount) {
        logger.info("Creating new record of Deposit");
        await Deposit.create(
          {
            txHash: tx.hash,
            by: depositParams.by,
            amount: depositParams.amount,
            to: depositParams.to,
          },
          { transaction }
        );
      } else {
        logger.log("Illegal Deposit record find", depositParams, tx);
      }
    } else {
      logger.error(`The tx ${tx.hash} already exist in Deposit records, skip`);
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger.error(err);
  }
};

const dealWithWithdraw = async (receipt, tx) => {
  logger.info("New Fee Withdraw tx detected : ", tx.hash);
  const transaction = await sequelize.transaction();
  try {
    let instance = await Withdraw.findByPk(tx.hash, { transaction });
    if (!instance) {
      let withdrawParams = feeDecodeLog(
        "Withdraw",
        receipt.data,
        receipt.topics.slice(1)
      );
      if (withdrawParams.by && withdrawParams.to && withdrawParams.amount) {
        logger.info("Creating new record of Withdraw");
        await Withdraw.create(
          {
            txHash: tx.hash,
            by: withdrawParams.by,
            amount: withdrawParams.amount,
            from: withdrawParams.from,
          },
          { transaction }
        );
      } else {
        logger.log("Illegal Withdraw record find", withdrawParams, tx);
      }
    } else {
      logger.error(`The tx ${tx.hash} already exist in Withdraw records, skip`);
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    logger.error(err);
  }
};

const dealWithTopic = async (receipt) => {
  try {
    let txid = receipt.transactionHash;
    let tx = await web3.eth.getTransaction(txid);
    if (!tx) {
      logger.warn("Connot get transaction by txid", txid);
    }
    if (receipt.topics[0] == config.gxchain2.topics.Deposit) {
      await dealWithDeposit(receipt, tx);
    }
    if (receipt.topics[0] == config.gxchain2.topics.Withdraw) {
      await dealWithWithdraw(receipt, tx);
    }
    currentBlock = tx.blockNumber;
  } catch (err) {
    logger.error("Error: Dealing with receipt", receipt, err);
  }
};

const FeelogsLoop = async () => {
  logger.info("start FeelogsLoop loop");
  while (1) {
    let log = logQueue.pop();
    if (!log) {
      log = await new Promise<Log>((resolve) => {
        logQueue.queueresolve = resolve;
      });
    }
    await dealWithTopic(log);
  }
};

const _startAfterSync = async (callback) => {
  try {
    let isSyncing = await web3.eth.isSyncing();
    if (isSyncing) {
      logger.info(
        "Eth block syncing, currnet block",
        await web3.eth.getBlock("latest")
      );
      setTimeout(() => {
        _startAfterSync(callback);
      }, 60000);
    } else {
      callback();
    }
  } catch (ex) {
    logger.error("Error: Get ETH syncing status failed", ex);
    setTimeout(() => {
      _startAfterSync(callback);
    }, 60000);
  }
};

export const start = async () => {
  const feeAddress = await getFeeAddress();
  _startAfterSync(() => {
    web3.eth
      .subscribe("logs", {
        fromBlock: currentBlock,
        address: [feeAddress],
        topics: [config.gxchain2.topics.Deposit],
      })
      .on("connected", (subscriptionId) => {
        logger.log("Log subscribed for Deposit from block:", currentBlock, {
          subscriptionId,
        });
      })
      .on("data", (data) => {
        logQueue.push(data);
      })
      .on("changed", (changed) => {
        logger.warn("changed", changed);
      })
      .on("error", (error) => {
        logger.error("Error: logs", error);
      });

    web3.eth
      .subscribe("logs", {
        fromBlock: currentBlock,
        address: [feeAddress],
        topics: [config.gxchain2.topics.Withdraw],
      })
      .on("connected", (subscriptionId) => {
        logger.log("Log subscribed for Withdraw from block:", currentBlock, {
          subscriptionId,
        });
      })
      .on("data", (data) => {
        logQueue.push(data);
      })
      .on("changed", (changed) => {
        logger.warn("changed", changed);
      })
      .on("error", (error) => {
        logger.error("Error: logs", error);
      });
  });
  FeelogsLoop();
};
