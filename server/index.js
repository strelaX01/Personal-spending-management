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


app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/transaction', transactionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy trên cổng ${PORT}`);
}
);
