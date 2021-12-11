const express = require("express");
const router = express.Router();
const EVCModel = require("../models/EVC-Sup");
const { generatePIN } = require("../utils/helpers");

// 1. Get supscription  [get]
router.get("/", async function(req, res) {
  try {
    const sups = await EVCModel.find();
    if (!sups) return res.status(404).send("No sups found");
    return res.status(200).json(sups);
  } catch (error) {
    console.error(error);
    return res.status(502).send("Could not fetch data");
  }
});

// 2. Get specific user [get]
router.get("/:subscriptionid", async function(req, res) {
  const { subscriptionid } = req.params;
  if (!subscriptionid)
    return res.status(400).json({ message: "Please provide subscriptionid" });

  try {
    const subscriber = await EVCModel.findOne({ supid: subscriptionid });
    if (!subscriber)
      return res
        .status(404)
        .json({ subscriber, message: "No subscriber found" });
    return res.status(200).json({ subscriber });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: "Could not fetch data" });
  }
});

// 3. Register Suspcription [post]
router.post("/register", async function(req, res) {
  const { supid } = req.body;
  if (!supid || typeof supid !== "number")
    return res
      .status(400)
      .json({ message: "Please provide a supid in number" });
  //
  try {
    const newSupscriber = await EVCModel.create({
      supid,
      PIN: generatePIN()
    });
    return res
      .status(200)
      .json({ message: "Subcriber Created", newSupscriber });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create Subscriber" });
  }
});

// 4. update supcription balance [put]
router.put("/update", async function(req, res) {
  const { supid, amount, method } = req.body;
  if (
    !supid ||
    typeof supid !== "number" ||
    !method ||
    typeof method !== "string"
  )
    return res
      .status(400)
      .json({ message: "Please provide a supid & an amount in number" });
  //
  try {
    const subscriber = await EVCModel.findOne({
      supid: supid
    });
    if (!subscriber)
      return res.status(404).json({ message: "Subscriber not found" });

    if (method === "plus") subscriber.balance += amount;
    else if (method === "minus") {
      if (subscriber.balance < amount || subscriber.balance - amount < 0) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      subscriber.balance -= amount;
    }

    subscriber.save((err, result) => {
      if (err) {
        console.error(err);
        return res.status(502).json({ message: "Cound not save data" });
      }
      return res.status(200).json({ message: "Subscriber updated", result });
    });
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
