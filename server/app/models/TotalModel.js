const db = require('../db/Database'); 

class TotalModel {
  async getTotalAmount({ userId }) {
    const [rows] = await db.query(`
      SELECT 
        CAST((
          COALESCE((SELECT SUM(amount) FROM incomes WHERE user_id = ?), 0) -
          COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = ?), 0)
        ) AS SIGNED) AS totalAmount
    `, [userId, userId]);

    return rows;
  }
}

module.exports = new TotalModel();
