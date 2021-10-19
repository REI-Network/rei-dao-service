import { web3 } from "../web3";
import sequelize from "../db/db";

export async function checkAncestry(Database, blocknumber) {
  const transaction = await sequelize.transaction();
  try {
    while (blocknumber >= 0) {}
  } catch (err) {}
}

export async function findAncestry() {}
