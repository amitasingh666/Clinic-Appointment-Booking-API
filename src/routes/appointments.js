const express = require('express');
const pool = require('../db');
const { isValidDate, getWeekdayKey, generateSlots } = require('../services/slots');

const router = express.Router();

// "00:00" to "23:59"
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function toAppointment(row) {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientName: row.patient_name,
    date: row.date,
    time: row.time,
  };
}

// POST /appointments
// body: { "doctorId": "d1", "patientName": "Ravi", "date": "2026-11-02", "time": "10:30" }
router.post('/', async (req, res, next) => {
  try {
    const { doctorId, patientName, date, time } = req.body || {};

    // 1. Validate the body
    if (!doctorId || typeof patientName !== 'string' || !patientName.trim() || !date || !time) {
      return res.status(400).json({ error: 'doctorId, patientName, date and time are required' });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }
    if (!TIME_RE.test(time)) {
      return res.status(400).json({ error: 'time must be HH:MM' });
    }

    // 2. Doctor must exist
    const doctorResult = await pool.query(
      'SELECT id, schedule, slot_minutes FROM doctors WHERE id = $1',
      [doctorId]
    );
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    const doctor = doctorResult.rows[0];

    // 3. Time must be a real slot in the doctor's schedule for that day
    const ranges = doctor.schedule[getWeekdayKey(date)] || [];
    const validSlots = generateSlots(ranges, doctor.slot_minutes);
    if (!validSlots.includes(time)) {
      return res.status(400).json({ error: 'Not a valid slot for this doctor on this date' });
    }

    // 4. Insert; the UNIQUE constraint blocks double booking
    const result = await pool.query(
      `INSERT INTO appointments (doctor_id, patient_name, date, time)
       VALUES ($1, $2, $3, $4)
       RETURNING id, doctor_id, patient_name, date, to_char(time, 'HH24:MI') AS time`,
      [doctorId, patientName.trim(), date, time]
    );

    res.status(201).json(toAppointment(result.rows[0]));
  } catch (err) {
    // 23505 = unique_violation → someone already has this slot
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Slot already booked' });
    }
    next(err);
  }
});

module.exports = router;