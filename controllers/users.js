const express = require("express");

const UserModel = require("../models/User");

const router = express.Router();

// 1. ROUTE TO GET ALL USERS
router.get("/", async (req, res) => {
  try {
    let users = await UserModel.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(404).send("No users found");
  }
});

// 2. ROUTE TO GET SPECIFIC USER
router.get("/:aqoonsi", async (req, res) => {
  const aqoonsi = req.params.aqoonsi;
  try {
    let user = await UserModel.find({ username: aqoonsi });
    return res.status(200).json({ message: "User found", user });
  } catch (error) {
    console.error(error);
    res.status(404).send("User not found");
  }
});

// 3. Create a new user
router.post("/create", async (req, res) => {
  try {
    const { fName, user } = req.body;
    if (
      !fName ||
      !user ||
      typeof fName !== "string" ||
      typeof user !== "string"
    ) {
      return res.status(400).json({ message: "Please provide fName & user" });
    }
    let result = await UserModel.create({
      fullName: fName,
      username: user
    });
    return res.status(200).json({ message: "User Added", data: result });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "User could not be added" });
  }
});

// 4. Update User
router.put("/update", async (req, res) => {
  const { oldUsername, newUsername } = req.body;
  if (!oldUsername || !newUsername) {
    return res.status(400).send("please provide a username & a new username");
  }
  const result = await UserModel.findOne({ username: oldUsername });
  if (!result) {
    return res.status(404).send("User not found");
  }
  //
  result.username = newUsername;
  result.updatedAt = Date.now();

  result.save((err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("User could not be updated");
    }
    return res.status(200).json({ message: "user updated", result });
  });
});

// 5. Delete User
router.delete("/delete", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send("pls provide a username");
  try {
    const user = await UserModel.findOneAndDelete({ username: username });
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).send("User could not be deleted");
  }
});

module.exports = router;
