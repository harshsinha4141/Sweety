// Glucose domain constants and helpers shared by the readings and reports services.

const MAX_READINGS_PER_DAY = 4;
const MIN_VALUE = 40;
const MAX_VALUE = 600;

// time_slot values stored in glucose_reading.time_slot.
// start/end = the slot's window in the patient's local time (hours, end exclusive). A slot can
// only be logged (or its reading changed) while its window is open; afterwards it is missed.
const SLOTS = [
  { time_slot: 0, label: "Before breakfast", fasting: true, start: 6, end: 10 },
  { time_slot: 1, label: "After breakfast", fasting: false, start: 10, end: 14 },
  { time_slot: 2, label: "After lunch", fasting: false, start: 14, end: 18 },
  { time_slot: 3, label: "After dinner", fasting: false, start: 18, end: 22 },
];

// 6 → "6:00 AM", 14 → "2:00 PM"
const formatHour = (hour) => `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;

// "6:00 AM – 10:00 AM"
const slotWindow = (slot) => `${formatHour(SLOTS[slot].start)} – ${formatHour(SLOTS[slot].end)}`;

// The slot whose window contains this local hour (0–23), or null (10 PM – 6 AM has none).
const slotAtHour = (hour) => SLOTS.find((s) => hour >= s.start && hour < s.end)?.time_slot ?? null;

// Target ranges (mg/dl): below 70 is low for every slot;
// fasting above 130 and after-meal above 180 are high.
const LOW_BELOW = 70;
const FASTING_HIGH_ABOVE = 130;
const AFTER_MEAL_HIGH_ABOVE = 180;

const slotLabel = (slot) => SLOTS[slot]?.label;

function statusOf(value, slot) {
  if (value < LOW_BELOW) return "low";
  const highAbove = SLOTS[slot]?.fasting ? FASTING_HIGH_ABOVE : AFTER_MEAL_HIGH_ABOVE;
  return value > highAbove ? "high" : "normal";
}

const round1 = (n) => Math.round(n * 10) / 10;

// Adds slot_label + status to a DB row.
const decorate = (row) => ({
  ...row,
  slot_label: slotLabel(row.time_slot),
  status: statusOf(row.glucose_value, row.time_slot),
});

module.exports = {
  MAX_READINGS_PER_DAY,
  MIN_VALUE,
  MAX_VALUE,
  SLOTS,
  slotLabel,
  formatHour,
  slotWindow,
  slotAtHour,
  statusOf,
  round1,
  decorate,
};
