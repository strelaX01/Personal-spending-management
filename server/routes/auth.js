const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/db');
const { sendVerificationEmail } = require('../utils/email');
const { validateEmail, validatePassword, generateVerificationCode, generateRandomPassword } = require('../utils/auth');
const { generateRandomName } = require('../utils/nameGenerator');

const verificationCodes = new Map();

router.post('/register', async (req, res) => {
    console.log('Đang xử lý yêu cầu đăng ký...');
    const { email, password, repassword } = req.body;

    if (!validateEmail(email)) {
        return res.status(422).json({ message: 'Địa chỉ email không hợp lệ' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return res.status(422).json({ message: passwordValidation.message });
    }

    if (password !== repassword) {
        return res.status(422).json({ message: 'Mật khẩu không khớp' });
    }

    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi cơ sở dữ liệu' });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: 'Email đã tồn tại' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationCode = generateVerificationCode();
            const { randomFirstName, randomLastName } = generateRandomName();

            db.query(
                'INSERT INTO users (firstname, lastname, email, password, verification) VALUES (?, ?, ?, ?, ?)',
                [randomFirstName, randomLastName, email, hashedPassword, false],
                async (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Lỗi lưu người dùng' });
                    }

                    verificationCodes.set(email, verificationCode);
                    setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);

                    try {
                        await sendVerificationEmail(email, verificationCode, 'Mã xác minh tài khoản', `Mã xác minh của bạn là: ${verificationCode}`);
                        return res.status(200).json({
                            message: 'Người dùng đã đăng ký thành công. Vui lòng kiểm tra email của bạn để xác minh.',
                        });
                    } catch (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                    }
                }
            );
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/verify', (req, res) => {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
        return res.status(400).json({ message: 'Cần có email và mã xác minh' });
    }

    const savedCode = verificationCodes.get(email);

    if (!savedCode) {
        return res.status(404).json({ message: 'Mã xác minh đã hết hạn hoặc không tồn tại' });
    }

    if (savedCode !== parseInt(verificationCode)) {
        return res.status(401).json({ message: 'Mã xác minh không hợp lệ' });
    }

    verificationCodes.delete(email);
    db.query('UPDATE users SET verification = ? WHERE email = ?', [true, email], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Không cập nhật được trạng thái xác minh' });
        }
        res.status(200).json({ message: 'Đăng ký thành công' });
    });
});

router.post('/resend', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                return res.status(404).json({ message: 'Email không tìm thấy' });
            }

            const verificationCode = generateVerificationCode();

            verificationCodes.set(email, verificationCode);
            setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);

            sendVerificationEmail(email, verificationCode, 'Gửi lại mã xác minh', `Mã xác minh mới của bạn là: ${verificationCode}`)
                .then(() => {
                    return res.status(200).json({
                        success: true,
                        message: 'Mã xác minh mới đã được gửi tới email của bạn.',
                    });
                })
                .catch((err) => {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Lỗi truy vấn cơ sở dữ liệu' });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
            }

            if (!user.verification) {
                const verificationCode = generateVerificationCode();
                verificationCodes.set(email, verificationCode);

                setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);

                try {
                    await sendVerificationEmail(email, verificationCode, 'Mã xác minh tài khoản', `Mã xác minh của bạn là: ${verificationCode}`);
                    return res.status(402).json({ message: 'Vui lòng xác minh email của bạn để đăng nhập', email });
                } catch (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                }
            } else {
                const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET);
                return res.status(200).json({
                    message: 'Đăng nhập thành công',
                    token,
                });
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.get('/getUserName', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Token là bắt buộc' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'SELECT firstname, lastname, email FROM users WHERE user_id = ?',
            [userId],
            (err, results) => {
                if (err) {
                    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
                    return res.status(500).json({ message: 'Lỗi máy chủ khi truy vấn thông tin người dùng.' });
                }

                if (results.length === 0) {
                    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
                }

                const user = results[0];
                return res.status(200).json({ firstname: user.firstname, lastname: user.lastname, email: user.email });
            }
        );
    } catch (error) {
        console.error('Lỗi xác thực token:', error.message);
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
});

router.post('/renameUser', (req, res) => {
    const { token, firstName, lastName } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({ message: 'Cần phải có họ và tên' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'UPDATE users SET firstName = ?, lastName = ? WHERE user_id = ?',
            [firstName, lastName, userId],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Lỗi truy vấn cơ sở dữ liệu' });
                }

                if (results.affectedRows === 0) {
                    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
                }

                return res.status(200).json({ message: 'Người dùng đã đổi tên thành công' });
            }
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/ForgotPassword', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Lỗi truy vấn cơ sở dữ liệu' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Email không tồn tại' });
            }

            const user = results[0];

            if (!user.verification) {
                const verificationCode = generateVerificationCode();
                verificationCodes.set(email, verificationCode);
                setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);

                try {
                    await sendVerificationEmail(email, verificationCode, 'Mã xác minh tài khoản', `Mã xác minh của bạn là: ${verificationCode}`);
                    return res.status(402).json({ message: 'Tài khoản chưa xác minh', email });
                } catch (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                }
            } else {
                const resetCode = generateVerificationCode();
                verificationCodes.set(email, resetCode);
                setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);

                try {
                    await sendVerificationEmail(email, resetCode, 'Mã đặt lại mật khẩu', `Mã đặt lại mật khẩu của bạn là: ${resetCode}`);
                    return res.status(200).json({ message: 'Mã đặt lại mật khẩu đã được gửi đến email của bạn', email });
                } catch (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi gửi email đặt lại mật khẩu' });
                }
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/ForgotPasswordverify', async (req, res) => {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
        return res.status(400).json({ message: 'Cần có email và mã xác thực' });
    }

    try {
        const storedVerificationCode = verificationCodes.get(email);

        if (!storedVerificationCode) {
            return res.status(404).json({ message: 'Mã xác thực đã hết hạn hoặc chưa được yêu cầu' });
        }

        if (parseInt(verificationCode) !== storedVerificationCode) {
            return res.status(401).json({ message: 'Mã xác thực không hợp lệ' });
        }

        verificationCodes.delete(email);

        const newPassword = generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi cập nhật mật khẩu' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'Người dùng không tìm thấy' });
            }

            sendVerificationEmail(email, newPassword, 'Mật khẩu mới của bạn', `Mật khẩu mới của bạn là: ${newPassword}`)
                .then(() => {
                    return res.status(200).json({
                        message: 'Mật khẩu mới đã được tạo và gửi qua email thành công.',
                    });
                })
                .catch((error) => {
                    console.log(error);
                    return res.status(500).json({ message: 'Lỗi gửi email' });
                });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/ForgotPasswordResend', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                return res.status(404).json({ message: 'Email không tìm thấy' });
            }

            const verificationCode = generateVerificationCode();

            verificationCodes.set(email, verificationCode);
            setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);

            sendVerificationEmail(email, verificationCode, 'Gửi lại mã xác minh', `Mã xác minh mới của bạn là: ${verificationCode}`)
                .then(() => {
                    return res.status(200).json({
                        success: true,
                        message: 'Mã xác minh mới được gửi tới email của bạn.',
                    });
                })
                .catch((err) => {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/ChangePassword', async (req, res) => {
    const { token, oldPassword, newPassword, confirmPassword } = req.body;

    if (!token || !oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Mật khẩu mới không khớp' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query('SELECT * FROM users WHERE user_id = ?', [userId], async (err, results) => {
            if (err) return res.status(500).json({ message: 'Lỗi truy vấn database' });
            if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

            const user = results[0];
            const isMatch = await bcrypt.compare(oldPassword, user.password);

            if (!isMatch) return res.status(401).json({ message: 'Mật khẩu cũ không đúng' });

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedNewPassword, userId], (err) => {
                if (err) return res.status(500).json({ message: 'Lỗi khi cập nhật mật khẩu' });
                return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
            });
        });
    } catch (err) {
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;