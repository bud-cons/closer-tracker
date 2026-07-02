import type { Stats } from "./stats";

export type Appointment = {
  id: string;
  closerId: string;
  name: string;
  dateBooked: string | null;
  appointmentDate: string;
  requestedTime: string | null;
  setterOrigin: string;
  showed: string;
  result: string | null;
  rescheduleDate: string | null;
  cashCollected: number;
  commission: number;
  objection: string | null;
};

export type Closer = {
  id: string;
  name: string;
  order: number;
};

export type { Stats };
