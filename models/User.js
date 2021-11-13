// Require Mongoose
const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;

// Define a model
const UserModel = new Schema({
  fullName: String,
  username: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
// Compile model from schema
module.exports = mongoose.model("User", UserModel);
