"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.82;

function resizeToJpegBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      URL.revokeObjectURL(url);
      resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image"));
    };
    img.src = url;
  });
}

type Props = {
  parseType: "food" | "workout";
  onParsed: (result: Record<string, unknown>) => void;
  label?: string;
};

export default function ScreenshotUpload({ parseType, onParsed, label }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const { base64, mediaType } = await resizeToJpegBase64(file);
      const res = await fetch("/api/tracker/parse-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: parseType, imageBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read that screenshot");
      onParsed(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
        {busy ? "Reading screenshot..." : (label ?? "Upload screenshot")}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={handleFile}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
