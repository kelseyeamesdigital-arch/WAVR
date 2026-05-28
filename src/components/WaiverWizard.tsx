"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Users, ChevronLeft, Trash2, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  cover_image_url?: string | null;
  trip_time_slots?: string | null;
};

type Step =
  | { type: "welcome" }
  | { type: "trip" }
  | { type: "field"; field: Field }
  | { type: "followup"; field: Field }
  | { type: "terms" }
  | { type: "signature" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSteps(fields: Field[], hasTrip: boolean): Step[] {
  const steps: Step[] = [{ type: "welcome" }];
  if (hasTrip) steps.push({ type: "trip" });
  for (const field of fields) {
    steps.push({ type: "field", field });
    if (field.type === "conditional" && field.followUpLabel) {
      steps.push({ type: "followup", field });
    }
  }
  steps.push({ type: "terms" });
  steps.push({ type: "signature" });
  return steps;
}

function shouldSkip(step: Step, values: Record<string, string>): boolean {
  if (step.type !== "followup") return false;
  return values[step.field.id] !== "Yes";
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatDOB(d: string, m: string, y: string) {
  const mi = parseInt(m) - 1;
  if (!d || !m || !y || y.length < 4 || mi < 0 || mi > 11) return null;
  return `${d} ${MONTHS[mi]} ${y}`;
}

function calcAge(d: string, m: string, y: string): number | null {
  if (!d || !m || !y || y.length < 4) return null;
  const dob = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function isDOBField(field: Field) {
  return field.type === "date" && field.label.toLowerCase().includes("birth");
}

function getGuestName(fields: Field[], values: Record<string, string>) {
  return (
    values["name"] ??
    values[fields.find((f) => f.type === "text" && f.label.toLowerCase().includes("name"))?.id ?? ""] ??
    ""
  );
}

// ─── Background ───────────────────────────────────────────────────────────────

const BG = "linear-gradient(160deg, #062a3f 0%, #0e4a65 45%, #1E9FD4 100%)";

// ─── Shared layout wrappers ───────────────────────────────────────────────────

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      {children}
    </div>
  );
}

function TopBar({
  onBack,
  onDiscard,
  initials,
  inProgress,
}: {
  onBack?: () => void;
  onDiscard: () => void;
  initials?: string;
  inProgress?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 shrink-0">
      {onBack ? (
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      ) : (
        <div className="w-10" />
      )}
      <div className="flex items-center gap-2">
        {inProgress && (
          <span className="text-white/60 text-xs hidden sm:block">Waiver in progress</span>
        )}
        {initials && (
          <span className="bg-black/40 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {initials}
          </span>
        )}
        <button
          onClick={onDiscard}
          title="Discard"
          className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
        >
          <Trash2 size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-4 mb-4 bg-white rounded-3xl shadow-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function NextBtn({
  onClick,
  disabled,
  label = "NEXT",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-40 transition"
      style={{
        backgroundColor: "#1E9FD4",
        fontFamily: "Oswald, sans-serif",
        letterSpacing: "0.06em",
        fontSize: "1.05rem",
      }}
    >
      {label}
    </button>
  );
}

function RadioOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition ${
        selected ? "border-arb-blue bg-arb-blue/5" : "border-gray-200 hover:border-arb-blue/40"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition ${
          selected ? "border-arb-blue bg-arb-blue" : "border-gray-400"
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <span className="text-base font-medium text-gray-900">{label}</span>
    </button>
  );
}

// ─── All Done Screen (auto-returns to welcome) ───────────────────────────────

function AllDoneScreen({ signedGuests, onReset }: { signedGuests: string[]; onReset: () => void }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          onReset();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onReset]);

  return (
    <FullScreen>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <CheckCircle size={56} className="text-arb-teal mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-arb-green mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>
            ALL SIGNED IN!
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            {signedGuests.length === 1
              ? `Thanks ${signedGuests[0]}, you're all set!`
              : `Thanks everyone — all ${signedGuests.length} of you are set!`}
          </p>
          {signedGuests.length > 1 && (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 mb-4 text-left">
              {signedGuests.map((name, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <CheckCircle size={14} className="text-arb-teal shrink-0" />
                  <span className="text-sm text-gray-700">{name}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-gray-400 text-sm">Enjoy your adventure! 🌊</p>

          {/* Countdown ring */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border-4 border-arb-teal/30 flex items-center justify-center">
              <span className="text-lg font-bold text-arb-teal">{countdown}</span>
            </div>
            <p className="text-xs text-gray-400">Returning to check-in…</p>
          </div>

          <button
            onClick={onReset}
            className="mt-4 text-xs text-arb-blue underline"
          >
            Start now
          </button>

          <p className="text-xs text-gray-300 mt-4">Adventure Rafting Bled · adventure-rafting.com</p>
        </div>
      </div>
    </FullScreen>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WaiverWizard({ waiver }: { waiver: Waiver }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const termsRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<Record<string, string>>({});
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));
  const [tripTime, setTripTime] = useState("");
  const [dobD, setDobD] = useState("");
  const [dobM, setDobM] = useState("");
  const [dobY, setDobY] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Group state
  const [signedGuests, setSignedGuests] = useState<string[]>([]);
  const [view, setView] = useState<"wizard" | "success" | "alldone">("wizard");
  const [lastSigned, setLastSigned] = useState("");

  const timeSlots = waiver.trip_time_slots
    ? waiver.trip_time_slots.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const steps = useMemo(
    () => buildSteps(waiver.fields, timeSlots.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [waiver.fields, waiver.trip_time_slots]
  );
  const currentStep = steps[stepIndex];

  const guestName = getGuestName(waiver.fields, values);
  const initials = guestName
    ? guestName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 3)
    : undefined;

  const dobAge = useMemo(() => calcAge(dobD, dobM, dobY), [dobD, dobM, dobY]);
  const ageFieldValue = useMemo(() => {
    const f = waiver.fields.find(
      (f) => f.type === "number" && f.label.toLowerCase().includes("age")
    );
    return f ? parseInt(values[f.id] ?? "") : null;
  }, [values, waiver.fields]);

  const age = dobAge ?? ageFieldValue;
  const isMinor = age !== null && !isNaN(age) && age < 18;

  function sv(id: string, val: string) {
    setValues((v) => ({ ...v, [id]: val }));
  }

  function advance() {
    let next = stepIndex + 1;
    while (next < steps.length && shouldSkip(steps[next], values)) next++;
    setStepIndex(next);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    let prev = stepIndex - 1;
    while (prev > 0 && shouldSkip(steps[prev], values)) prev--;
    setStepIndex(prev);
    setError("");
  }

  // Auto-unlock terms if content doesn't need scrolling
  useEffect(() => {
    if (currentStep.type !== "terms") return;
    const el = termsRef.current;
    if (!el) return;
    // Small timeout to let the DOM render first
    const t = setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 10) {
        setTermsScrolled(true);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [currentStep.type]);

  function handleTermsScroll() {
    const el = termsRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) setTermsScrolled(true);
  }

  function handleNext() {
    setError("");
    const step = currentStep;

    if (step.type === "trip") {
      if (!tripDate) { setError("Please select a trip date."); return; }
      if (timeSlots.length > 0 && !tripTime) { setError("Please select a departure time."); return; }
    }

    if (step.type === "field") {
      const { field } = step;
      if (isDOBField(field)) {
        if (!dobD || !dobM || !dobY || dobY.length < 4) {
          setError("Please enter your full date of birth.");
          return;
        }
        // Store ISO date string
        sv(field.id, `${dobY}-${dobM.padStart(2, "0")}-${dobD.padStart(2, "0")}`);
      } else if (field.type === "conditional") {
        if (field.required && !values[field.id]) {
          setError("Please select an option.");
          return;
        }
      } else if (field.type === "checkbox") {
        // checkboxes optional unless required
      } else {
        if (field.required && !values[field.id]?.trim()) {
          setError("This field is required.");
          return;
        }
      }
    }

    if (step.type === "followup") {
      const { field } = step;
      if (field.required && !values[`${field.id}_followup`]?.trim()) {
        setError("Please describe your condition.");
        return;
      }
    }

    if (step.type === "terms") {
      if (!agreed) {
        setError("Please agree to the terms to continue.");
        return;
      }
    }

    advance();
  }

  async function handleSubmit() {
    setError("");
    if (sigRef.current?.isEmpty()) {
      setError(
        isMinor
          ? "Please provide the parent or guardian's signature."
          : "Please sign to submit."
      );
      return;
    }
    if (isMinor && !guardianName.trim()) {
      setError("Please enter the parent or guardian's full name.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const signatureDataUrl = sigRef.current!.toDataURL("image/png");

    const guestEmail =
      values["email"] ??
      values[waiver.fields.find((f) => f.type === "email")?.id ?? ""] ??
      null;
    const guestCountry =
      values["country"] ??
      values[waiver.fields.find((f) => f.label.toLowerCase().includes("country"))?.id ?? ""] ??
      null;

    const { error } = await supabase.from("submissions").insert({
      waiver_id: waiver.id,
      operator_id: waiver.operator_id,
      guest_name: guestName || "Guest",
      guest_email: guestEmail,
      guest_age: age,
      guest_country: guestCountry,
      trip_date: tripDate || null,
      trip_time: tripTime || null,
      form_data: {
        ...values,
        dob: dobD && dobM && dobY ? `${dobY}-${dobM}-${dobD}` : undefined,
        is_minor: isMinor,
        guardian_name: isMinor ? guardianName : undefined,
      },
      signature_url: signatureDataUrl,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setLastSigned(guestName || "Guest");
      setSignedGuests((p) => [...p, guestName || "Guest"]);
      setView("success");
    }
  }

  function resetWizard() {
    setValues({});
    setTripDate(new Date().toISOString().slice(0, 10));
    setTripTime("");
    setDobD(""); setDobM(""); setDobY("");
    setGuardianName("");
    setAgreed(false);
    setTermsScrolled(false);
    setError("");
    setSubmitting(false);
    sigRef.current?.clear();
    setStepIndex(0);
    setView("wizard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── ALL DONE ──────────────────────────────────────────────────────────────

  if (view === "alldone") {
    return <AllDoneScreen signedGuests={signedGuests} onReset={resetWizard} />;
  }

  // ─── SUCCESS ───────────────────────────────────────────────────────────────

  if (view === "success") {
    return (
      <FullScreen>
        <div className="flex-1 flex flex-col justify-end">
          <Card className="!overflow-visible">
            <div className="p-7">
              <div className="text-center mb-7">
                <CheckCircle size={52} className="text-arb-teal mx-auto mb-3" />
                <h2
                  className="text-2xl font-bold text-arb-green mb-1"
                  style={{ fontFamily: "Oswald, sans-serif" }}
                >
                  SIGNED!
                </h2>
                <p className="text-gray-500 text-sm">
                  <span className="font-semibold text-gray-700">{lastSigned}</span> is all
                  set.{" "}
                  {isMinor && (
                    <span className="text-amber-600">Signed by a guardian.</span>
                  )}
                </p>
              </div>

              {signedGuests.length > 0 && (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Users size={12} /> Signed in so far
                  </p>
                  {signedGuests.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <CheckCircle size={13} className="text-arb-teal shrink-0" />
                      <span className="text-sm text-gray-700">{name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={resetWizard}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "#1E9FD4",
                    fontFamily: "Oswald, sans-serif",
                    letterSpacing: "0.06em",
                    fontSize: "1rem",
                  }}
                >
                  <Users size={17} />
                  ADD ANOTHER PERSON
                </button>
                <button
                  onClick={() => setView("alldone")}
                  className="w-full py-4 rounded-2xl font-bold border-2 border-arb-green text-arb-green flex items-center justify-center gap-2 hover:bg-arb-green hover:text-white transition"
                  style={{
                    fontFamily: "Oswald, sans-serif",
                    letterSpacing: "0.06em",
                    fontSize: "1rem",
                  }}
                >
                  <ChevronRight size={17} />
                  WE&apos;RE ALL DONE
                </button>
              </div>
              <p className="text-center text-xs text-gray-300 mt-5">
                Adventure Rafting Bled · adventure-rafting.com
              </p>
            </div>
          </Card>
        </div>
      </FullScreen>
    );
  }

  // ─── WELCOME ───────────────────────────────────────────────────────────────

  if (currentStep.type === "welcome") {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Hero image */}
        <div className="flex-1 relative min-h-[45vh]">
          {waiver.cover_image_url ? (
            <img
              src={waiver.cover_image_url}
              alt={waiver.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: BG }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />
        </div>

        {/* Card slides up from bottom */}
        <div className="bg-white rounded-t-3xl shadow-2xl px-7 pt-7 pb-10 -mt-6 relative z-10">
          <img
            src="/logo-full.png"
            alt="Adventure Rafting Bled"
            className="h-14 mx-auto mb-5"
          />
          {signedGuests.length > 0 && (
            <p className="text-sm text-arb-blue font-semibold mb-2 text-center">
              Person {signedGuests.length + 1} in your group
            </p>
          )}
          <h1
            className="text-3xl font-bold text-gray-900 mb-2 leading-tight text-center"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            {waiver.title.toUpperCase()}
          </h1>
          <p className="text-gray-500 text-base mb-8 text-center">
            Get ready for your adventure!<br />
            <span className="text-gray-400 text-sm">First, let&apos;s get you checked in.</span>
          </p>
          <NextBtn onClick={advance} label="GET STARTED!" />
          <p className="text-xs text-gray-300 mt-5 text-center">adventure-rafting.com</p>
        </div>
      </div>
    );
  }

  // ─── TRIP DATE / TIME ──────────────────────────────────────────────────────

  if (currentStep.type === "trip") {
    return (
      <FullScreen>
        <TopBar onBack={goBack} onDiscard={resetWizard} />
        <div className="flex-1 flex flex-col justify-end">
          <Card>
            <div className="p-6">
              <p className="text-xs font-bold text-arb-teal tracking-widest uppercase mb-1">Your Trip</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Oswald, sans-serif" }}>
                WHEN IS YOUR TRIP?
              </h2>

              {/* Date picker */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trip date</label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-900 text-base focus:outline-none focus:border-arb-blue"
                />
              </div>

              {/* Time slots */}
              {timeSlots.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Departure time</label>
                  <div className="space-y-2">
                    {timeSlots.map((slot) => (
                      <RadioOption
                        key={slot}
                        label={slot}
                        selected={tripTime === slot}
                        onClick={() => setTripTime(slot)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <NextBtn
                onClick={handleNext}
                disabled={!tripDate || (timeSlots.length > 0 && !tripTime)}
              />
            </div>
          </Card>
        </div>
      </FullScreen>
    );
  }

  // ─── TERMS ─────────────────────────────────────────────────────────────────

  if (currentStep.type === "terms") {
    return (
      <FullScreen>
        <TopBar onBack={goBack} onDiscard={resetWizard} initials={initials} inProgress />
        <div className="flex-1 flex flex-col mx-4 mb-4 min-h-0">
          <div className="bg-white rounded-3xl shadow-2xl flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-6 pb-2 shrink-0">
              <h2
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                Please agree to the following terms and conditions
              </h2>
            </div>

            <div
              ref={termsRef}
              onScroll={handleTermsScroll}
              className="flex-1 overflow-y-auto px-6 py-3 text-sm text-gray-600 leading-relaxed"
              style={{ minHeight: 0 }}
            >
              <p className="font-bold text-gray-800 mb-2">{waiver.title}</p>
              <p className="whitespace-pre-wrap">{waiver.body_text}</p>
              <div className="h-6" />
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-gray-100 shrink-0 space-y-3">
              {!termsScrolled && (
                <p className="text-center text-xs text-gray-400">
                  ↓ Scroll to read all terms before agreeing
                </p>
              )}
              <div className={!termsScrolled ? "opacity-40 pointer-events-none" : ""}>
                <RadioOption
                  label="I agree to the above terms and conditions"
                  selected={agreed}
                  onClick={() => setAgreed(!agreed)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <NextBtn onClick={handleNext} disabled={!agreed} />
            </div>
          </div>
        </div>
      </FullScreen>
    );
  }

  // ─── SIGNATURE ─────────────────────────────────────────────────────────────

  if (currentStep.type === "signature") {
    return (
      <FullScreen>
        <TopBar onBack={goBack} onDiscard={resetWizard} initials={initials} inProgress />
        <div className="flex-1 flex flex-col mx-4 mb-4 min-h-0">
          <div className="bg-white rounded-3xl shadow-2xl flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-6 pb-2 shrink-0">
              <h2
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                Please sign below
              </h2>
              {isMinor && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ This must be signed by the parent or guardian.
                </p>
              )}
            </div>

            {isMinor && (
              <div className="px-6 pb-2 shrink-0 space-y-2">
                <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-amber-800">Under 18 — Guardian required</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    A parent or caregiver must complete this section on behalf of the participant.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Parent / Guardian full name *"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-arb-blue"
                />
              </div>
            )}

            {/* Sig canvas */}
            <div className="flex-1 mx-6 my-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 relative overflow-hidden min-h-[200px]">
              <SignatureCanvas
                ref={sigRef}
                penColor="#1a1a1a"
                canvasProps={{
                  style: { width: "100%", height: "100%", position: "absolute", inset: 0 },
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-gray-200 text-7xl">✍️</span>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 shrink-0 space-y-3">
              <button
                onClick={() => sigRef.current?.clear()}
                className="text-xs text-gray-400 hover:text-gray-600 transition"
              >
                ↺ Clear signature
              </button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <NextBtn
                onClick={handleSubmit}
                disabled={submitting}
                label={submitting ? "SUBMITTING…" : "NEXT"}
              />
            </div>
          </div>
        </div>
      </FullScreen>
    );
  }

  // ─── FIELD STEPS ───────────────────────────────────────────────────────────

  const field =
    currentStep.type === "field" || currentStep.type === "followup"
      ? currentStep.field
      : null;

  if (!field) return null;

  const isFollowup = currentStep.type === "followup";
  const isDOB = isDOBField(field);
  const dobFormatted = formatDOB(dobD, dobM, dobY);
  const dobAgeDisplay = calcAge(dobD, dobM, dobY);

  const questionText = isFollowup
    ? field.followUpLabel ?? "Please provide more details"
    : isDOB
    ? "Please enter your Date of Birth"
    : `Please enter your ${field.label}`;

  return (
    <FullScreen>
      <TopBar onBack={goBack} onDiscard={resetWizard} initials={initials} inProgress />
      <div className="flex-1 flex flex-col justify-start mx-4 mb-4 mt-2">
        <Card>
          <div className="p-6">
            <h2
              className="text-2xl font-bold text-gray-900 mb-6 leading-snug"
              style={{ fontFamily: "Oswald, sans-serif" }}
            >
              {questionText}
            </h2>

            {/* Conditional Yes/No */}
            {field.type === "conditional" && !isFollowup && (
              <div className="space-y-3">
                {["Yes", "No"].map((opt) => (
                  <RadioOption
                    key={opt}
                    label={opt}
                    selected={values[field.id] === opt}
                    onClick={() => sv(field.id, opt)}
                  />
                ))}
              </div>
            )}

            {/* Follow-up textarea */}
            {isFollowup && (
              <textarea
                rows={4}
                value={values[`${field.id}_followup`] ?? ""}
                onChange={(e) => sv(`${field.id}_followup`, e.target.value)}
                placeholder="Please describe..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-arb-blue resize-none text-base"
              />
            )}

            {/* DOB split picker */}
            {isDOB && (
              <div className="space-y-4">
                <div>
                  <div className="grid grid-cols-3 text-center mb-1">
                    <span className="text-xs font-semibold text-gray-500">Day</span>
                    <span className="text-xs font-semibold text-gray-500">Month</span>
                    <span className="text-xs font-semibold text-gray-500">Year</span>
                  </div>
                  <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-arb-blue transition">
                    <input
                      type="number"
                      placeholder="DD"
                      min={1}
                      max={31}
                      value={dobD}
                      onChange={(e) => setDobD(e.target.value)}
                      className="flex-1 text-center py-4 text-2xl font-bold text-gray-900 focus:outline-none bg-transparent"
                    />
                    <span className="text-gray-300 text-xl shrink-0">/</span>
                    <input
                      type="number"
                      placeholder="MM"
                      min={1}
                      max={12}
                      value={dobM}
                      onChange={(e) => setDobM(e.target.value)}
                      className="flex-1 text-center py-4 text-2xl font-bold text-gray-900 focus:outline-none bg-transparent"
                    />
                    <span className="text-gray-300 text-xl shrink-0">/</span>
                    <input
                      type="number"
                      placeholder="YYYY"
                      min={1900}
                      max={new Date().getFullYear()}
                      value={dobY}
                      onChange={(e) => setDobY(e.target.value)}
                      className="flex-[2] text-center py-4 text-2xl font-bold text-gray-900 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                {dobFormatted && (
                  <p className="text-center text-sm text-gray-600">
                    Your entry:{" "}
                    <span className="font-bold text-arb-blue">{dobFormatted}</span>
                    {dobAgeDisplay !== null && (
                      <span className="text-gray-400"> · {dobAgeDisplay} years old</span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Select dropdown as radio list */}
            {field.type === "select" && !isFollowup && (
              <div className="space-y-3">
                {(field.options ?? "").split(",").map((opt) => (
                  <RadioOption
                    key={opt.trim()}
                    label={opt.trim()}
                    selected={values[field.id] === opt.trim()}
                    onClick={() => sv(field.id, opt.trim())}
                  />
                ))}
              </div>
            )}

            {/* Checkbox */}
            {field.type === "checkbox" && !isFollowup && (
              <RadioOption
                label={field.label}
                selected={values[field.id] === "true"}
                onClick={() => sv(field.id, values[field.id] === "true" ? "false" : "true")}
              />
            )}

            {/* Standard text/email/number input */}
            {!isDOB &&
              !isFollowup &&
              field.type !== "conditional" &&
              field.type !== "select" &&
              field.type !== "checkbox" && (
                <input
                  type={field.type === "date" ? "text" : field.type}
                  value={values[field.id] ?? ""}
                  onChange={(e) => sv(field.id, e.target.value)}
                  placeholder={
                    field.type === "email"
                      ? "your@email.com"
                      : field.type === "number"
                      ? "0"
                      : ""
                  }
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 text-xl text-gray-900 focus:outline-none focus:border-arb-blue transition"
                />
              )}

            {/* Under-18 notice on DOB/age */}
            {isMinor &&
              (isDOB || field.label.toLowerCase().includes("age")) && (
                <div className="mt-4 bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3">
                  <p className="text-sm font-bold text-amber-800">⚠️ Under 18 detected</p>
                  <p className="text-xs text-amber-700 mt-1">
                    A parent or guardian will need to sign this waiver on behalf of this
                    participant.
                  </p>
                </div>
              )}

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <div className="mt-6">
              <NextBtn onClick={handleNext} />
            </div>
          </div>
        </Card>
      </div>
    </FullScreen>
  );
}
