require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/category');
const planRoutes = require('./routes/plan');
const transactionRoutes = require('./routes/transaction');

const app = express();

app.use(express.json());
app.use(cors());

<<<<<<< HEAD
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/transaction', transactionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy trên cổng ${PORT}`);
=======

let activeTokens = [];

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000);
}

const verificationCodes = new Map();

const generateRandomName = () => {
    const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Paul', 'Joshua'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return { randomFirstName, randomLastName };
};

// Password validation
const validatePassword = (password) => {
    if (password.length < 8) {
        return { valid: false, message: 'Mật khẩu phải dài ít nhất 8 ký tự' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Mật khẩu phải chứa ít nhất một chữ cái viết thường' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Mật khẩu phải chứa ít nhất một số' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt' };
    }
    return { valid: true };
};

// Register
app.post('/register', async (req, res) => {
    const { email, password, repassword } = req.body;

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|aol\.com|icloud\.com|mail\.com|zoho\.com|ictu\.edu\.vn)$/;
        return re.test(String(email).toLowerCase());
    };


    if (!validateEmail(email)) {
        return res.status(422).json({ message: 'Địa chỉ email không hợp lệ' });
    }

    if (!validateEmail(email)) {
        return res.status(401).json({ message: 'Địa chỉ email không hợp lệ' });
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
                (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Lỗi lưu người dùng' });
                    }

                    verificationCodes.set(email, verificationCode);
                    setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);

                    const mailOptions = {
                        from: 'hoanggiangminecraft@gmail.com',
                        to: email,
                        subject: 'Mã xác minh tài khoản',
                        text: `Mã xác minh của bạn là: ${verificationCode}`,
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                        }
                        return res.status(200).json({
                            message: 'Người dùng đã đăng ký thành công. Vui lòng kiểm tra email của bạn để xác minh.',
                        });
                    });
                }
            );
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

// Verify
app.post('/verify', (req, res) => {
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

// Resend
app.post('/resend', async (req, res) => {
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

            const mailOptions = {
                from: 'hoanggiangminecraft@gmail.com',
                to: email,
                subject: 'Gửi lại mã xác minh',
                text: `Mã xác minh mới của bạn là: ${verificationCode}`,
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                }
                return res.status(200).json({
                    success: true,
                    message: 'Mã xác minh mới đã được gửi tới email của bạn.',
                });
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

// Login
app.post('/login', async (req, res) => {
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


                const mailOptions = {
                    from: 'hoanggiangminecraft@gmail.com',
                    to: email,
                    subject: 'Mã xác minh tài khoản',
                    text: `Mã xác minh của bạn là: ${verificationCode}`,
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                    }
                    return res.status(402).json({ message: 'Vui lòng xác minh email của bạn để đăng nhập', email });
                });
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

// Get user name
app.get('/getUserName', (req, res) => {
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

// Change user name
app.post('/renameUser', (req, res) => {
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



// Forgot password
app.post('/ForgotPassword', async (req, res) => {
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


                const mailOptions = {
                    from: 'hoanggiangminecraft@gmail.com',
                    to: email,
                    subject: 'Mã xác minh tài khoản',
                    text: `Mã xác minh của bạn là: ${verificationCode}`,
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                    }
                    return res.status(402).json({ message: 'Tài khoản chưa xác minh', email });
                });
            } else {

                const resetCode = generateVerificationCode();
                verificationCodes.set(email, resetCode);
                setTimeout(() => verificationCodes.delete(email), 15 * 60 * 1000);


                const mailOptions = {
                    from: 'hoanggiangminecraft@gmail.com',
                    to: email,
                    subject: 'Mã đặt lại mật khẩu',
                    text: `Mã đặt lại mật khẩu của bạn là: ${resetCode}`,
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Lỗi gửi email đặt lại mật khẩu' });
                    }
                    return res.status(200).json({ message: 'Mã đặt lại mật khẩu đã được gửi đến email của bạn', email });
                });
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});


function generateRandomPassword(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}
// Forgot password verify
app.post('/ForgotPasswordverify', async (req, res) => {
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

            const mailOptions = {
                from: 'Hoanggiangminecraft@gmail.com',
                to: email,
                subject: 'Mật khẩu mới của bạn',
                text: `Mật khẩu mới của bạn là: ${newPassword}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: 'Lỗi gửi email' });
                }
                return res.status(200).json({
                    message: 'Mật khẩu mới đã được tạo và gửi qua email thành công.',
                });
            });
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});
// Forgot password resend
app.post('/ForgotPasswordResend', async (req, res) => {
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

            const mailOptions = {
                from: 'hoanggiangminecraft@gmail.com',
                to: email,
                subject: 'Gửi lại mã xác minh',
                text: `Mã xác minh mới của bạn là: ${verificationCode}`,
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi gửi email xác minh' });
                }
                return res.status(200).json({
                    success: true,
                    message: 'Mã xác minh mới được gửi tới email của bạn.',
                });
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

// Change password
app.post('/ChangePassword', async (req, res) => {
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
// Add income category
app.post('/AddIncomeCategory', (req, res) => {
    const { name, color, icon, token } = req.body;

    if (!name || !color || !icon || !token) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId

        db.query('INSERT INTO income_categories (user_id, category_name, category_color, category_icon) VALUES (?, ?, ?, ?)', [userId, name, color, icon], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi lưu danh mục' });
            }
            return res.status(200).json({ message: 'Đã lưu danh mục thành công' });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});
// Edit income category
app.put('/EditIncomeCategory/:categoryId', (req, res) => {
    const { name, color, icon, token } = req.body;
    const { categoryId } = req.params;

    if (!name || !color || !icon || !token || !categoryId) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

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

    } catch (err) {
        console.error('Lỗi xác thực:', err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

// Delete income category
app.delete('/DeleteIncomeCategory/:id', (req, res) => {
    const categoryId = req.params.id;
    const { token } = req.query;

    if (!categoryId) {
        return res.status(400).json({ message: 'ID danh mục là bắt buộc' });
    }


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId

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
// Get income categories
app.get('/GetIncomeCategories', (req, res) => {
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
// Add expense category
app.get('/GetExpenseCategories', (req, res) => {
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


// Add expense category
app.post('/AddExpenseCategory', (req, res) => {
    const { name, color, icon, token } = req.body;

    if (!name || !color || !icon || !token) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId

        db.query('INSERT INTO expense_categories (user_id, category_name, category_color, category_icon) VALUES (?, ?, ?, ?)', [userId, name, color, icon], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Lỗi lưu danh mục' });
            }
            return res.status(200).json({ message: 'Đã lưu danh mục thành công' });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});
// Edit expense category
app.put('/EditExpenseCategory/:categoryId', (req, res) => {
    const { name, color, icon, token } = req.body;
    const { categoryId } = req.params;

    if (!name || !color || !icon || !token || !categoryId) {
        return res.status(400).json({ message: 'Vui lòng điền vào tất cả các trường' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            'UPDATE expense_categories SET category_name = ?, category_color = ?, category_icon = ? WHERE user_id = ? AND category_id = ?',
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

    } catch (err) {
        console.error('Lỗi xác thực:', err);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

// Delete expense category
app.delete('/DeleteExpenseCategory/:id', (req, res) => {
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


// Get expense categories
app.post('/saveExpensePlan', (req, res) => {
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
// Get expense plan
app.get('/getExpensePlan', (req, res) => {
    const { token, monthYear } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const [month, year] = monthYear.split('-');

        db.query(
            `SELECT ip.*, ic.category_name, ic.category_color, ic.category_icon 
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

// Get income plan
app.get('/getIncomePlan', (req, res) => {
    const { token, monthYear } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const [month, year] = monthYear.split('-');

        db.query(
            `SELECT ip.*, ic.category_name, ic.category_color, ic.category_icon 
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

// Add income plan
app.post('/saveIncomePlan', (req, res) => {
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


// Add expense
app.post('/AddExpense', (req, res) => {
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
            'SELECT amount FROM expense_plans WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?',
            [userId, formattedDateForQuery, categoryId],
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
                    'SELECT SUM(amount) AS totalSpent FROM expenses WHERE user_id = ? AND category_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?',
                    [userId, categoryId, formattedDateForQuery],
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
                    }
                );
            }
        );
    } catch (err) {
        console.error('Lỗi xác thực token hoặc server:', err.message);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});


// Add confirmation expense
app.post('/confirmExpense', (req, res) => {
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


// Add confirmation income
app.post('/confirmIncome', (req, res) => {
    const { token, categoryId, amount, date, description } = req.body;


    if (!token || !categoryId || !amount || !date) {
        console.error('Thiếu thông tin đầu vào:', { token, categoryId, amount, date });
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
    } catch (err) {
        console.error('Lỗi xác thực token hoặc server:', err.message);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

// edit expenses
app.put('/EditExpense/:expense_id', (req, res) => {
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
            'SELECT amount FROM expense_plans WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?',
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
                    'SELECT SUM(amount) AS totalSpent FROM expenses WHERE user_id = ? AND category_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND id != ?',
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

// edit expenses confirmation
app.post('/confirmEditExpense', (req, res) => {
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

// edit income
app.put('/EditIncome/:income_id', (req, res) => {
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
            'SELECT amount FROM income_plans WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?',
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


//add income
app.post('/AddIncome', (req, res) => {
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
            'SELECT amount FROM income_plans WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ? AND category_id = ?',
            [userId, formattedDateForQuery, categoryId],
            (err, planResults) => {
                if (err) {
                    console.error('Lỗi khi lấy kế hoạch thu nhập:', err);
                    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
                }


                if (planResults.length === 0 || planResults[0].amount === 0) {
                    console.log('Chưa có kế hoạch thu nhập hoặc amount = 0');
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
                        console.log('Thu nhập đã được thêm, result:', result);
                        return res.status(201).json({ message: 'Thu nhập đã được lưu thành công!' }); // Sửa status thành 201
                    }
                );
            }
        );
    } catch (err) {
        console.error('Lỗi xác thực token hoặc server:', err.message);
        return res.status(500).json({ message: 'Lỗi server' });
    }
});

// edit income confirmation
app.post('/confirmEditIncome', (req, res) => {
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


// Get income
app.get('/getIncome', (req, res) => {
    const { token, monthYear } = req.query;

    const [month, year] = monthYear.split('-').map(Number);

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId

        db.query(
            `SELECT e.id, e.user_id, e.category_id, e.amount, e.description, 
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



// Get expense
app.get('/getExpense', (req, res) => {
    const { token, monthYear } = req.query;


    const [month, year] = monthYear.split('-').map(Number);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;


        db.query(
            `SELECT e.id, e.user_id, e.category_id, e.amount, e.description, 
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

// Get total amount
app.get('/getTotalAmount', (req, res) => {
    const { token } = req.query;


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT 
                (COALESCE((SELECT SUM(amount) FROM incomes WHERE user_id = ?), 0) - 
                 COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = ?), 0)) AS totalAmount `,
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



// delete income
app.delete('/DeleteIncome/:id', (req, res) => {
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
// delete expense
app.delete('/DeleteExpense/:id', (req, res) => {
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

// Get annual expense
app.get('/getAnnualExpense', (req, res) => {
    const { token, year } = req.query;

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        db.query(
            `SELECT e.id, e.user_id, e.category_id, e.amount, e.description, 
                    DATE_FORMAT(CONVERT_TZ(e.date, '+00:00', '+07:00'), '%d-%m-%Y') AS date, 
                    ec.category_name, ec.category_color, ec.category_icon
             FROM expenses e
             JOIN expense_categories ec ON e.category_id = ec.category_id
             WHERE e.user_id = ? AND  YEAR(e.date) = ?`,
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
// Get annual income
app.get('/getAnnualIncome', (req, res) => {
    const { token, year } = req.query;


    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        db.query(
            `SELECT e.id, e.user_id, e.category_id, e.amount, e.description, 
                    DATE_FORMAT(CONVERT_TZ(e.date, '+00:00', '+07:00'), '%d-%m-%Y') AS date, 
                    ec.category_name, ec.category_color, ec.category_icon
             FROM incomes e
             JOIN income_categories ec ON e.category_id = ec.category_id
             WHERE e.user_id = ? AND  YEAR(e.date) = ?`,
            [userId, year],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Lỗi khi tìm nạp chi phí' });
                }
                return res.status(200).json({ incomes: results });
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Lỗi server' });
    }

});
// Get monthly expense plan
app.get('/getMonthlyExpensePlan', (req, res) => {
    const { token, monthYear } = req.query;


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const [month, year] = monthYear.split('-');
        const formattedDate = `${year}-${month}-01`;

        const query = `
            SELECT ep.plan_id, ep.category_id, ep.amount, 
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


// Get monthly income plan
app.get('/getMonthlyIncomePlan', (req, res) => {
    const { token, monthYear } = req.query;


    const [month, year] = monthYear.split('-');
    const formattedDate = `${year}-${month}-01`;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const query = `
            SELECT ip.plan_id, ip.category_id, ip.amount, 
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

// Get annual expense plan
app.get('/getAnnualExpensePlan', (req, res) => {
    const { token, year } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const query = `
        SELECT 
            MIN(ep.plan_id) AS plan_id, 
            ep.category_id, 
            MAX(ep.amount) AS amount, 
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

// Get annual income plan
app.get('/getAnnualIncomePlan', (req, res) => {
    const { token, year } = req.query;


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const query = `
        SELECT 
            MIN(ip.plan_id) AS plan_id, 
            ip.category_id, 
            MAX(ip.amount) AS amount, 
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



app.listen(3000, () => {
    console.log('Server started on port 3000');
>>>>>>> eace508c10eced53687afe40a8a2bbaaa287535a
});