"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, RotateCcw } from "lucide-react";

type Field = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
  followUpLabel?: string;
};

type Waiver = {
  id: string;
  title: string;
  body_text: string;
  fields: Field[];
  operator_id: string;
};

export default function WaiverForm({ waiver }: { waiver: Waiver }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function setValue(id: string, value: string) {
    setValues((v) => ({ ...v, [id]: value }));
  }

  function clearSig() {
    sigRef.current?.clear();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Please agree to the waiver terms.");
      return;
    }
    if (sigRef.current?.isEmpty()) {
      setError("Please provide your signature.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    // Save signature as data URL (stored as text — no file upload needed for MVP)
    const signatureDataUrl = sigRef.current!.toDataURL("image/png");

    // Map well-known fields to dedicated columns
    const guestName = values["name"] ?? values[waiver.fields.find((f) => f.type === "text" && f.label.toLowerCase().includes("name"))?.id ?? ""] ?? "";
    const guestEmail = values["email"] ?? values[waiver.fields.find((f) => f.type === "email")?.id ?? ""] ?? null;
    const guestAge = values["age"] ?? values[waiver.fields.find((f) => f.type === "number" && f.label.toLowerCase().includes("age"))?.id ?? ""] ?? null;
    const guestCountry = values["country"] ?? values[waiver.fields.find((f) => f.label.toLowerCase().includes("country"))?.id ?? ""] ?? null;

    const { error } = await supabase.from("submissions").insert({
      waiver_id: waiver.id,
      operator_id: waiver.operator_id,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_age: guestAge ? parseInt(guestAge) : null,
      guest_country: guestCountry,
      form_data: values,
      signature_url: signatureDataUrl,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">You&apos;re all signed in!</h2>
        <p className="text-zinc-400 text-sm">Your waiver has been submitted. Enjoy your adventure!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Waiver text */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-5">
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{waiver.body_text}</p>
      </div>

      {/* Dynamic fields */}
      {waiver.fields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            {field.label}
            {field.required && <span className="text-orange-400 ml-1">*</span>}
          </label>

          {field.type === "conditional" ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setValue(field.id, opt)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                      values[field.id] === opt
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {values[field.id] === "Yes" && field.followUpLabel && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    {field.followUpLabel}
                    {field.required && <span className="text-orange-400 ml-1">*</span>}
                  </label>
                  <textarea
                    required={field.required}
                    value={values[`${field.id}_followup`] ?? ""}
                    onChange={(e) => setValue(`${field.id}_followup`, e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                  />
                </div>
              )}
              {field.required && !values[field.id] && (
                <input type="text" required className="sr-only" aria-hidden />
              )}
            </div>
          ) : field.type === "select" ? (
            <select
              required={field.required}
              value={values[field.id] ?? ""}
              onChange={(e) => setValue(field.id, e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select…</option>
              {(field.options ?? "").split(",").map((opt) => (
                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                required={field.required}
                checked={values[field.id] === "true"}
                onChange={(e) => setValue(field.id, e.target.checked ? "true" : "false")}
                className="accent-orange-500 w-4 h-4"
                id={`field-${field.id}`}
              />
              <label htmlFor={`field-${field.id}`} className="text-sm text-zinc-400">{field.label}</label>
            </div>
          ) : (
            <input
              type={field.type}
              required={field.required}
              value={values[field.id] ?? ""}
              onChange={(e) => setValue(field.id, e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          )}
        </div>
      ))}

      {/* Agreement */}
      <div className="flex items-start gap-3 bg-zinc-900 rounded-xl border border-zinc-700 p-4">
        <input
          type="checkbox"
          id="agree"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="accent-orange-500 w-4 h-4 mt-0.5 shrink-0"
        />
        <label htmlFor="agree" className="text-sm text-zinc-300">
          I have read and agree to the above waiver. I understand the risks involved and voluntarily participate.
        </label>
      </div>

      {/* Signature */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-zinc-300">
            Signature <span className="text-orange-400">*</span>
          </label>
          <button
            type="button"
            onClick={clearSig}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        </div>
        <div className="rounded-xl border border-zinc-700 overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigRef}
            penColor="#111"
            canvasProps={{ className: "w-full h-36 touch-none", style: { width: "100%", height: 144 } }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">Draw your signature above</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold transition disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Sign & submit"}
      </button>
    </form>
  );
}
