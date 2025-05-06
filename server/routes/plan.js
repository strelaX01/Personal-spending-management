const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/db');

router.post('/saveExpensePlan', (req, res) => {
    const { token, expensePlan, monthYear } = req.body;

    if (!token || !expensePlan || !monthYear) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const [month, year] = monthYear.split('-');
        const formattedMonthYear = `${year}-${month}-01`;

        const deleteQuery = `DELETE FROM expense_plans WHERE user_id = ? AND date = ?`;
        db.query(deleteQuery, [userId, formattedMonthYear], (deleteErr, deleteResult) => {
            if (deleteErr) {
                return res.status(500).json({ message: 'Lỗi khi xóa các kế hoạch chi tiêu cũ' });
            }

            const insertQuery = `INSERT INTO expense_plans (user_id, category_id, amount, date) VALUES ?`;
            const values = expensePlan.map(item => [userId, item.category_id, item.amount, formattedMonthYear]);

            db.query(insertQuery, [values], (insertErr, insertResult) => {
                if (insertErr) {
                    return res.status(500).json({ message: 'Lỗi khi chèn kế hoạch chi phí' });
                }
                res.status(200).json({ message: 'Đã lưu thành công kế hoạch' });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getExpensePlan', (req, res) => {
    const { token, monthYear } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const [month, year] = monthYear.split('-');

        db.query(
            `SELECT 
                ip.category_id,
                CAST(ip.amount AS SIGNED) AS amount,
                ip.date,
                ip.user_id,
                ip.plan_id,
                ic.category_name, 
                ic.category_color, 
                ic.category_icon 
            FROM expense_plans ip 
            JOIN expense_categories ic ON ip.category_id = ic.category_id 
            WHERE ip.user_id = ? 
            AND YEAR(ip.date) = ? 
            AND MONTH(ip.date) = ?`,
            [userId, year, month],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi tải kế hoạch chi phí' });
                }
                return res.status(200).json({ expensePlan: results });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getIncomePlan', (req, res) => {
    const { token, monthYear } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const [month, year] = monthYear.split('-');

        db.query(
            `SELECT 
                ip.plan_id,
                ip.user_id,
                ip.category_id,
                CAST(ip.amount AS SIGNED) AS amount,
                ip.date,
                ic.category_name, 
                ic.category_color, 
                ic.category_icon 
            FROM income_plans ip 
            JOIN income_categories ic ON ip.category_id = ic.category_id 
            WHERE ip.user_id = ? 
            AND YEAR(ip.date) = ? 
            AND MONTH(ip.date) = ?`,
            [userId, year, month],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi tải kế hoạch thu nhập' });
                }
                return res.status(200).json({ incomePlan: results });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/saveIncomePlan', (req, res) => {
    const { token, incomePlan, monthYear } = req.body;

    if (!token || !incomePlan || !monthYear) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const [month, year] = monthYear.split('-');
        const formattedMonthYear = `${year}-${month}-01`;

        const deleteQuery = `DELETE FROM income_plans WHERE user_id = ? AND date = ?`;
        db.query(deleteQuery, [userId, formattedMonthYear], (deleteErr, deleteResult) => {
            if (deleteErr) {
                return res.status(500).json({ message: 'Error deleting old income plans' });
            }

            const insertQuery = `INSERT INTO income_plans (user_id, category_id, amount, date) VALUES ?`;
            const values = incomePlan.map(item => [userId, item.category_id, item.amount, formattedMonthYear]);

            db.query(insertQuery, [values], (insertErr, insertResult) => {
                if (insertErr) {
                    return res.status(500).json({ message: 'Lỗi khi chèn kế hoạch thu nhập' });
                }

                res.status(200).json({ message: 'Đã lưu thành công kế hoạch' });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getMonthlyExpensePlan', (req, res) => {
    const { token, monthYear } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const [month, year] = monthYear.split('-');
        const formattedDate = `${year}-${month}-01`;

        const query = `
            SELECT ep.plan_id, ep.category_id, CAST(ep.amount AS UNSIGNED) AS amount, 
                   ec.category_name, ec.category_icon, ec.category_color
            FROM expense_plans ep
            LEFT JOIN expense_categories ec ON ep.category_id = ec.category_id
            WHERE ep.user_id = ? AND ep.date = ?
        `;
        db.query(query, [userId, formattedDate], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Lỗi khi tải kế hoạch chi tiêu' });
            }
            return res.status(200).json({ expensePlan: results });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getMonthlyIncomePlan', (req, res) => {
    const { token, monthYear } = req.query;

    const [month, year] = monthYear.split('-');
    const formattedDate = `${year}-${month}-01`;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const query = `
            SELECT ip.plan_id, ip.category_id, CAST(ip.amount AS UNSIGNED) AS amount, 
                   ic.category_name, ic.category_icon, ic.category_color
            FROM income_plans ip
            LEFT JOIN income_categories ic ON ip.category_id = ic.category_id
            WHERE ip.user_id = ? AND ip.date = ?
        `;

        db.query(query, [userId, formattedDate], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi khi tải kế hoạch thu nhập' });
            }
            return res.status(200).json({ incomePlan: results });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getAnnualExpensePlan', (req, res) => {
    const { token, year } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const query = `
        SELECT 
            MIN(ep.plan_id) AS plan_id, 
            ep.category_id, 
             CAST(MAX(ep.amount) AS UNSIGNED) AS amount, 
            ec.category_name, 
            ec.category_icon, 
            ec.category_color
        FROM expense_plans ep
        LEFT JOIN expense_categories ec ON ep.category_id = ec.category_id
        WHERE ep.user_id = ? AND YEAR(ep.date) = ?
        GROUP BY ep.category_id
    `;
        db.query(query, [userId, year], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi khi tải kế hoạch chi phí' });
            }
            return res.status(200).json({ expensePlan: results });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getAnnualIncomePlan', (req, res) => {
    const { token, year } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const query = `
        SELECT 
            MIN(ip.plan_id) AS plan_id, 
            ip.category_id, 
            CAST(MAX(ip.amount) AS UNSIGNED) AS amount, 
            ic.category_name, 
            ic.category_icon, 
            ic.category_color
        FROM income_plans ip
        LEFT JOIN income_categories ic ON ip.category_id = ic.category_id
        WHERE ip.user_id = ? AND YEAR(ip.date) = ?
        GROUP BY ip.category_id
    `;
        db.query(query, [userId, year], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Lỗi khi tải kế hoạch thu nhập' });
            }
            return res.status(200).json({ incomePlan: results });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;