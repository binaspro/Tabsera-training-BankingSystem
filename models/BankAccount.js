const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BankAccountModel = new Schema({
  accountNo: { type: Number, unique: true },
  balance: { type: Number, default: 0 },
  PIN: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BankAccount", BankAccountModel);
