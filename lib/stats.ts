import { bonusAmountForCommission, bonusPercentForCashCollected } from "./bonus";

export type StatInput = {
  showed: string;
  result: string | null;
  cashCollected: number;
  commission: number;
};

export type Stats = {
  totalCalls: number;
  closedDeals: number;
  cc: number;
  commission: number;
  bonusPercent: number;
  bonusAmount: number;
  commissionWithBonus: number;
  showRate: number;
  pctOnCallsTaken: number;
  pctOnCallsBooked: number;
  shows: number;
  noShows: number;
  cancels: number;
  rescheduled: number;
  cancelRate: number;
  dealsWon: number;
  dealsLost: number;
  followUps: number;
  ccPerCall: number;
  closeRate: number;
};

export function computeStats(appointments: StatInput[]): Stats {
  const totalCalls = appointments.length;
  const shows = appointments.filter((a) => a.showed === "Showed").length;
  const noShows = appointments.filter((a) => a.showed === "No Show").length;
  const cancels = appointments.filter((a) => a.showed === "Cancelled").length;
  const rescheduled = appointments.filter((a) => a.showed === "Rescheduled").length;
  const dealsWon = appointments.filter((a) => a.result === "Won").length;
  const dealsLost = appointments.filter((a) => a.result === "Lost").length;
  const followUps = appointments.filter((a) => a.result === "Follow-Up").length;
  const cc = appointments.reduce((sum, a) => sum + a.cashCollected, 0);
  const commission = appointments.reduce((sum, a) => sum + a.commission, 0);
  const bonusPercent = bonusPercentForCashCollected(cc);
  const bonusAmount = bonusAmountForCommission(commission, bonusPercent);

  return {
    totalCalls,
    closedDeals: dealsWon,
    cc,
    commission,
    bonusPercent,
    bonusAmount,
    commissionWithBonus: commission + bonusAmount,
    showRate: totalCalls ? shows / totalCalls : 0,
    pctOnCallsTaken: shows ? dealsWon / shows : 0,
    pctOnCallsBooked: totalCalls ? dealsWon / totalCalls : 0,
    shows,
    noShows,
    cancels,
    rescheduled,
    cancelRate: totalCalls ? cancels / totalCalls : 0,
    dealsWon,
    dealsLost,
    followUps,
    ccPerCall: totalCalls ? cc / totalCalls : 0,
    closeRate: shows ? dealsWon / shows : 0,
  };
}

export function emptyStats(): Stats {
  return computeStats([]);
}

export function monthRange(month: string): { gte: Date; lt: Date } | null {
  // month format: "YYYY-MM"
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const gte = new Date(Date.UTC(year, monthIndex, 1));
  const lt = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { gte, lt };
}
