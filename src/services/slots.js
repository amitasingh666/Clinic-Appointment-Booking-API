const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// "10:30" -> 630
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// 630 -> "10:30"
function toHHMM(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Checks format AND that the date really exists (rejects 2026-02-30)
function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(`${dateStr}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === dateStr;
}

// "2026-11-02" -> "mon"
function getWeekdayKey(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return DAY_KEYS[d.getUTCDay()];
}

// ["10:00-13:00"], 30 -> ["10:00", "10:30", ..., "12:30"]
function generateSlots(ranges, slotMinutes) {
  const slots = [];
  for (const range of ranges) {
    const [startStr, endStr] = range.split('-');
    const start = toMinutes(startStr);
    const end = toMinutes(endStr);
    // a slot must FINISH by the end time, so 12:30 + 30 = 13:00 is ok
    for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
      slots.push(toHHMM(t));
    }
  }
  return slots;
}

// All slots for that date minus the booked ones
function getFreeSlots(doctor, dateStr, bookedTimes) {
  const dayKey = getWeekdayKey(dateStr);
  const ranges = doctor.schedule[dayKey] || []; // doctor doesn't work that day -> []
  const allSlots = generateSlots(ranges, doctor.slot_minutes);
  const booked = new Set(bookedTimes);
  return allSlots.filter((slot) => !booked.has(slot));
}

module.exports = {
  toMinutes,
  toHHMM,
  isValidDate,
  getWeekdayKey,
  generateSlots,
  getFreeSlots,
};