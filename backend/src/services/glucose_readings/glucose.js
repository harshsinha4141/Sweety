// Glucose domain constants and helpers shared by the readings and reports services.

const MAX_READINGS_PER_DAY = 4;
const MIN_VALUE = 40;
const MAX_VALUE = 600;

// time_slot values stored in glucose_reading.time_slot
const SLOTS = [
  { time_slot: 0, label: "Morning (fasting)", fasting: true },
  { time_slot: 1, label: "After breakfast", fasting: false },
  { time_slot: 2, label: "After lunch", fasting: false },
  { time_slot: 3, label: "After dinner", fasting: false },
];

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
  statusOf,
  round1,
  decorate,
};
