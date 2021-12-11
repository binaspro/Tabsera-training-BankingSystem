const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const UserModel = require("../models/User");
const TransactionModel = require("../models/Transaction");
const { generateEVCSupID } = require("../utils/helpers");

// 1. Get all users [get]
router.get("/", async function(req, res) {
  try {
    const users = await UserModel.find();
    if (!users) return res.status(404).send("No users found");
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(502).send("Could not fetch data");
  }
});

// 2. Get specific user [get]
router.get("/:phoneNumber", async function(req, res) {
  const { phoneNumber } = req.params;

  try {
    const user = await UserModel.findOne({ phoneNumber });
    if (!user) return res.status(404).json({ user });
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
  }
});

// 3. Register user [post]
router.post("/register", async function(req, res) {
  const { fullName, phoneNumber } = req.body;
  if (
    !fullName ||
    typeof fullName !== "string" ||
    !phoneNumber ||
    typeof phoneNumber !== "number"
  )
    return res
      .status(400)
      .send("Please provide a fullName in string & phoneNumber in number");
  //
  try {
    const bankAPI = await fetch("http://localhost:5500/bank/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    const newAccount = await bankAPI.json();

    const newUser = await UserModel.create({
      fullName,
      phoneNumber,
      EVCSupID: generateEVCSupID(),
      accountNo: newAccount.accountNo
    });

    // Call EVC Subscriber registration route
    const response = await fetch("http://localhost:5500/evc/register", {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json"
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify({
        supid: newUser.EVCSupID
      }) // body data type must match "Content-Type" header
    });
    const evcSub = await response.json(); // parses JSON response into native JavaScript objects

    return res.status(200).json({ newUser, evcSub, newAccount });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Failed to create USER");
  }
});

// 4. Send money [put]
router.put("/send", async function(req, res) {
  const { sender, senderPIN, receiver, amount } = req.body;
  if (!sender || !senderPIN || !receiver || !amount) {
    return res
      .status(400)
      .send("Please provide sender, senderPIN, receiver, amount");
  }

  try {
    // ** SENDER VERFICATION ** //
    let senderVerification = await fetch(
      `http://localhost:5500/users/${sender}`
    );
    senderVerification = await senderVerification.json();

    // If user does not exist
    if (!senderVerification.user)
      return res.status(400).send("Sender not found");

    // Call EvcSubscription route to get user's PIN & balance
    let subsId = senderVerification.user.EVCSupID;

    let userSubsription = await fetch(`http://localhost:5500/evc/${subsId}`);
    userSubsription = await userSubsription.json();

    if (userSubsription.subscriber.PIN !== senderPIN)
      return res.status(400).send("PIN is incorrect");

    if (userSubsription.subscriber.balance < amount)
      return res.status(400).send("Balance insufficient");

    // ** RECEIVER VERFICATION ** //
    let receiverVerification = await fetch(
      `http://localhost:5500/users/${receiver}`
    );
    receiverVerification = await receiverVerification.json();
    // If user does not exist
    if (!receiverVerification.user)
      return res.status(400).send("Receiver not found");

    // UPDATE USERS BALANCE

    // UPDATE SENDER
    let senderUpdateProcess = await fetch("http://localhost:5500/evc/update", {
      method: "PUT", // *GET, POST, PUT, DELETE, etc.
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        supid: senderVerification.user.EVCSupID,
        amount,
        method: "minus"
      })
    });
    let senderResult = await senderUpdateProcess.json();

    // UPDATE RECEIVER
    let receiverUpdateProcess = await fetch(
      "http://localhost:5500/evc/update",
      {
        method: "PUT", // *GET, POST, PUT, DELETE, etc.
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          supid: receiverVerification.user.EVCSupID,
          amount,
          method: "plus"
        })
      }
    );
    let receiverResult = await receiverUpdateProcess.json();

    // Record TRANSACTION
    const transaction = await TransactionModel.create({
      senderPhone: sender,
      receiverPhone: receiver,
      amount: amount
    });

    return res.status(200).json({ senderResult, receiverResult, transaction });
  } catch (error) {
    console.error(error);
  }
});

// 5. Withdraw from bank [put]
router.put("/withdraw", async function(req, res) {
  const { bankAccountID, evcID, amount, bankPIN } = req.body;
  if (!evcID || !bankAccountID || !amount || !bankPIN)
    return res.status(400).json({
      message: "Please provide evcID, bankAccountID, amount, bankPIN"
    });

  try {
    let evcAPI = await fetch(`http://localhost:5500/evc/${evcID}`);
    evcAPI = await evcAPI.json();

    // Check if EVC_SUBCRIPTION exists
    if (!evcAPI.subscriber)
      return res.status(400).json({ message: "Subscriber not found" });

    // Check if bank account exists
    let bankAPI = await fetch(`http://localhost:5500/bank/${bankAccountID}`);
    let account = await bankAPI.json();
    if (!account) return res.status(400).json({ message: "Account not found" });

    // Check banks's balance & pin
    if (account.PIN !== bankPIN)
      return res.status(400).json({ message: "Incorrect bankPIN" });

    if (account.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    // Update evc balance [kudar ladhigay evc]
    let evcUpdate = await fetch("http://localhost:5500/evc/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        supid: evcID,
        amount,
        method: "plus"
      })
    });
    await evcUpdate.json();

    // Update bank account balance [ku dar lacagi lasoo dhigay]
    let bankUpdate = await fetch("http://localhost:5500/bank/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: bankAccountID,
        amount,
        method: "minus"
      })
    });
    await bankUpdate.json();

    return res.status(200).json({ message: "Successfully withdrawn amount" });
  } catch (error) {
    console.error(error);
  }
});

// 6. Deposit to bank [put]
router.put("/deposit", async function(req, res) {
  const { evcID, bankAccountID, amount, evcPIN } = req.body;
  if (!evcID || !bankAccountID || !amount || !evcPIN)
    return res
      .status(400)
      .json({ message: "Please provide evcID, bankAccountID, amount, evcPIN" });

  //

  try {
    let evcAPI = await fetch(`http://localhost:5500/evc/${evcID}`);
    evcAPI = await evcAPI.json();

    // Check if EVC_SUBCRIPTION exists
    if (!evcAPI.subscriber)
      return res.status(400).json({ message: "Subscriber not found" });

    // Check user's evc balance & pin
    if (evcAPI.subscriber.PIN !== evcPIN)
      return res.status(400).json({ message: "Incorrect evcPIN" });

    if (evcAPI.subscriber.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    // Check if bank account exists
    let bankAPI = await fetch(`http://localhost:5500/bank/${bankAccountID}`);
    let account = await bankAPI.json();
    if (!account) return res.status(400).json({ message: "Account not found" });

    // Update evc balance [ka jar lacagti ladhigay bankiga]
    let evcUpdate = await fetch("http://localhost:5500/evc/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        supid: evcID,
        amount,
        method: "minus"
      })
    });
    await evcUpdate.json();

    // Update bank account balance [ku dar lacagi lasoo dhigay]
    let bankUpdate = await fetch("http://localhost:5500/bank/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: bankAccountID,
        amount,
        method: "plus"
      })
    });
    await bankUpdate.json();

    return res.status(200).json({ message: "Successfully deposited amount" });
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
