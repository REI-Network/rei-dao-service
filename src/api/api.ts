import express from "express";
import Deposit from "../models/Deposit";
import Unstake from "../models/Unstake";

const router = express.Router();

router.get("/Unstake", async (req, res) => {
  try {
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    // const validator = req.query.validator;
    const to = req.query.to;
    const result = await Unstake.findAll({
      offset: offset,
      limit: limit,
      where: {
        to: to,
        // validator: validator,
      },
    });
    res.send({ result });
  } catch (err) {
    res.send(err);
  }
});

router.get("/Deposit", async (req, res) => {
  try {
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const address = req.query.address;
    const depositFromAddress = await Deposit.findAll({
      offset: offset,
      limit: limit,
      where: {
        by: address,
      },
    });
    const depositToAddress = await Deposit.findAll({
      offset: offset,
      limit: limit,
      where: {
        to: address,
      },
    });

    res.send({ depositFromAddress, depositToAddress });
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
