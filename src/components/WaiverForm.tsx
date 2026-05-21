"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Users, ChevronRight } from "lucide-react";

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

const inputClass =
  "w-full px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent text-sm";
const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

function getAge(fields: Field[], values: Record<string, string>): number | null {
  const ageField = fields.find(
    (f) => f.type === "number" && f.label.toLowerCase().includes("age")
  );
  if (!ageField) return null;
  const val = values[ageField.id] ?? values["age"];
  return val ? parseInt(val) : null;
}

function getGuestName(fields: Field[], values: Record<string, string>): string {
  return (
    values["name"] ??
    values[
      fields.find(
        (f) => f.type === "text" && f.label.toLowerCase().includes("name")
      )?.id ?? ""
    ] ??
    "Guest"
  );
}

export default function WaiverForm({ waiver }: { waiver: Waiver }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const guardianSigRef = useRef<SignatureCanvas>(null);

  const [values, setValues] = useState<Record<string, string>>({});
  const [guardianName, setGuardianName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Group tracking
  const [signedGuests, setSignedGuests] = useState<string[]>([]);
  const [view, setView] = useState<"form" | "success" | "alldone">("form");
  const [lastSigned, setLastSigned] = useState("");

  const age = getAge(waiver.fields, values);
  const isMinor = age !== null && age < 18;

  function setValue(id: string, value: string) {
    setValues((v) => ({ ...v, [id]: value }));
  }

  function resetForm() {
    setValues({});
    setGuardianName("");
    setAgreed(false);
    setError("");
    sigRef.current?.clear();
    guardianSigRef.current?.clear();
    setView("form");
    // scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Please agree to the waiver terms.");
      return;
    }
    if (sigRef.current?.isEmpty()) {
      setError(isMinor ? "Please provide the parent/guardian signature." : "Please provide your signature.");
      return;
    }
    if (isMinor && !guardianName.trim()) {
      setError("Please enter the parent or guardian's full name.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const signatureDataUrl = sigRef.current!.toDataURL("image/png");
    const guardianSigDataUrl = isMinor && !guardianSigRef.current?.isEmpty()
      ? guardianSigRef.current!.toDataURL("image/png")
      : null;

    const guestName = getGuestName(waiver.fields, values);
    const guestEmail =
      values["email"] ??
      values[waiver.fields.find((f) => f.type === "email")?.id ?? ""] ??
      null;
    const guestAge = age;
    const guestCountry =
      values["country"] ??
      values[
        waiver.fields.find((f) => f.label.toLowerCase().includes("country"))
          ?.id ?? ""
      ] ??
      null;

    const { error } = await supabase.from("submissions").insert({
      waiver_id: waiver.id,
      operator_id: waiver.operator_id,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_age: guestAge,
      guest_country: guestCountry,
      form_data: {
        ...values,
        is_minor: isMinor,
        guardian_name: isMinor ? guardianName : undefined,
        guardian_signature: guardianSigDataUrl ?? undefined,
      },
      signature_url: signatureDataUrl,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setLastSigned(guestName);
      setSignedGuests((prev) => [...prev, guestName]);
      setView("success");
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ─── ALL DONE SCREEN ────────────────────────────────────────────
  if (view === "alldone") {
    return (
      <div className="text-center py-12">
        <CheckCircle size={56} className="text-arb-teal mx-auto mb-4" />
        <h2
          className="text-2xl font-bold text-arb-green mb-2"
          style={{ fontFamily: "Oswald, sans-serif" }}
        >
          ALL SIGNED IN!
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {signedGuests.length === 1
            ? `${signedGuests[0]} is ready to go.`
            : `${signedGuests.length} people are ready to go.`}
        </p>
        {signedGuests.length > 1 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Users size={12} /> Group signed in
            </p>
            {signedGuests.map((name, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <CheckCircle size={14} className="text-arb-teal shrink-0" />
                <span className="text-sm text-gray-700">{name}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-gray-400 text-sm font-medium">
          Please hand the device back to your guide.
        </p>
        <p className="text-center text-xs text-gray-300 mt-6">
          Adventure Rafting Bled · adventure-rafting.com
        </p>
      </div>
    );
  }

  // ─── SUCCESS / ADD ANOTHER SCREEN ───────────────────────────────
  if (view === "success") {
    return (
      <div className="py-8">
        <div className="text-center mb-8">
          <CheckCircle size={52} className="text-arb-teal mx-auto mb-3" />
          <h2
            className="text-2xl font-bold text-arb-green mb-1"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            SIGNED!
          </h2>
          <p className="text-gray-500 text-sm">
            <span className="font-semibold text-gray-700">{lastSigned}</span>{" "}
            {isMinor ? "has been signed in by a guardian." : "is all set."}
          </p>
        </div>

        {/* Running group list */}
        {signedGuests.length > 0 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Users size={12} /> Signed in so far
            </p>
            {signedGuests.map((name, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <CheckCircle size={14} className="text-arb-teal shrink-0" />
                <span className="text-sm text-gray-700">{name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={resetForm}
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition"
            style={{
              backgroundColor: "#1E9FD4",
              fontFamily: "Oswald, sans-serif",
              letterSpacing: "0.05em",
              fontSize: "1rem",
            }}
          >
            <Users size={18} />
            ADD ANOTHER PERSON
          </button>
          <button
            onClick={() => setView("alldone")}
            className="w-full py-3.5 rounded-xl font-bold border-2 border-arb-green text-arb-green flex items-center justify-center gap-2 transition hover:bg-arb-green hover:text-white"
            style={{
              fontFamily: "Oswald, sans-serif",
              letterSpacing: "0.05em",
              fontSize: "1rem",
            }}
          >
            <ChevronRight size={18} />
            WE&apos;RE ALL DONE
          </button>
        </div>
        <p className="text-center text-xs text-gray-300 mt-6">
          Adventure Rafting Bled · adventure-rafting.com
        </p>
      </div>
    );
  }

  // ─── MAIN FORM ───────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Person counter */}
      {signedGuests.length > 0 && (
        <div className="flex items-center gap-2 bg-arb-teal/10 border border-arb-teal/30 rounded-xl px-4 py-3">
          <Users size={16} className="text-arb-teal shrink-0" />
          <p className="text-sm text-arb-green font-medium">
            Person {signedGuests.length + 1} in your group
          </p>
        </div>
      )}

      {/* Waiver text */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {waiver.body_text}
        </p>
      </div>

      {/* Dynamic fields */}
      {waiver.fields.map((field) => (
        <div key={field.id}>
          {field.type !== "checkbox" && (
            <label className={labelClass}>
              {field.label}
              {field.required && (
                <span className="text-arb-blue ml-1">*</span>
              )}
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
                    {field.required && (
                      <span className="text-arb-blue ml-1">*</span>
                    )}
                  </label>
                  <textarea
                    required={field.required}
                    value={values[`${field.id}_followup`] ?? ""}
                    onChange={(e) =>
                      setValue(`${field.id}_followup`, e.target.value)
                    }
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
                <option key={opt.trim()} value={opt.trim()}>
                  {opt.trim()}
                </option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <div className="flex items-start gap-3 bg-gray-50 rounded-xl border border-gray-200 p-4">
              <input
                type="checkbox"
                required={field.required}
                checked={values[field.id] === "true"}
                onChange={(e) =>
                  setValue(field.id, e.target.checked ? "true" : "false")
                }
                className="accent-arb-blue w-4 h-4 mt-0.5 shrink-0"
                id={`field-${field.id}`}
              />
              <label
                htmlFor={`field-${field.id}`}
                className="text-sm text-gray-700"
              >
                {field.label}
              </label>
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

      {/* ── MINOR NOTICE ── */}
      {isMinor && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Under 18 — Parent or Guardian Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                As this person is under 18, a parent or caregiver must complete and sign this waiver on their behalf.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-1">
              Parent / Guardian full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="Full name of parent or guardian"
              className="w-full px-4 py-2.5 rounded-lg bg-white border border-amber-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
            />
          </div>
        </div>
      )}

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
          {isMinor
            ? `I am the parent/guardian of ${getGuestName(waiver.fields, values) || "this person"} and consent to their participation. I agree to the waiver terms on their behalf.`
            : "I have read and agree to the above waiver. I understand the risks involved and voluntarily participate."}
        </label>
      </div>

      {/* Signature */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelClass}>
            {isMinor ? "Parent / Guardian Signature" : "Your Signature"}{" "}
            <span className="text-arb-blue">*</span>
          </label>
          <button
            type="button"
            onClick={() => sigRef.current?.clear()}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition"
          >
            ↺ Clear
          </button>
        </div>
        {isMinor && (
          <p className="text-xs text-amber-600 mb-2">
            This must be signed by the parent or guardian, not the participant.
          </p>
        )}
        <div className="rounded-xl border-2 border-gray-300 overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigRef}
            penColor="#1a1a1a"
            canvasProps={{
              className: "w-full h-40 touch-none",
              style: { width: "100%", height: 160 },
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {isMinor
            ? "Parent or guardian signs above"
            : "Sign with your finger or mouse above"}
        </p>
      </div>

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl font-bold text-white transition disabled:opacity-50"
        style={{
          backgroundColor: "#1E9FD4",
          fontFamily: "Oswald, sans-serif",
          letterSpacing: "0.05em",
          fontSize: "1rem",
        }}
      >
        {submitting ? "SUBMITTING…" : "SIGN & SUBMIT"}
      </button>

      <p className="text-center text-xs text-gray-400 pb-4">
        Adventure Rafting Bled · adventure-rafting.com
      </p>
    </form>
  );
}
