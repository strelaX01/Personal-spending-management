const crypto = require('crypto');

const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|aol\.com|icloud\.com|mail\.com|zoho\.com|ictu\.edu\.vn)$/;
    return re.test(String(email).toLowerCase());
};

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

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const generateRandomPassword = (length) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

module.exports = { validateEmail, validatePassword, generateVerificationCode, generateRandomPassword };