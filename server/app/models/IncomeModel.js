const db = require("../db/Database");

class IncomeModel {
  // Thêm thu nhập
  async add({ userId, categoryId, amount, date, description }) {
    // Lấy tháng từ date
    const incomeDate = new Date(date);
    const monthStr = `${incomeDate.getFullYear()}-${String(
      incomeDate.getMonth() + 1
    ).padStart(2, "0")}`;

    // 1️⃣ Kiểm tra kế hoạch thu nhập
    const [planRows] = await db.query(
      `SELECT CAST(amount AS SIGNED) AS amount 
     FROM income_plans 
     WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?`,
      [userId, monthStr, categoryId]
    );


    if (planRows.length === 0) {
      // Chưa lập kế hoạch
      return {
        requireConfirmation: true,
        message: "Bạn chưa lập kế hoạch thu nhập cho danh mục này trong tháng.",
      };
    }

    // 2️⃣ Thêm thu nhập
    const mysqlDate = incomeDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const [result] = await db.query(
      "INSERT INTO incomes (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)",
      [userId, categoryId, amount, description || "", mysqlDate]
    );

    return { insertId: result.insertId };
  }

  async addConfirmed({ userId, categoryId, amount, date, description }) {
    const mysqlDate = new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD

    const [result] = await db.query(
      "INSERT INTO incomes (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)",
      [userId, categoryId, amount, description || "", mysqlDate]
    );

    return { insertId: result.insertId };
  }

  // Cập nhật thu nhập
async update({ id, userId, categoryId, amount, date, description }) {
  console.log("🟢 [IncomeModel.update] Called with:", {
    id,
    userId,
    categoryId,
    amount,
    date,
    description,
  });

  const incomeDate = new Date(date);
  const monthStr = `${incomeDate.getFullYear()}-${String(
    incomeDate.getMonth() + 1
  ).padStart(2, "0")}`;

  // 1️⃣ Kiểm tra kế hoạch thu nhập
  console.log("📅 Checking income plan for month:", monthStr);

  const [planRows] = await db.query(
    `SELECT CAST(amount AS SIGNED) AS amount
     FROM income_plans
     WHERE user_id = ? 
       AND DATE_FORMAT(date, "%Y-%m") = ? 
       AND category_id = ?`,
    [userId, monthStr, categoryId]
  );

  console.log("📊 Found income plan rows:", planRows);

  // ⚠️ Kiểm tra chưa có kế hoạch hoặc kế hoạch = 0
  if (planRows.length === 0 || planRows[0].amount === 0) {
    console.warn("⚠️ No income plan found OR plan amount = 0!");
    return {
      requireConfirmation: true,
      message: "Bạn chưa lập kế hoạch thu nhập cho danh mục này trong tháng.",
    };
  }

  // 2️⃣ Cập nhật thu nhập
  const mysqlDate = incomeDate.toISOString().slice(0, 10);
  console.log("📝 Updating income record with date:", mysqlDate);

  const [result] = await db.query(
    `UPDATE incomes
     SET category_id = ?, amount = ?, description = ?, date = ?
     WHERE id = ? AND user_id = ?`,
    [categoryId, amount, description || "", mysqlDate, id, userId]
  );

  console.log("✅ Update result:", result);

  return { affectedRows: result.affectedRows };
}


  // Confirm edit (bỏ qua kiểm tra kế hoạch)
  async updateConfirmed({ id, userId, categoryId, amount, date, description }) {
    const mysqlDate = new Date(date).toISOString().slice(0, 10);

    const [result] = await db.query(
      `UPDATE incomes
       SET category_id = ?, amount = ?, description = ?, date = ?
       WHERE id = ? AND user_id = ?`,
      [categoryId, amount, description || "", mysqlDate, id, userId]
    );

    return { affectedRows: result.affectedRows };
  }
  // Xóa thu nhập
  async delete({ id, userId }) {
    const [result] = await db.query(
      "DELETE FROM incomes WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows;
  }

  // Lấy thu nhập theo tháng
  async getByMonth({ userId, month, year }) {
    const [rows] = await db.query(
      `
      SELECT i.*, c.category_name, c.category_color, c.category_icon
      FROM incomes i
      LEFT JOIN income_categories c ON i.category_id = c.category_id
      WHERE i.user_id = ? AND MONTH(i.date) = ? AND YEAR(i.date) = ?
      ORDER BY i.date DESC
    `,
      [userId, month, year]
    );
    return rows;
  }

  // Lấy tất cả thu nhập của user
  async getAll({ userId }) {
    const [rows] = await db.query(
      "SELECT * FROM incomes WHERE user_id = ? ORDER BY date DESC",
      [userId]
    );
    return rows;
  }
}

module.exports = new IncomeModel();
