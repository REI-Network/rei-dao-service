import Web3 from "web3";
import { config } from "./config/config";
import { stakeabi } from "./abi/StakeMannger";
import { configabi } from "./abi/config";
export const web3 = new Web3(config.gxchain2.provider);
web3.eth.handleRevert = true;

export const configContract = new web3.eth.Contract(
  configabi as any,
  config.gxchain2.config_address,
  {}
);

export async function getStakeManagerAddress() {
  return await configContract.methods.stakeManager().call();
}

export async function getBlcokRewardFactor() {
  return await configContract.methods.minerRewardFactor().call();
}
