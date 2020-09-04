const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");

/** User class for message.ly */

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    try {
      if (!username || !password || !first_name || !last_name || !phone) {
        throw new ExpressError(
          "Please make sure all fields are entered correctly",
          400
        );
      }
      const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      const result = await db.query(
        `INSERT INTO users
       VALUES($1, $2, $3, $4, $5)
        RETURNING username, password`,
        [username, hashedPw, first_name, last_name, phone]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code == "23505") {
        return new ExpressError("Username taken. Please pick another!", 400);
      }
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    if (!username || !password) {
      return new ExpressError(
        "Please make sure username and password are provided",
        400
      );
    }
    const results = await db.query(
      `SELECT password FROM users
       WHERE username = $1`,
      [username]
    );
    if (results.rows[0]) {
      const checkPw = await bcrypt.compare(password, results.rows[0].password);
      if (checkPw) {
        return checkPw;
      } else {
        return checkPw;
      }
    } else {
      return new ExpressError(
        "Username and Password combination was invalid",
        400
      );
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    if (!username) {
      return new ExpressError("Please make sure username is provided", 400);
    }
    const results = await db.query(
      `UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE username = $1
        RETURNING *`,
      [username]
    );
    if (results.rows[0]) {
      return result.rows[0];
    } else {
      return new ExpressError("Username provided does not exist", 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`SELECT * FROM users`);
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    if (!username) {
      return new ExpressError("Please make sure username is provided", 400);
    }
    const results = await db.query(
      `SELECT * FROM users 
       WHERE username = $1`,
      [username]
    );
    if (results.rows[0]) {
      return results.rows[0];
    } else {
      return new ExpressError("Username provided does not exist", 404);
    }
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    if (!username) {
      return new ExpressError("Please make sure username is provided", 400);
    }
    const results = await db.query(
      `SELECT id, u.first_name, u.last_name, u.phone, body, sent_at, read_at
      FROM messages
      JOIN users AS u
      ON messages.to_username = u.username
      WHERE from_username = $1`,
      [username]
    );
    results.rows[0].to_user = {
      first_name: results.rows[0].first_name,
      last_name: results.rows[0].last_name,
      phone: results.rows[0].phone,
    };
    delete results.rows[0].first_name;
    delete results.rows[0].last_name;
    delete results.rows[0].phone;
    return results.rows[0];
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    if (!username) {
      return new ExpressError("Please make sure username is provided", 400);
    }
    const results = await db.query(
      `SELECT id, u.first_name, u.last_name, u.phone, body, sent_at, read_at
      FROM messages
      JOIN users AS u
      ON messages.from_username = u.username
      WHERE to_username = $1`,
      [username]
    );
    results.rows[0].from_user = {
      first_name: results.rows[0].first_name,
      last_name: results.rows[0].last_name,
      phone: results.rows[0].phone,
    };
    delete results.rows[0].first_name;
    delete results.rows[0].last_name;
    delete results.rows[0].phone;
    return results.rows[0];
  }
}

const user = User.messagesTo("logiman").then((res) => console.log(res));
// const user = User.register({
//   username: "kudaman",
//   password: "dogs",
//   first_name: "kuda",
//   last_name: "mwakutuya",
//   phone: "8322746400",
// }).then((res) => console.log(res));

// const user2 = User.register({
//   username: "logiman",
//   password: "dogs",
//   first_name: "logi",
//   last_name: "video",
//   phone: "8322746400",
// }).then((res) => console.log(res));

module.exports = User;
