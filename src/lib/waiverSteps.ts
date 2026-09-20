// Step sequence for the guest sign wizard. Kept separate from the component so the
// skipping rules (which decide what a returning guest is and isn't asked) are testable.

export type WizardField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string;
  followUpLabel?: string;
};

export type Step =
  | { type: "welcome" }
  | { type: "trip" }
  | { type: "returning" }
  | { type: "field"; field: WizardField }
  | { type: "followup"; field: WizardField }
  | { type: "terms" }
  | { type: "signature" };

/** The field holding the guest's name — the one question returning guests still answer. */
export function findNameField(fields: WizardField[]): WizardField | undefined {
  return (
    fields.find((f) => f.id === "name") ??
    fields.find(
      (f) =>
        f.type === "text" &&
        f.label.toLowerCase().includes("name") &&
        !/emergency|contact|guardian|parent/.test(f.label.toLowerCase())
    )
  );
}

export function buildSteps(
  fields: WizardField[],
  hasTrip: boolean,
  returningEnabled = false
): Step[] {
  const steps: Step[] = [{ type: "welcome" }];
  if (hasTrip) steps.push({ type: "trip" });
  // Ask "been here before?" straight after their name, so returning guests can
  // skip the rest of the questions.
  const nameField = returningEnabled ? findNameField(fields) : undefined;
  for (const field of fields) {
    steps.push({ type: "field", field });
    if (nameField && field.id === nameField.id) steps.push({ type: "returning" });
    if (field.type === "conditional" && field.followUpLabel) {
      steps.push({ type: "followup", field });
    }
  }
  steps.push({ type: "terms" });
  steps.push({ type: "signature" });
  return steps;
}

export type SkipContext = {
  values: Record<string, string>;
  isMinor: boolean;
  isReturning: boolean;
  /** "yes" when a returning guest says their medical details changed */
  medicalChanged: "" | "no" | "yes";
  nameFieldId?: string;
};

export function isStepSkipped(step: Step, ctx: SkipContext): boolean {
  // Follow-up questions only apply when the guest answered "Yes"
  if (step.type === "followup" && ctx.values[step.field.id] !== "Yes") return true;
  // Under-18s don't give an email address
  if (step.type === "field" && step.field.type === "email" && ctx.isMinor) return true;

  // Returning guest: they've already given these details, so only their name and
  // (if anything changed) the medical questions are asked again.
  if (ctx.isReturning && step.type === "field") {
    if (ctx.nameFieldId && step.field.id === ctx.nameFieldId) return false;
    if (step.field.type === "conditional") return ctx.medicalChanged !== "yes";
    return true;
  }
  if (ctx.isReturning && step.type === "followup" && ctx.medicalChanged !== "yes") return true;

  return false;
}
