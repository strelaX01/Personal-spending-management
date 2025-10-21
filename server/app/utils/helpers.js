const crypto = require('crypto');

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

function validateEmail(email) {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

function validatePassword(password) {
  if (!password || password.length < 8) return { valid: false, message: 'Mật khẩu tối thiểu 8 ký tự' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Cần ít nhất 1 chữ hoa' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Cần ít nhất 1 số' };
  return { valid: true };
}

function generateRandomPassword(len = 12) {
  return crypto.randomBytes(len).toString('base64').slice(0, len);
}

module.exports = { generateVerificationCode, validateEmail, validatePassword, generateRandomPassword };
