import { logger } from "../logger/logger";
import { config } from "../config/config";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(config.service.connection, {
  logging: (msg) => logger.log(msg),
});

// const sequelize = new Sequelize('sqlite::memory:', {});

export default sequelize;

export async function init() {
  await sequelize.authenticate();
  await sequelize.sync();
}
