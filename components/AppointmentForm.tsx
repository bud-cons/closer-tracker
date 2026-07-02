"use client";

import { useState } from "react";
import { PEOPLE, SHOWED_OPTIONS, RESULT_OPTIONS } from "@/lib/constants";
import { toInputDate } from "@/lib/format";
import type { Appointment } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";

export type AppointmentFormValues = {
  name: string;
  dateBooked: string;
  appointmentDate: string;
  requestedTime: string;
  setterOrigin: string;
  showed: string;
  result: string;
  rescheduleDate: string;
  cashCollected: string;
  commission: string;
  objection: string;
};

function toFormValues(appointment?: Appointment): AppointmentFormValues {
  return {
    name: appointment?.name ?? "",
    dateBooked: toInputDate(appointment?.dateBooked),
    appointmentDate: toInputDate(appointment?.appointmentDate) || toInputDate(new Date().toISOString()),
    requestedTime: appointment?.requestedTime ?? "",
    setterOrigin: appointment?.setterOrigin ?? PEOPLE[0],
    showed: appointment?.showed ?? SHOWED_OPTIONS[0],
    result: appointment?.result ?? "",
    rescheduleDate: toInputDate(appointment?.rescheduleDate),
    cashCollected: appointment ? String(appointment.cashCollected) : "0",
    commission: appointment ? String(appointment.commission) : "0",
    objection: appointment?.objection ?? "",
  };
}

export default function AppointmentForm({
  appointment,
  onCancel,
  onSubmit,
}: {
  appointment?: Appointment;
  onCancel: () => void;
  onSubmit: (values: AppointmentFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<AppointmentFormValues>(toFormValues(appointment));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof AppointmentFormValues>(key: K, value: AppointmentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!values.appointmentDate) {
      setError("Appointment date is required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSubmit(values);
    } catch {
      setError("Failed to save. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {appointment ? "Edit Appointment" : "Add Appointment"}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input value={values.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Requested Time">
            <input
              value={values.requestedTime}
              onChange={(e) => set("requestedTime", e.target.value)}
              className={inputClass}
              placeholder="e.g. 2:00 PM EST"
            />
          </Field>
          <Field label="Date Booked">
            <input
              type="date"
              value={values.dateBooked}
              onChange={(e) => set("dateBooked", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Appointment Date">
            <input
              type="date"
              value={values.appointmentDate}
              onChange={(e) => set("appointmentDate", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Setter / Origin">
            <select
              value={values.setterOrigin}
              onChange={(e) => set("setterOrigin", e.target.value)}
              className={inputClass}
            >
              {PEOPLE.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Showed">
            <select value={values.showed} onChange={(e) => set("showed", e.target.value)} className={inputClass}>
              {SHOWED_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Result">
            <select value={values.result} onChange={(e) => set("result", e.target.value)} className={inputClass}>
              <option value="">—</option>
              {RESULT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reschedule Date">
            <input
              type="date"
              value={values.rescheduleDate}
              onChange={(e) => set("rescheduleDate", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Cash Collected">
            <input
              type="number"
              step="0.01"
              value={values.cashCollected}
              onChange={(e) => set("cashCollected", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Commission">
            <input
              type="number"
              step="0.01"
              value={values.commission}
              onChange={(e) => set("commission", e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Objection (if any)">
              <textarea
                value={values.objection}
                onChange={(e) => set("objection", e.target.value)}
                className={`${inputClass} min-h-[60px]`}
              />
            </Field>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
