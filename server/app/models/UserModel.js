const db = require("../db/Database");

class UserModel {
  async findByEmail(email) {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);
    return rows[0] || null;
  }

  async create({ firstname, lastname, email, password }) {
    const [result] = await db.query(
      "INSERT INTO users (firstname, lastname, email, password, verification) VALUES (?, ?, ?, ?, ?)",
      [firstname, lastname, email, password, 0]
    );
    return result.insertId;
  }
  async verify(email) {
    const result = await db.query(
      "UPDATE users SET verification = ? WHERE email = ?",
      [1, email]
    );
    return result.affectedRows;
  }

  async updatePasswordByEmail(email, hashedPassword) {
    const result = await db.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );
    return result.affectedRows;
  }

  async updatePasswordById(userId, hashedPassword) {
    const [result] = await db.query(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );
    return result.affectedRows > 0;
  }

  async updatePassword(email, hashedPassword) {
    return this.updatePasswordByEmail(email, hashedPassword);
  }

async changeUserName(userId, firstName, lastName) {
  const [result] = await db.query(
    "UPDATE users SET firstname = ?, lastname = ? WHERE user_id = ?",
    [firstName, lastName, userId]
  );
  if (result.affectedRows > 0) {
    const [rows] = await db.query(
      "SELECT user_id, firstname, lastname, email FROM users WHERE user_id = ?",
      [userId]
    );
    return rows[0];
  }
  return null;
}

}

module.exports = new UserModel();
