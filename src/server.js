require('dotenv').config();
const express = require('express');
const pool = require('./db');
const doctorsRouter = require('./routes/doctors');
const appointmentsRouter = require('./routes/appointments');

const app = express();
app.use(express.json());

app.get('/health', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    next(err);
  }
});

// Mount routers
app.use('/doctors', doctorsRouter);
app.use('/appointments', appointmentsRouter);

// 404 for any route that didn't match
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Central error handler (4 arguments = Express treats it as an error handler)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});