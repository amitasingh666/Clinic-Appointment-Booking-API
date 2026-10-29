const express = require('express');
const pool = require('../db');

const router = express.Router();

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

module.exports = router;