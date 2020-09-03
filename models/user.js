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
        RETURNING username                         `,
      [username, hashedPw, first_name, last_name, phone]
    );
    return { msg: `${result.rows[0].username} has been register` };
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
        return { msg: `User authenticated. Welcome, ${username}` };
      } else {
        return new ExpressError(
          "Username and Password combination was invalid",
          400
        );
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
        RETURNING last_login_at`,
      [username]
    );
    if (results.rows[0].last_login_at) {
      return {
        msg: `Updated. Last Login for ${username} is ${results.rows[0].last_login_at}`,
      };
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`SELECT * FROM users`);
    return { users: results.rows };
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
      `SELECT * from users 
                    WHERE username = $1`,
      [username]
    );
    if (results.rows[0]) {
      return { user: results.rows[0] };
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

  static async messagesFrom(username) {}

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {}
}
const user = User.get("kudaman").then((res) => console.log(res));
module.exports = User;
