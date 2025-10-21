function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Đã có lỗi xảy ra từ server';
  const details = err.details || null;

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = errorHandler;
