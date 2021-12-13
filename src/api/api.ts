import express from "express";
import Deposit from "../models/Deposit";
import Stake from "../models/Stake";
import Unstake from "../models/Unstake";

const router = express.Router();

router.get("/Unstake", async (req, res) => {
  try {
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    // const validator = req.query.validator;
    const to = req.query.to;
    const result = await Unstake.findAll({
      order: [["createdAt", "ASC"]],
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

router.get("/Stake", async (req, res) => {
  try {
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const from = req.query.from;
    const result = await Stake.findAll({
      order: [["createdAt", "ASC"]],
      offset: offset,
      limit: limit,
      where: {
        from: from,
        // validator: validator,
      },
    });
    res.send({ result });
  } catch (err) {
    res.send(err);
  }
});

router.get("/MyStakeAddress", async (req, res) => {
  try {
    const from = req.query.from;
    const results = await Stake.findAll({
      order: [["validator", "ASC"]],
      where: {
        from: from,
      },
    });
    let validator: string = null;
    let validators = [];
    results.map((result) => {
      if (validator != result.validator) {
        validator = result.validator;
        validators.push(validator);
      }
    });
    res.send({ validators });
  } catch (err) {
    res.send(err);
  }
});

router.get("/Depositby", async (req, res) => {
  try {
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const address = req.query.address;
    const depositByAddress = await Deposit.findAll({
      order: [["createdAt", "ASC"]],
      offset: offset,
      limit: limit,
      where: {
        by: address,
      },
    });
    res.send({ depositByAddress });
  } catch (err) {
    res.send(err);
  }
});

router.get("/Depositto", async (req, res) => {
  try {
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const address = req.query.address;
    const depositToAddress = await Deposit.findAll({
      order: [["createdAt", "ASC"]],
      offset: offset,
      limit: limit,
      where: {
        to: address,
      },
    });

    res.send({ depositToAddress });
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
