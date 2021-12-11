const express = require("express");
const { connectToDB } = require("./connection");
const users = require("./controllers/users");
const evc = require("./controllers/evcs");
const bank = require("./controllers/bankAccounts");
const transactions = require("./controllers/transactions");
const app = express();

// Connect to Database
connectToDB();
app.use(express.json());

app.use("/users", users);
app.use("/evc", evc);
app.use("/bank", bank);
app.use("/transactions", transactions);

app.listen(5500);
