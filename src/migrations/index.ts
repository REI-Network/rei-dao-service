import fs from "fs";
import path from "path";
import { logger } from "../logger/logger";

function travel(dir: string) {
  let files = [];
  fs.readdirSync(dir).forEach((file) => {
    const pathname = path.join(dir, file);
    if (fs.statSync(pathname).isDirectory()) {
      files = files.concat(travel(pathname));
    } else {
      files.push(pathname);
    }
  });
  return files;
}

const models = travel(path.resolve(__dirname, "../models"));

(async () => {
  for (const m of models) {
    const model = require(m).default;
    logger.info("syncing", m);
    // const result = await model.sync({ alter: true, rowFormat: "DYNAMIC" });
    const result = await model.sync({
      alter: true,
      rowFormat: "DYNAMIC",
    });
    logger.info("syncing finished", result);
  }
})();
