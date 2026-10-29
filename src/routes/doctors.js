const express = require('express');
const pool = require('../db');

const router = express.Router();
const { isValidDate, getFreeSlots } = require('../services/slots');

// Convert a DB row (snake_case) into an API object (camelCase)
function toDoctor(row) {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    schedule: row.schedule,
    slotMinutes: row.slot_minutes,
  };
}

// GET /doctors?specialty=Cardiology
router.get('/', async (req, res, next) => {
  try {
    const { specialty } = req.query;

    let sql = 'SELECT id, name, specialty, schedule, slot_minutes FROM doctors';
    const params = [];

    if (specialty) {
      sql += ' WHERE LOWER(specialty) = LOWER($1)';
      params.push(specialty);
    }

    sql += ' ORDER BY name';

    const result = await pool.query(sql, params);
    res.json(result.rows.map(toDoctor));
  } catch (err) {
    next(err); // hand the error to the central error handler
  }
});

// GET /doctors/:id/slots?date=2026-11-02
router.get('/:id/slots', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // 1. Validate input
    if (!date || !isValidDate(date)) {
      return res.status(400).json({ error: 'date is required in YYYY-MM-DD format' });
    }

    // 2. Find the doctor
    const doctorResult = await pool.query(
      'SELECT id, schedule, slot_minutes FROM doctors WHERE id = $1',
      [id]
    );
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    const doctor = doctorResult.rows[0];

    // 3. Get already-booked times for that doctor and date
    const bookedResult = await pool.query(
      `SELECT to_char(time, 'HH24:MI') AS time
       FROM appointments
       WHERE doctor_id = $1 AND date = $2`,
      [id, date]
    );
    const bookedTimes = bookedResult.rows.map((r) => r.time);

    // 4. Compute free slots
    const slots = getFreeSlots(doctor, date, bookedTimes);

    res.json({ doctorId: id, date, slots });
  } catch (err) {
    next(err);
  }
});

module.exports = router;