const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const TransactionModel = require("../models/Transaction");

// 1. Get all transaction
router.get("/", async (req, res) => {
  try {
    const result = await TransactionModel.find();
    if (!result) res.status(404).json({ message: "no transacions in DB" });
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
  }
});

// 2. Get transactions for specific user
router.get("/:phone", async (req, res) => {
  const { phone } = req.params;
  try {
    const result = await TransactionModel.find({
      $or: [{ senderPhone: phone }, { receiverPhone: phone }]
    });
    if (!result)
      res.status(404).json({ message: `no transacions in DB for ${phone}` });
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
  }
});

// 3. Create new transaction
router.post("/create", async (req, res) => {
  const { senderPhone, receiverPhone, amount } = req.body;

  if (!senderPhone || !receiverPhone || !amount)
    res
      .status(400)
      .json({ message: "Pls provide senderPhone, receiverPhone, amount" });

  try {
    const newTransaction = TransactionModel.create({
      senderPhone,
      receiverPhone,
      amount
    });

    return res
      .status(200)
      .json({ message: "Transaction recorded successfully", newTransaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not record transaction" });
  }
});

module.exports = router;
