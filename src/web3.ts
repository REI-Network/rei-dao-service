import Web3 from "web3";
import { config } from "./config/config";
import { configabi } from "./abi/config";
import * as stake_task from "./tasks/stakeTask";
import * as blockreward_task from "./tasks/blockRewardTask";

const options = {
  timeout: 30000, // ms
  // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
  headers: {
    authorization: "Basic username:password",
  },
  clientConfig: {
    // Useful if requests are large
    maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB
    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 60000, // ms
  },
  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 500000,
    onTimeout: false,
  },
};
const wspovider = new Web3.providers.WebsocketProvider(
  config.gxchain2.provider,
  options
);

wspovider.on("connect", () => {
  stake_task.readState();
  //blockreward_task.readState();
});

wspovider.on("error", () => {
  stake_task.saveState();
});

wspovider.on("end", () => {
  stake_task.saveState();
});

export const web3 = new Web3(wspovider);

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
