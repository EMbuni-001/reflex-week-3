const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/auth');
const deliveryRoutes = require('./src/routes/deliveries');
const riderRoutes = require('./src/routes/riders');
const dashboardRoutes = require('./src/routes/dashboard');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler); // must be the LAST app.use() call

module.exports = app;