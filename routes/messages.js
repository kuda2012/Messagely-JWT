const express = require("express");
const router = new express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const token = req.body._token;
    if (!token || !id) {
      throw new ExpressError("Please make sure token and id are provided", 400);
    }
    const verifyToken = jwt.verify(token, SECRET_KEY);
    const theMessage = await Message.get(id);
    if (
      verifyToken.username == theMessage.from_user.username ||
      verifyToken.username == theMessage.to_user.username
    ) {
      return res.json({ message: theMessage });
    } else {
      throw new ExpressError("Username and token do not match", 404);
    }
  } catch (error) {
    return next(error);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", async (req, res, next) => {
  try {
    const toUsername = req.body.to_username;
    const messageBody = req.body.message;
    const token = req.body._token;
    if (!token || !messageBody || !toUsername) {
      throw new ExpressError(
        "Please make sure to_username, message, and token are provided",
        400
      );
    }
    const verifyToken = jwt.verify(token, SECRET_KEY);
    if (verifyToken) {
      const toUser = await User.get(toUsername);
      const createMessage = await Message.create({
        from_username: verifyToken.username,
        to_username: toUser.username,
        body: messageBody,
      });
      return res.json({ message: createMessage });
    }
  } catch (error) {
    return next(error);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", async (req, res, next) => {
  try {
    const id = req.params.id;
    const token = req.body._token;
    if (!token || !id) {
      throw new ExpressError("Please make sure token and id are provided", 400);
    }
    const verifyToken = jwt.verify(token, SECRET_KEY);
    const theMessage = await Message.get(id);
    if (verifyToken.username == theMessage.to_user.username) {
      const results = await Message.markRead(id);
      return res.json({ message: results });
    } else {
      throw new ExpressError("Sorry. You are not authorized to do that", 401);
    }
  } catch (error) {
    return next(error);
  }
});
module.exports = router;
