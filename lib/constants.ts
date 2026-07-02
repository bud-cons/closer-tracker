// Roster of closers and setter/origin options. Same 8 names serve both roles.
// Edit this list to add/remove people — closers get seeded into the DB on next
// `npm run seed`, and the Setter/Origin dropdown reads straight from this file.
export const PEOPLE = [
  "Bud",
  "Ryan",
  "Steve",
  "JJ",
  "Sterling",
  "Eric",
  "Brandon",
  "Patrick",
] as const;

export const SHOWED_OPTIONS = ["Showed", "No Show", "Cancelled", "Rescheduled"] as const;

export const RESULT_OPTIONS = ["Won", "Lost", "Follow-Up"] as const;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
