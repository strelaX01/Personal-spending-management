const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/db');

router.post('/AddExpense', (req, res) => {
    const { token, categoryId, amount, date, description } = req.body;

    if (!token || !categoryId || !amount || !date) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const formattedDateForQuery = `${date.slice(0, 4)}-${date.slice(5, 7)}`;
    const mysqlDate = date.slice(0, 10);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'SELECT CAST(amount AS SIGNED) AS amount FROM expense_plans WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?',
            [userId, formattedDateForQuery, categoryId],
            (err, planResults) => {
                if (err) {
                    console.error('[AddExpense] Lỗi khi lấy kế hoạch chi tiêu:', err);
                    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                }

                if (planResults.length === 0 || planResults[0].amount === 0) {
                    return res.status(400).json({
                        message: 'Bạn chưa lập kế hoạch chi tiêu cho danh mục này trong tháng. Bạn có muốn tiếp tục không?',
                        requireConfirmation: true
                    });
                }

                const spendingLimit = planResults[0].amount;

                db.query(
                    'SELECT CAST(SUM(amount) AS SIGNED) AS totalSpent FROM expenses WHERE user_id = ? AND category_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?',
                    [userId, categoryId, formattedDateForQuery],
                    (err, spendResults) => {
                        if (err) {
                            console.error('[AddExpense] Lỗi khi lấy tổng chi tiêu:', err);
                            return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                        }

                        const totalSpent = spendResults[0].totalSpent || 0;

                        if (totalSpent + parseFloat(amount) > spendingLimit) {
                            console.warn('[AddExpense] Vượt quá hạn mức chi tiêu.');
                            return res.status(400).json({
                                message: 'Tổng chi tiêu cho danh mục này trong tháng đã vượt hạn mức! Bạn có muốn tiếp tục không?',
                                requireConfirmation: true
                            });
                        }

                        db.query(
                            'INSERT INTO expenses (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)',
                            [userId, categoryId, amount, description, mysqlDate],
                            (err, result) => {
                                if (err) {
                                    return res.status(500).json({ message: 'Lỗi máy chủ khi lưu chi tiêu.' });
                                }

                                return res.status(201).json({ message: 'Chi tiêu đã được lưu thành công!' });
                            }
                        );
                    }
                );
            }
        );
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/confirmExpense', (req, res) => {
    const { token, categoryId, amount, date, description } = req.body;

    if (!token || !categoryId || !amount || !date) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    let mysqlDate;
    try {
        mysqlDate = date.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(mysqlDate)) {
            throw new Error('Định dạng ngày không hợp lệ');
        }
    } catch (err) {
        console.error('Lỗi định dạng ngày:', err);
        return res.status(400).json({ message: 'Ngày không đúng định dạng (YYYY-MM-DD)' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'INSERT INTO expenses (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)',
            [userId, categoryId, amount, description, mysqlDate],
            (err, result) => {
                if (err) {
                    console.error('Lỗi khi thêm chi tiêu:', err);
                    return res.status(500).json({ message: 'Lỗi máy chủ khi lưu chi tiêu.' });
                }

                return res.status(201).json({ message: 'Chi tiêu đã được lưu thành công!' });
            }
        );
    } catch (err) {
        console.error('Lỗi xác thực token hoặc server:', err.message);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/confirmIncome', (req, res) => {
    const { token, categoryId, amount, date, description } = req.body;

    if (!token || !categoryId || !amount || !date) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    let mysqlDate;
    try {
        mysqlDate = date.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(mysqlDate)) {
            throw new Error('Định dạng ngày không hợp lệ');
        }
    } catch (err) {
        return res.status(400).json({ message: 'Ngày không đúng định dạng (YYYY-MM-DD)' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'INSERT INTO incomes (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)',
            [userId, categoryId, amount, description, mysqlDate],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Lỗi máy chủ khi lưu thu nhập.' });
                }

                return res.status(201).json({ message: 'Thu nhập đã được lưu thành công!' });
            }
        );
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.put('/EditExpense/:expense_id', (req, res) => {
    const { token, category_id, amount, date, description } = req.body;
    const { expense_id } = req.params;

    if (!token || !category_id || !amount || !date) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    const formattedDate = `${date.slice(0, 4)}-${date.slice(5, 7)}`;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'SELECT CAST(amount AS SIGNED) AS amount FROM expense_plans WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?',
            [userId, formattedDate, category_id],
            (err, planResults) => {
                if (err) {
                    console.error('Lỗi khi lấy kế hoạch chi tiêu:', err);
                    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                }

                if (planResults.length === 0 || planResults[0].amount === 0) {
                    return res.status(400).json({
                        message: 'Bạn chưa lập kế hoạch chi tiêu cho danh mục này trong tháng. Bạn có muốn tiếp tục không?',
                        requireConfirmation: true
                    });
                }

                const spendingLimit = planResults[0].amount;

                db.query(
                    'SELECT CAST(SUM(amount) AS SIGNED) AS totalSpent FROM expenses WHERE user_id = ? AND category_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND id != ?',
                    [userId, category_id, formattedDate, expense_id],
                    (err, spendResults) => {
                        if (err) {
                            console.error('Lỗi khi lấy tổng chi tiêu:', err);
                            return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                        }

                        const totalSpent = spendResults[0].totalSpent || 0;

                        if (totalSpent + parseFloat(amount) > spendingLimit) {
                            return res.status(400).json({
                                message: 'Tổng chi tiêu cho danh mục này trong tháng đã vượt hạn mức! Bạn có muốn tiếp tục không?',
                                requireConfirmation: true
                            });
                        }

                        db.query(
                            'UPDATE expenses SET category_id = ?, amount = ?, description = ?, date = ? WHERE user_id = ? AND id = ?',
                            [category_id, amount, description, date, userId, expense_id],
                            (err, result) => {
                                if (err) {
                                    console.error('Lỗi khi cập nhật chi tiêu:', err);
                                    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                                }

                                if (result.affectedRows === 0) {
                                    return res.status(404).json({ message: 'Không tìm thấy chi tiêu' });
                                }

                                return res.status(200).json({ message: 'Chi tiêu đã được cập nhật thành công!' });
                            }
                        );
                    }
                );
            }
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/confirmEditExpense', (req, res) => {
    const { token, category_id, amount, date, description, expense_id } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'UPDATE expenses SET category_id = ?, amount = ?, description = ?, date = ? WHERE user_id = ? AND id = ?',
            [category_id, amount, description, date, userId, expense_id],
            (err, result) => {
                if (err) {
                    console.error('Lỗi khi cập nhật chi tiêu:', err);
                    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Không tìm thấy chi tiêu' });
                }

                return res.status(200).json({ message: 'Chi tiêu đã được cập nhật thành công!' });
            }
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Token không hợp lệ hoặc lỗi server' });
    }
});

router.put('/EditIncome/:income_id', (req, res) => {
    const { token, category_id, amount, date, description } = req.body;
    const { income_id } = req.params;

    if (!token || !category_id || !amount || !date || !income_id) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    const formattedDate = `${date.slice(0, 4)}-${date.slice(5, 7)}`;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'SELECT CAST(amount AS SIGNED) AS amount FROM income_plans WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?',
            [userId, formattedDate, category_id],
            (err, planResults) => {
                if (err) {
                    console.error('Lỗi khi lấy kế hoạch thu nhập:', err);
                    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                }

                if (planResults.length === 0 || planResults[0].amount === 0) {
                    return res.status(401).json({
                        message: 'Bạn chưa lập kế hoạch thu nhập cho danh mục này trong tháng. Bạn có muốn tiếp tục không?',
                        requireConfirmation: true
                    });
                }

                db.query(
                    'UPDATE incomes SET category_id = ?, amount = ?, description = ?, date = ? WHERE user_id = ? AND id = ?',
                    [category_id, amount, description, date, userId, income_id],
                    (err, result) => {
                        if (err) {
                            console.error('Lỗi khi cập nhật thu nhập:', err);
                            return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(404).json({ message: 'Không tìm thấy thu nhập' });
                        }

                        return res.status(200).json({ message: 'Thu nhập đã được cập nhật thành công!' });
                    }
                );
            }
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/AddIncome', (req, res) => {
    const { token, categoryId, amount, date, description } = req.body;

    if (!token || !categoryId || !amount || !date) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const formattedDateForQuery = `${date.slice(0, 4)}-${date.slice(5, 7)}`;

    let mysqlDate;
    try {
        mysqlDate = date.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(mysqlDate)) {
            throw new Error('Định dạng ngày không hợp lệ');
        }
    } catch (err) {
        console.error('Lỗi định dạng ngày:', err);
        return res.status(400).json({ message: 'Ngày không đúng định dạng (YYYY-MM-DD)' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'SELECT CAST(amount AS SIGNED) AS amount FROM income_plans WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?',
            [userId, formattedDateForQuery, categoryId],
            (err, planResults) => {
                if (err) {
                    console.error('Lỗi khi lấy kế hoạch thu nhập:', err);
                    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                }

                if (planResults.length === 0 || planResults[0].amount === 0) {
                    return res.status(400).json({
                        message: 'Bạn chưa lập kế hoạch thu nhập cho danh mục này trong tháng. Bạn có muốn tiếp tục không?',
                        requireConfirmation: true
                    });
                }

                db.query(
                    'INSERT INTO incomes (user_id, category_id, amount, description, date) VALUES (?, ?, ?, ?, ?)',
                    [userId, categoryId, amount, description, mysqlDate],
                    (err, result) => {
                        if (err) {
                            console.error('Lỗi khi thêm thu nhập:', err);
                            return res.status(500).json({ message: 'Lỗi máy chủ khi lưu thu nhập.' });
                        }
                        return res.status(201).json({ message: 'Thu nhập đã được lưu thành công!' });
                    }
                );
            }
        );
    } catch (err) {
        console.error('Lỗi xác thực token hoặc server:', err.message);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/confirmEditIncome', (req, res) => {
    const { token, category_id, amount, date, description, income_id } = req.body;

    if (!token || !category_id || !amount || !date || !income_id) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'UPDATE incomes SET category_id = ?, amount = ?, description = ?, date = ? WHERE user_id = ? AND id = ?',
            [category_id, amount, description, date, userId, income_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Không tìm thấy thu nhập' });
                }

                return res.status(200).json({ message: 'Thu nhập đã được cập nhật thành công!' });
            }
        );
    } catch (err) {
        console.error('Lỗi xác thực token hoặc lỗi server:', err);
        return res.status(500).json({ message: 'Token không hợp lệ hoặc lỗi server' });
    }
});

router.get('/getIncome', (req, res) => {
    const { token, monthYear } = req.query; 

    const [month, year] = monthYear.split('-').map(Number);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT e.id, e.user_id, e.category_id, 
                    CAST(e.amount AS SIGNED) AS amount, 
                    e.description, 
                    DATE_FORMAT(CONVERT_TZ(e.date, '+00:00', '+07:00'), '%d-%m-%Y') AS date, 
                    ec.category_name, ec.category_color, ec.category_icon
             FROM incomes e
             JOIN income_categories ec ON e.category_id = ec.category_id
             WHERE e.user_id = ? AND MONTH(e.date) = ? AND YEAR(e.date) = ?`,
            [userId, month, year],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi tìm nạp thu nhập' });
                }
                return res.status(200).json({ incomes: results });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});


router.get('/getExpense', (req, res) => {
    const { token, monthYear } = req.query;

    const [month, year] = monthYear.split('-').map(Number);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT e.id, e.user_id, e.category_id, 
                    CAST(e.amount AS SIGNED) AS amount, 
                    e.description, 
                    DATE_FORMAT(CONVERT_TZ(e.date, '+00:00', '+07:00'), '%d-%m-%Y') AS date, 
                    ec.category_name, ec.category_color, ec.category_icon
             FROM expenses e
             JOIN expense_categories ec ON e.category_id = ec.category_id
             WHERE e.user_id = ? AND MONTH(e.date) = ? AND YEAR(e.date) = ?`,
            [userId, month, year],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'Lỗi khi tìm nạp chi tiêu' });
                }

                return res.status(200).json({ expenses: results });
            }
        );
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server' });
    }
});


router.get('/getTotalAmount', (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT 
                CAST((COALESCE((SELECT SUM(amount) FROM incomes WHERE user_id = ?), 0) - 
                     COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = ?), 0)) AS SIGNED) AS totalAmount`,
            [userId, userId],
            (err, results) => {
                if (err) {
                    console.error('Lỗi khi lấy số dư:', err);
                    return res.status(500).json({ message: 'Lỗi khi lấy số dư' });
                }
                return res.status(200).json({ totalAmount: results[0].totalAmount });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.delete('/DeleteIncome/:id', (req, res) => {
    const incomeId = req.params.id;
    const { token } = req.query;

    if (!incomeId) {
        return res.status(400).json({ message: 'ID thu nhập là bắt buộc' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query('DELETE FROM incomes WHERE id = ? AND user_id = ?', [incomeId, userId], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi xóa thu nhập' });
            }
            return res.status(200).json({ message: 'Đã xóa thu nhập thành công' });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.delete('/DeleteExpense/:id', (req, res) => {
    const expenseId = req.params.id;
    const { token } = req.query;
    if (!expenseId) {
        return res.status(400).json({ message: 'ID chi tiêu là bắt buộc' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [expenseId, userId], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi xóa chi tiêu' });
            }
            return res.status(200).json({ message: 'Đã xóa chi tiêu thành công' });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getAnnualExpense', (req, res) => {
    const { token, year } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        db.query(
            `SELECT e.id, e.user_id, e.category_id, 
                    CAST(e.amount AS SIGNED) AS amount, 
                    e.description, 
                    DATE_FORMAT(CONVERT_TZ(e.date, '+00:00', '+07:00'), '%d-%m-%Y') AS date, 
                    ec.category_name, ec.category_color, ec.category_icon
             FROM expenses e
             JOIN expense_categories ec ON e.category_id = ec.category_id
             WHERE e.user_id = ? AND YEAR(e.date) = ?`,
            [userId, year],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi tìm nạp chi tiêu' });
                }
                return res.status(200).json({ expenses: results });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getAnnualIncome', (req, res) => {
    const { token, year } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT e.id, e.user_id, e.category_id, 
                    CAST(e.amount AS SIGNED) AS amount, 
                    e.description, 
                    DATE_FORMAT(CONVERT_TZ(e.date, '+00:00', '+07:00'), '%d-%m-%Y') AS date, 
                    ec.category_name, ec.category_color, ec.category_icon
             FROM incomes e
             JOIN income_categories ec ON e.category_id = ec.category_id
             WHERE e.user_id = ? AND YEAR(e.date) = ?`,
            [userId, year],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi tìm nạp thu nhập' });
                }
                return res.status(200).json({ incomes: results });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;