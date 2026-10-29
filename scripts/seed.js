const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

const doctors = require('../data/doctor.json');
const appointments = require('../data/appointments.json');

async function seed() {
  // Take ONE connection from the pool, because a transaction
  // must run all its queries on the same connection.
  const client = await pool.connect();

  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    await client.query('BEGIN');

    // 1. Create tables (if they don't exist)
    await client.query(schema);

    // 2. Clear old data so the seed can be re-run cleanly
    await client.query('TRUNCATE appointments, doctors RESTART IDENTITY CASCADE');

    // 3. Insert doctors
    for (const d of doctors) {
      await client.query(
        `INSERT INTO doctors (id, name, specialty, schedule, slot_minutes)
         VALUES ($1, $2, $3, $4, $5)`,
        [d.id, d.name, d.specialty, JSON.stringify(d.schedule), d.slotMinutes]
      );
    }

    // 4. Insert appointments
    for (const a of appointments) {
      await client.query(
        `INSERT INTO appointments (doctor_id, patient_name, date, time)
         VALUES ($1, $2, $3, $4)`,
        [a.doctorId, a.patientName, a.date, a.time]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${doctors.length} doctors and ${appointments.length} appointments`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed, rolled back:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();  // give the connection back to the pool
    await pool.end();  // close the pool so the script can exit
  }
}

seed();