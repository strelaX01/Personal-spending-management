require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./app/routes/authRoutes');
const financeRoutes = require('./app/routes/financeRoutes');
const apiLimiter = require('./app/middlewares/rateLimit');
const errorHandler = require('./app/middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

// Áp dụng rate limit cho tất cả API route
// app.use('/api/', apiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);

// Route kiểm tra server
app.get('/', (req, res) => res.json({ success: true, message: 'API is running' }));

// Middleware xử lý lỗi chung (phải để cuối cùng)
app.use(errorHandler);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
