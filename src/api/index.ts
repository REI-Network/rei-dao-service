import express from "express";
import { logger } from "../logger/logger";

export const start = () => {
  const app = express();
  const port = parseInt(process.env.port || "3031");
  const localhost = process.env.LOCALHOST || "127.0.0.1";

  app.use("/api", require("./api"));

  app.listen(port, localhost, () => {
    logger.log("Api server has started", localhost, port);
  });
};
