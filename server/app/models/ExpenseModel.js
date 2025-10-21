const db = require("../db/Database");

class ExpenseModel {
  // Thêm chi tiêu
  async add({ userId, categoryId, amount, date, description }) {

    const expenseDate = typeof date === "string" ? new Date(date) : date;

    // 1️⃣ Kiểm tra kế hoạch chi tiêu
    const [planRows] = await db.query(
      `SELECT CAST(amount AS SIGNED) AS amount 
     FROM expense_plans 
     WHERE user_id = ? AND category_id = ? AND DATE_FORMAT(date, "%Y-%m") = DATE_FORMAT(?, "%Y-%m")`,
      [userId, categoryId, expenseDate]
    );

    const spendingLimit = planRows.length > 0 ? planRows[0].amount : 0;
    if (!spendingLimit) {
      return {
        requireConfirmation: true,
        message: "Bạn chưa lập kế hoạch chi tiêu cho danh mục này trong tháng.",
      };
    }

    // 2️⃣ Lấy tổng chi tiêu đã dùng
    const [spentRows] = await db.query(
      `SELECT CAST(SUM(amount) AS SIGNED) AS totalSpent 
     FROM expenses 
     WHERE user_id = ? AND category_id = ? AND DATE_FORMAT(date, "%Y-%m") = DATE_FORMAT(?, "%Y-%m")`,
      [userId, categoryId, expenseDate]
    );

    const totalSpent = spentRows[0].totalSpent || 0;

    // 3️⃣ Kiểm tra vượt hạn mức
    if (totalSpent + parseFloat(amount) > spendingLimit) {
      return {
        requireConfirmation: true,
        message: "Tổng chi tiêu cho danh mục này trong tháng đã vượt hạn mức!",
      };
    }

    // 4️⃣ Thêm chi tiêu
    const mysqlDate = expenseDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const [result] = await db.query(
      "INSERT INTO expenses (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)",
      [userId, categoryId, amount, description || "", mysqlDate]
    );

    return { insertId: result.insertId };
  }

  async addConfirmed({ userId, categoryId, amount, date, description }) {
    const mysqlDate = new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD

    const [result] = await db.query(
      "INSERT INTO expenses (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)",
      [userId, categoryId, amount, description || "", mysqlDate]
    );

    return { insertId: result.insertId };
  }

  // Cập nhật chi tiêu
async update({ id, userId, categoryId, amount, date, description }) {
  const expenseDate = typeof date === "string" ? new Date(date) : date;

  // Kiểm tra kế hoạch chi tiêu
  const [planRows] = await db.query(
    `SELECT CAST(amount AS SIGNED) AS amount 
     FROM expense_plans 
     WHERE user_id = ? AND category_id = ? AND DATE_FORMAT(date, "%Y-%m") = DATE_FORMAT(?, "%Y-%m")`,
    [userId, categoryId, expenseDate]
  );

  const spendingLimit = planRows.length > 0 ? planRows[0].amount : 0;

  if (!spendingLimit) {

    return {
      requireConfirmation: true,
      message: "Bạn chưa lập kế hoạch chi tiêu cho danh mục này trong tháng.",
    };
  }

  // Tổng chi tiêu đã dùng (trừ khoản đang edit)
  const [spentRows] = await db.query(
    `SELECT CAST(SUM(amount) AS SIGNED) AS totalSpent 
     FROM expenses 
     WHERE user_id = ? AND category_id = ? AND DATE_FORMAT(date, "%Y-%m") = DATE_FORMAT(?, "%Y-%m")
       AND id != ?`,
    [userId, categoryId, expenseDate, id]
  );

  const totalSpent = spentRows[0].totalSpent || 0;

  // Kiểm tra vượt hạn mức
  if (totalSpent + parseFloat(amount) > spendingLimit) {
    return {
      requireConfirmation: true,
      message: "Tổng chi tiêu cho danh mục này trong tháng đã vượt hạn mức!",
    };
  }

  // Cập nhật chi tiêu
  const mysqlDate = expenseDate.toISOString().slice(0, 10);
  const [result] = await db.query(
    "UPDATE expenses SET category_id = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?",
    [categoryId, amount, description || "", mysqlDate, id, userId]
  );

  return { affectedRows: result.affectedRows };
}


  // 2️⃣ Edit chi tiêu đã xác nhận (bỏ qua hạn mức)
async updateConfirmed({ id, userId, categoryId, amount, date, description }) {
  const mysqlDate = new Date(date).toISOString().slice(0, 10);
  const [result] = await db.query(
    "UPDATE expenses SET category_id = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?",
    [categoryId, amount, description || "", mysqlDate, id, userId]
  );

  console.log("🟢 updateConfirmed result:", result); // log MySQL result

  return { affectedRows: result.affectedRows };
}


  // Xóa chi tiêu
  async delete({ id, userId }) {
    const [result] = await db.query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows;
  }

  // Lấy chi tiêu theo tháng
  async getByMonth({ userId, month, year }) {
    const [rows] = await db.query(
      `
      SELECT i.*, c.category_name, c.category_color, c.category_icon
      FROM expenses i
      LEFT JOIN expense_categories c ON i.category_id = c.category_id
      WHERE i.user_id = ? AND MONTH(i.date) = ? AND YEAR(i.date) = ?
      ORDER BY i.date DESC
      `,
      [userId, month, year]
    );
    return rows;
  }

  // Lấy tất cả chi tiêu
  async getAll({ userId }) {
    const [rows] = await db.query(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC",
      [userId]
    );
    return rows;
  }
}

module.exports = new ExpenseModel();
