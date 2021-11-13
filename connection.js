const mongoose = require("mongoose");

const DB = "tabsera";

async function connectToDB() {
  try {
    await mongoose.connect(`mongodb://localhost:27017/${DB}`);
    console.log(`Connected to DB ${DB}`);
  } catch (error) {
    console.error(`Failed to connect to ${DB}`, error);
  }
}

module.exports = { connectToDB };
