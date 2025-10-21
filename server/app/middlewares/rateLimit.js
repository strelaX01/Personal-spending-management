const rateLimit = require('express-rate-limit');

// Giới hạn tối đa 100 request / 15 phút / mỗi IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true, // Thêm thông tin rate limit vào headers
  legacyHeaders: false
});

module.exports = apiLimiter;
