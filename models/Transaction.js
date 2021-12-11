const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const TransactionModel = new Schema({
  senderPhone: Number,
  receiverPhone: Number,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", TransactionModel);
