const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/db');

router.post('/AddIncomeCategory', (req, res) => {
    const { name, color, icon, token } = req.body;

    if (!name || !color || !icon || !token) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'SELECT * FROM income_categories WHERE user_id = ? AND category_name = ? AND category_color = ? AND category_icon = ?',
            [userId, name, color, icon],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Lỗi kiểm tra danh mục' });
                }

                if (results.length > 0) {
                    return res.status(409).json({ message: 'Danh mục này đã tồn tại' });
                }

                db.query(
                    'INSERT INTO income_categories (user_id, category_name, category_color, category_icon) VALUES (?, ?, ?, ?)',
                    [userId, name, color, icon],
                    (err, results) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({ message: 'Lỗi lưu danh mục' });
                        }

                        return res.status(200).json({ message: 'Đã lưu danh mục thành công' });
                    }
                );
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.put('/EditIncomeCategory/:categoryId', (req, res) => {
    const { name, color, icon, token } = req.body;
    const { categoryId } = req.params;

    if (!name || !color || !icon || !token || !categoryId) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT * FROM income_categories 
             WHERE user_id = ? AND category_name = ? AND category_color = ? AND category_icon = ? 
             AND category_id != ?`,
            [userId, name, color, icon, categoryId],
            (err, results) => {
                if (err) {
                    console.error('Lỗi khi kiểm tra trùng:', err);
                    return res.status(500).json({ message: 'Lỗi kiểm tra danh mục' });
                }

                if (results.length > 0) {
                    return res.status(409).json({ message: 'Danh mục này đã tồn tại' });
                }

                db.query(
                    'UPDATE income_categories SET category_name = ?, category_color = ?, category_icon = ? WHERE user_id = ? AND category_id = ?',
                    [name, color, icon, userId, categoryId],
                    (err, results) => {
                        if (err) {
                            console.error('Lỗi khi cập nhật danh mục:', err);
                            return res.status(500).json({ message: 'Lỗi lưu danh mục' });
                        }

                        if (results.affectedRows === 0) {
                            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
                        }

                        return res.status(200).json({ message: 'Đã lưu danh mục thành công' });
                    }
                );
            }
        );
    } catch {
        console.error('Lỗi xác thực:', err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.delete('/DeleteIncomeCategory/:id', (req, res) => {
    const categoryId = req.params.id;
    const { token } = req.query;

    if (!categoryId) {
        return res.status(400).json({ message: 'ID danh mục là bắt buộc' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query('DELETE FROM income_plans WHERE category_id = ? AND user_id = ?', [categoryId, userId], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi khi xóa kế hoạch' });
            }

            db.query('DELETE FROM incomes WHERE category_id = ? AND user_id = ?', [categoryId, userId], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi xóa khoản thu nhập' });
                }

                db.query('DELETE FROM income_categories WHERE category_id = ? AND user_id = ?', [categoryId, userId], (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Lỗi khi xóa danh mục' });
                    }
                    return res.status(200).json({ message: 'Đã xóa danh mục, kế hoạch và khoản thu nhập liên quan' });
                });
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/GetIncomeCategories', (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'SELECT * FROM income_categories WHERE user_id = ?',
            [userId],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi tìm nạp danh mục' });
                }
                return res.status(200).json(results);
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/GetExpenseCategories', (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'SELECT * FROM expense_categories WHERE user_id = ?',
            [userId],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi tìm nạp danh mục' });
                }
                return res.status(200).json(results);
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.post('/AddExpenseCategory', (req, res) => {
    const { name, color, icon, token } = req.body;

    if (!name || !color || !icon || !token) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT * FROM expense_categories 
             WHERE user_id = ? AND category_name = ? AND category_color = ? AND category_icon = ?`,
            [userId, name, color, icon],
            (err, results) => {
                if (err) {
                    console.error('Lỗi kiểm tra trùng:', err);
                    return res.status(500).json({ message: 'Lỗi kiểm tra danh mục' });
                }

                if (results.length > 0) {
                    return res.status(409).json({ message: 'Danh mục này đã tồn tại' });
                }

                db.query(
                    `INSERT INTO expense_categories (user_id, category_name, category_color, category_icon) 
                     VALUES (?, ?, ?, ?)`,
                    [userId, name, color, icon],
                    (err, results) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: 'Lỗi lưu danh mục' });
                        }
                        return res.status(200).json({ message: 'Đã lưu danh mục thành công' });
                    }
                );
            }
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.put('/EditExpenseCategory/:categoryId', (req, res) => {
    const { name, color, icon, token } = req.body;
    const { categoryId } = req.params;

    if (!name || !color || !icon || !token || !categoryId) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT * FROM expense_categories 
             WHERE user_id = ? AND category_name = ? AND category_color = ? AND category_icon = ? 
             AND category_id != ?`,
            [userId, name, color, icon, categoryId],
            (err, results) => {
                if (err) {
                    console.error('Lỗi khi kiểm tra trùng:', err);
                    return res.status(500).json({ message: 'Lỗi kiểm tra danh mục' });
                }

                if (results.length > 0) {
                    return res.status(409).json({ message: 'Danh mục này đã tồn tại' });
                }

                db.query(
                    `UPDATE expense_categories 
                     SET category_name = ?, category_color = ?, category_icon = ? 
                     WHERE user_id = ? AND category_id = ?`,
                    [name, color, icon, userId, categoryId],
                    (err, results) => {
                        if (err) {
                            console.error('Lỗi khi cập nhật danh mục:', err);
                            return res.status(500).json({ message: 'Lỗi lưu danh mục' });
                        }

                        if (results.affectedRows === 0) {
                            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
                        }

                        return res.status(200).json({ message: 'Đã lưu danh mục thành công' });
                    }
                );
            }
        );
    } catch (err) {
        console.error('Lỗi xác thực:', err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.delete('/DeleteExpenseCategory/:id', (req, res) => {
    const categoryId = req.params.id;
    const { token } = req.query;

    if (!categoryId) {
        return res.status(400).json({ message: 'Category ID is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query('DELETE FROM expense_plans WHERE category_id = ? AND user_id = ?', [categoryId, userId], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi khi xóa kế hoạch' });
            }

            db.query('DELETE FROM expenses WHERE category_id = ? AND user_id = ?', [categoryId, userId], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi xóa khoản chi tiêu' });
                }

                db.query('DELETE FROM expense_categories WHERE category_id = ? AND user_id = ?', [categoryId, userId], (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Lỗi khi xóa danh mục' });
                    }
                    return res.status(200).json({ message: 'Đã xóa danh mục, kế hoạch và khoản chi tiêu liên quan' });
                });
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;