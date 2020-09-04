const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const ExpressError = require("../expressError");

/** User class for message.ly */

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users
       VALUES($1, $2, $3, $4, $5)
        RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPw, first_name, last_name, phone]
    );
    return result.rows[0];
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
      return checkPw;
    } else {
      return false;
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
      return results.rows[0];
    } else {
      return new ExpressError("Username provided does not exist", 404);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone FROM users`
    );
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
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users 
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
      `SELECT id, u.username, u.first_name, u.last_name, u.phone, body, sent_at, read_at
      FROM messages
      JOIN users AS u
      ON messages.to_username = u.username
      WHERE from_username = $1`,
      [username]
    );
    results.rows.forEach(function (row, i, arr) {
      row.to_user = {
        username: arr[i].username,
        first_name: arr[i].first_name,
        last_name: arr[i].last_name,
        phone: arr[i].phone,
      };
      delete arr[i].username;
      delete arr[i].first_name;
      delete arr[i].last_name;
      delete arr[i].phone;
    });
    return results.rows;
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
      `SELECT id, u.username, u.first_name, u.last_name, u.phone, body, sent_at, read_at
      FROM messages
      JOIN users AS u
      ON messages.from_username = u.username
      WHERE to_username = $1`,
      [username]
    );
    results.rows.forEach(function (row, i, arr) {
      row.from_user = {
        username: arr[i].username,
        first_name: arr[i].first_name,
        last_name: arr[i].last_name,
        phone: arr[i].phone,
      };
      delete arr[i].username;
      delete arr[i].first_name;
      delete arr[i].last_name;
      delete arr[i].phone;
    });
    return results.rows;
  }
}

// const user = User.messagesTo("logiman").then((res) => console.log(res));
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
