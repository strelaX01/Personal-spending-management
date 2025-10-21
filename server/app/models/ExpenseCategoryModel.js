const db = require('../db/Database');

class ExpenseCategoryModel {
  // Thêm danh mục chi tiêu
  async add({ userId, name, color = null, icon = null }) {
    const [result] = await db.query(
      'INSERT INTO expense_categories (user_id, category_name, category_color, category_icon) VALUES (?, ?, ?, ?)',
      [userId, name, color, icon]
    );
    return result.insertId;
  }

  // Cập nhật danh mục chi tiêu
  async update({ userId, category_id, name, color, icon }) {
    const [result] = await db.query(
      'UPDATE expense_categories SET category_name = ?, category_color = ?, category_icon = ? WHERE category_id = ? AND user_id = ?',
      [name, color, icon, category_id, userId]
    );
    return result.affectedRows;
  }

  // Xóa danh mục chi tiêu và các liên quan
  async delete({ userId, category_id }) {
    await db.query('DELETE FROM expense_plans WHERE category_id = ? AND user_id = ?', [
      category_id,
      userId,
    ]);

    await db.query('DELETE FROM expenses WHERE category_id = ? AND user_id = ?', [
      category_id,
      userId,
    ]);

    const [result] = await db.query(
      'DELETE FROM expense_categories WHERE category_id = ? AND user_id = ?',
      [category_id, userId]
    );

    return result.affectedRows;
  }

  // Lấy tất cả danh mục chi tiêu
  async getAll({ userId }) {
    const [rows] = await db.query('SELECT * FROM expense_categories WHERE user_id = ?', [userId]);
    return rows;
  }

  // Tìm danh mục theo ID
  async findById({ userId, categoryId }) {
    const [rows] = await db.query(
      'SELECT * FROM expense_categories WHERE category_id = ? AND user_id = ?',
      [categoryId, userId]
    );
    return rows[0];
  }
}

module.exports = new ExpenseCategoryModel();
