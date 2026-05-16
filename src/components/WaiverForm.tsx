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

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent text-sm";
const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

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

    const signatureDataUrl = sigRef.current!.toDataURL("image/png");

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
        <CheckCircle size={52} className="text-arb-teal mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-arb-green mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
          YOU&apos;RE ALL SET!
        </h2>
        <p className="text-gray-500 text-sm">Your waiver has been submitted. Enjoy your adventure with us!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Waiver text */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{waiver.body_text}</p>
      </div>

      {/* Dynamic fields */}
      {waiver.fields.map((field) => (
        <div key={field.id}>
          {field.type !== "checkbox" && (
            <label className={labelClass}>
              {field.label}
              {field.required && <span className="text-arb-blue ml-1">*</span>}
            </label>
          )}

          {field.type === "conditional" ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setValue(field.id, opt)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition ${
                      values[field.id] === opt
                        ? "bg-arb-blue border-arb-blue text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:border-arb-blue"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {values[field.id] === "Yes" && field.followUpLabel && (
                <div>
                  <label className={labelClass}>
                    {field.followUpLabel}
                    {field.required && <span className="text-arb-blue ml-1">*</span>}
                  </label>
                  <textarea
                    required={field.required}
                    value={values[`${field.id}_followup`] ?? ""}
                    onChange={(e) => setValue(`${field.id}_followup`, e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
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
              className={inputClass}
            >
              <option value="">Select…</option>
              {(field.options ?? "").split(",").map((opt) => (
                <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl border border-gray-200 p-4">
              <input
                type="checkbox"
                required={field.required}
                checked={values[field.id] === "true"}
                onChange={(e) => setValue(field.id, e.target.checked ? "true" : "false")}
                className="accent-arb-blue w-4 h-4 mt-0.5 shrink-0"
                id={`field-${field.id}`}
              />
              <label htmlFor={`field-${field.id}`} className="text-sm text-gray-700">{field.label}</label>
            </div>
          ) : (
            <input
              type={field.type}
              required={field.required}
              value={values[field.id] ?? ""}
              onChange={(e) => setValue(field.id, e.target.value)}
              className={inputClass}
            />
          )}
        </div>
      ))}

      {/* Agreement */}
      <div className="flex items-start gap-3 bg-arb-blue/5 rounded-xl border border-arb-blue/20 p-4">
        <input
          type="checkbox"
          id="agree"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="accent-arb-blue w-4 h-4 mt-0.5 shrink-0"
        />
        <label htmlFor="agree" className="text-sm text-gray-700 leading-relaxed">
          I have read and agree to the above waiver. I understand the risks involved and voluntarily participate.
        </label>
      </div>

      {/* Signature */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelClass}>
            Signature <span className="text-arb-blue">*</span>
          </label>
          <button
            type="button"
            onClick={clearSig}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        </div>
        <div className="rounded-xl border-2 border-gray-300 overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigRef}
            penColor="#1a1a1a"
            canvasProps={{ className: "w-full h-40 touch-none", style: { width: "100%", height: 160 } }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Sign with your finger or mouse above</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl font-bold text-white transition disabled:opacity-50"
        style={{ backgroundColor: "#1E9FD4", fontFamily: "Oswald, sans-serif", letterSpacing: "0.05em", fontSize: "1rem" }}
      >
        {submitting ? "SUBMITTING…" : "SIGN & SUBMIT"}
      </button>

      <p className="text-center text-xs text-gray-400 pb-4">Adventure Rafting Bled · adventure-rafting.com</p>
    </form>
  );
}
