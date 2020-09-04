const express = require("express");
const router = new express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ExpressError(
        "Please provide a username and password. Make sure all items are spelled correctly!",
        400
      );
    }
    const results = await User.authenticate(username, password);
    if (results) {
      const token = jwt.sign(
        { iat: Date.now(), username: username },
        SECRET_KEY
      );
      await User.updateLoginTimestamp(username);
      return res.json({ username: username, token: token });
    } else {
      throw new ExpressError(
        "Username and Password combination was invalid",
        400
      );
    }
  } catch (error) {
    next(error);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async (req, res, next) => {
  try {
    if (
      !req.body.username ||
      !req.body.password ||
      !req.body.first_name ||
      !req.body.last_name ||
      !req.body.phone
    ) {
      throw new ExpressError(
        "Please make sure all fields are entered correctly",
        400
      );
    }
    const results = await User.register(req.body);
    if (results) {
      const token = jwt.sign(
        { iat: Date.now(), username: req.body.username },
        SECRET_KEY
      );
      results.token = token;
      await User.updateLoginTimestamp(req.body.username);
      return res.json(results);
    } else {
      throw new ExpressError(
        "Please ensure all fields are entered correctly",
        400
      );
    }
  } catch (error) {
    if (error.code == "23505") {
      return next(
        new ExpressError("Username taken. Please pick another!", 400)
      );
    }
    next(error);
  }
});
module.exports = router;
