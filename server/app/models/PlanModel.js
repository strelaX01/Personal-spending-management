const db = require("../db/Database");

class PlanModel {
  async saveIncomePlan({ userId, month, year, items }) {
    const date = `${year}-${month.toString().padStart(2, "0")}-01`;

    await db.query("DELETE FROM income_plans WHERE user_id = ? AND date = ?", [
      userId,
      date,
    ]);

    if (!items || items.length === 0) {
      return { success: true, message: "Không có item nào để lưu." };
    }

    const values = items.map((it) => [userId, it.category_id, it.amount, date]);

    const [result] = await db.query(
      "INSERT INTO income_plans (user_id, category_id, amount, date) VALUES ?",
      [values]
    );

    return {
      success: true,
      message: "Lưu kế hoạch thu nhập thành công",
      inserted: result.affectedRows,
    };
  }

  async saveExpensePlan({ userId, month, year, items }) {
    const date = `${year}-${month.toString().padStart(2, "0")}-01`;

    await db.query("DELETE FROM expense_plans WHERE user_id = ? AND date = ?", [
      userId,
      date,
    ]);

    if (!items || items.length === 0) {
      return { success: true, message: "Không có item nào để lưu." };
    }

    const values = items.map((it) => [userId, it.category_id, it.amount, date]);

    const [result] = await db.query(
      "INSERT INTO expense_plans (user_id, category_id, amount, date) VALUES ?",
      [values]
    );

    return {
      success: true,
      message: "Lưu kế hoạch chi tiêu thành công",
      inserted: result.affectedRows,
    };
  }

  async getIncomePlan({ userId, month, year }) {
    const [rows] = await db.query(
      `
      SELECT 
        p.plan_id,
        p.user_id,
        DATE_FORMAT(p.date, '%Y-%m-%d') AS date,
        p.category_id,
        p.amount,
        c.category_name, 
        c.category_color, 
        c.category_icon
      FROM income_plans p
      LEFT JOIN income_categories c ON p.category_id = c.category_id
      WHERE p.user_id = ?
        AND YEAR(p.date) = ?
        AND MONTH(p.date) = ?
      ORDER BY p.date DESC
    `,
      [userId, year, month]
    );

    return rows;
  }

  async getExpensePlan({ userId, month, year }) {
    const [rows] = await db.query(
      `
      SELECT 
        p.plan_id,
        p.user_id,
        DATE_FORMAT(p.date, '%Y-%m-%d') AS date,
        p.category_id,
        p.amount,
        c.category_name, 
        c.category_color, 
        c.category_icon
      FROM expense_plans p
      LEFT JOIN expense_categories c ON p.category_id = c.category_id
      WHERE p.user_id = ?
        AND YEAR(p.date) = ?
        AND MONTH(p.date) = ?
      ORDER BY p.date DESC
    `,
      [userId, year, month]
    );

    return rows;
  }


   async getAnnualIncomePlan({ userId, year }) {
    const [rows] = await db.query(
      `
      SELECT 
        p.category_id,
        SUM(p.amount) AS amount,
        c.category_name, 
        c.category_color, 
        c.category_icon
      FROM income_plans p
      LEFT JOIN income_categories c ON p.category_id = c.category_id
      WHERE p.user_id = ?
        AND YEAR(p.date) = ?
      GROUP BY p.category_id, c.category_name, c.category_color, c.category_icon
      ORDER BY SUM(p.amount) DESC
      `,
      [userId, year]
    );

    return rows;
  }

   async getAnnualExpensePlan({ userId, year }) {
    const [rows] = await db.query(
      `
      SELECT 
        p.category_id,
        SUM(p.amount) AS amount,
        c.category_name, 
        c.category_color, 
        c.category_icon
      FROM expense_plans p
      LEFT JOIN expense_categories c ON p.category_id = c.category_id
      WHERE p.user_id = ?
        AND YEAR(p.date) = ?
      GROUP BY p.category_id, c.category_name, c.category_color, c.category_icon
      ORDER BY SUM(p.amount) DESC
      `,
      [userId, year]
    );

    return rows;
  }
}



function parseMonthYearToDate(monthYear) {
  const parts = monthYear.split("-").map((p) => p.trim());
  if (parts.length !== 2) throw new Error("monthYear format invalid");
  let year, month;
  if (parts[0].length === 4) {
    // YYYY-MM
    year = parts[0];
    month = parts[1].padStart(2, "0");
  } else {
    // MM-YYYY
    month = parts[0].padStart(2, "0");
    year = parts[1];
  }
  return `${year}-${month}-01`;
}

module.exports = new PlanModel();
