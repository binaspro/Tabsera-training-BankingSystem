const express = require("express");
const router = express.Router();
const AccountModel = require("../models/BankAccount");
const fetch = require("node-fetch");

const { generateBankAccountNo, generateBankPIN } = require("../utils/helpers");

// 1. Get all accounts [get]
router.get("/", async (req, res) => {
  try {
    const accounts = await AccountModel.find();
    if (!accounts)
      return res.status(404).json({ message: "No accounts found!" });
    return res.status(200).json(accounts);
  } catch (error) {
    console.error(error);
  }
});

// 2. Get specific account [get]
router.get("/:accountID", async (req, res) => {
  const { accountID } = req.params;
  if (!accountID)
    return res.status(400).json({ message: "Please provide an accountID" });
  try {
    const account = await AccountModel.findOne({ accountNo: accountID });
    if (!account)
      return res.status(404).json({ account, message: "No account found!" });
    return res.status(200).json(account);
  } catch (error) {
    console.error(error);
  }
});

// 3. Register a new account [post]
router.post("/register", async (req, res) => {
  try {
    const newAccount = await AccountModel.create({
      accountNo: generateBankAccountNo(),
      PIN: generateBankPIN()
    });
    return res.status(200).json(newAccount);
  } catch (error) {
    console.error(error);
  }
});

// 4. Update an account [put]
router.put("/update", async (req, res) => {
  const { id, amount, method } = req.body;

  if (!id || !amount || !method)
    return res
      .status(400)
      .json({ message: "Please provide id, amount, method" });

  try {
    let account = await AccountModel.findOne({ accountNo: id });
    if (!account) return res.status(404).json({ message: "Account not found" });

    if (method === "plus") {
      account.balance += amount;
    } else if (method === "minus") {
      account.balance -= amount;
    }
    account.save((err, result) => {
      if (err) {
        console.error(err);
        return res.status(502).json({ message: "Cound not save data" });
      } else
        return res.status(200).json({ message: "account updated", result });
    });
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
