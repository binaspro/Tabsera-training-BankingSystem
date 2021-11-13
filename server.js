const express = require("express");
const users = require("./controllers/users");
const { connectToDB } = require("./connection");

const app = express();

connectToDB();

app.use(express.json());
app.use("/users", users);

app.listen(5500);
