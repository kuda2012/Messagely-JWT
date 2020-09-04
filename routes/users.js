const express = require("express");
const router = new express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");
/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get("/", async (req, res, next) => {
  try {
    const results = await User.all();
    if (results) {
      return res.json({ users: results });
    }
  } catch (error) {
    next(error);
  }
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const results = await User.get(username);
    if (results) {
      return res.json({ user: results });
    }
  } catch (error) {
    next(error);
  }
});
/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to", async (req, res, next) => {
  try {
    const { username } = req.params;
    const results = await User.messagesTo(username);
    if (results) {
      return res.json({ messages: results });
    }
  } catch (error) {
    next(error);
  }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/from", async (req, res, next) => {
  try {
    const { username } = req.params;
    const results = await User.messagesFrom(username);
    if (results) {
      return res.json({ messages: results });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
