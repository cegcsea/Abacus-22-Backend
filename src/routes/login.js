const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const gSignIn = require("./gSignIn");
const router = new express.Router();
const { v4: uuidv4 } = require("uuid");
//require("../middleware/gAuth")(passport);
const sendVerificationEmail = require("../middleware/sendVerificationEmail");

//normal login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) return res.status(400).send("Invalid password");

    if (!user.isAccountVerified) {
      sendVerificationEmail(user);
      return res
        .status(401)
        .send({ message: "User Not Verified, sending mail again" });
    }

    const token = await user.generateAuthtoken();
    user.tokens.push({ token });
    await user.save();

    console.log(user);
    return res.status(200).send({ token: token });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err);
  }
});

//gLogin
router.get(
  "/login/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/login/google/redirect",
  passport.authenticate("google", {
    failureRedirect: "/gautherror",
  }),
  (err, req, res, next) => {
    if (err) {
      console.log(err);
      console.log("");
      res.redirect("/login/google");
    } else {
      next();
    }
  },
  gSignIn.googleSignin
);

router.get("/gautherror", async (req, res) => {
  res.status(401).send({ error: "Google authentication error" });
});

module.exports = router;