const TokenService = require('../services/TokenService');

function authMiddleware(req, res, next) {
  try {
    // accept token in header Authorization: Bearer <token> or req.body.token or req.query.token
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    else token = req.body.token || req.query.token;

    if (!token) return res.status(401).json({ message: 'Token không được cung cấp' });
    const decoded = TokenService.verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

module.exports = authMiddleware;
