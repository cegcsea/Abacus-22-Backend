const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
// const passport = require("passport");
const router = new express.Router();
const { v4: uuidv4 } = require("uuid");
const sendVerificationEmail = require("../middleware/sendVerificationEmail");

router.post("/newUser", async (req, res) => {
  //console.log(req.body);
  const { email, name, phoneNumber, college, year, department, password } =
    req.body;

  const user = new User({
    id: uuidv4(),
    email,
    name,
    phoneNumber,
    college,
    year,
    department,
    password,
  });
  try {
    user.password = await bcrypt.hash(user.password, 8);
    await user.generateVerificationCode();
    await user.save();
    sendVerificationEmail(user);
    res
      .status(201)
      .send({ user, message: "Verification mail has been sent to your email" });
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

// Todo: user verification for updation of data
router.post("/updateExisting", async (req, res) => {
  const { email, name, phoneNumber, college, year, department } = req.body;

  try {
    var user = await User.findOne({ email });

    user.name = name;
    user.phoneNumber = phoneNumber;
    user.college = college;
    user.year = year;
    user.department = department;
    await user.save();
    return res.status(200).send({ message: "User Updated" });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
});

router.get("/verifyUser", async (req, res) => {
  // res.send(req.query);

  const data = req.query;
  try {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      return res.status(404).send({ message: "Wrong User" });
    } else if (!user.isAccountVerified) {
      if (user.verificationCode === data.code) {
        user.isAccountVerified = true;
        await user.save();
        return res
          .status(200)
          .send({ user: user, message: "User has been verified" });
      } else {
        return res.status(403).send({ message: "Wrong verification Code" });
      }
    } else {
      return res.status(200).send({ message: "User already verified" });
    }
  } catch (e) {
    console.log(e);
    return res.status(401).send({ message: "Wrong Credentials" });
  }
});

module.exports = router;