const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const EVCModel = new Schema({
  supid: { type: Number, unique: true },
  PIN: Number,
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EVC", EVCModel);
