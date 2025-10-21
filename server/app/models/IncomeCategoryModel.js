const db = require("../db/Database");

class IncomeCategoryModel {
  // Thêm danh mục
  async add({ userId, name, color = null, icon = null }) {
    const [result] = await db.query(
      "INSERT INTO income_categories (user_id, category_name, category_color, category_icon) VALUES (?, ?, ?, ?)",
      [userId, name, color, icon]
    );
    return result.insertId;
  }

  // Cập nhật danh mục
  async update({ userId, category_id, name, color, icon }) {
    const [result] = await db.query(
      "UPDATE income_categories SET category_name = ?, category_color = ?, category_icon = ? WHERE category_id = ? AND user_id = ?",
      [name, color, icon, category_id, userId]
    );
    return result.affectedRows;
  }

  // Xóa danh mục cùng với kế hoạch và thu nhập liên quan
  async delete({ userId, category_id }) {
    // Xóa kế hoạch
    await db.query(
      "DELETE FROM income_plans WHERE category_id = ? AND user_id = ?",
      [category_id, userId]
    );

    // Xóa thu nhập
    await db.query(
      "DELETE FROM incomes WHERE category_id = ? AND user_id = ?",
      [category_id, userId]
    );

    // Xóa danh mục
    const [result] = await db.query(
      "DELETE FROM income_categories WHERE category_id = ? AND user_id = ?",
      [category_id, userId]
    );

    return result.affectedRows;
  }

  // Lấy tất cả danh mục của user
  async getAll({ userId }) {
    const [rows] = await db.query(
      "SELECT * FROM income_categories WHERE user_id = ?",
      [userId]
    );
    return rows;
  }

  // Tìm danh mục theo ID
  async findById({ userId, categoryId }) {
    const [rows] = await db.query(
      "SELECT * FROM income_categories WHERE category_id = ? AND user_id = ?",
      [categoryId, userId]
    );
    return rows[0];
  }
}

module.exports = new IncomeCategoryModel();
