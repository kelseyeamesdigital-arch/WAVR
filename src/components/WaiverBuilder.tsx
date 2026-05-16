"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FieldType = "text" | "email" | "number" | "select" | "checkbox" | "date" | "conditional";

type Field = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string; // comma-separated for select
  followUpLabel?: string; // shown when conditional answer is Yes
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "conditional", label: "Yes/No (conditional)" },
];

const DEFAULT_FIELDS: Field[] = [
  { id: "name", label: "Full name", type: "text", required: true },
  { id: "email", label: "Email address", type: "email", required: true },
  { id: "age", label: "Age", type: "number", required: true },
  { id: "country", label: "Country", type: "text", required: true },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function WaiverBuilder() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState(
    "I understand that participating in this activity involves risk of injury or death. I voluntarily assume all risks and waive any claims against the operator."
  );
  const [fields, setFields] = useState<Field[]>(DEFAULT_FIELDS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addField() {
    setFields((f) => [...f, { id: uid(), label: "New field", type: "text", required: false }]);
  }

  function removeField(id: string) {
    setFields((f) => f.filter((field) => field.id !== id));
  }

  function updateField(id: string, patch: Partial<Field>) {
    setFields((f) => f.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Please enter a waiver title.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("waivers").insert({
      operator_id: user!.id,
      title: title.trim(),
      body_text: bodyText,
      fields: fields,
      is_active: true,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      router.push("/dashboard/waivers");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Waiver title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bungy Jump Liability Waiver"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Waiver text / liability statement</label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent resize-none text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">Guest fields</h2>
          <button
            onClick={addField}
            className="flex items-center gap-1.5 text-xs text-arb-blue-light hover:text-arb-teal transition"
          >
            <Plus size={14} />
            Add field
          </button>
        </div>

        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 flex items-start gap-3"
            >
              <GripVertical size={16} className="text-zinc-600 mt-2 shrink-0" />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Label</label>
                  <input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {field.type === "select" && (
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-500 mb-1">Options (comma-separated)</label>
                    <input
                      value={field.options ?? ""}
                      onChange={(e) => updateField(field.id, { options: e.target.value })}
                      placeholder="Option A, Option B, Option C"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent"
                    />
                  </div>
                )}
                {field.type === "conditional" && (
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-500 mb-1">Follow-up question (shown if Yes)</label>
                    <input
                      value={field.followUpLabel ?? ""}
                      onChange={(e) => updateField(field.id, { followUpLabel: e.target.value })}
                      placeholder="e.g. Please describe your medical condition"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="accent-arb-blue"
                    id={`req-${field.id}`}
                  />
                  <label htmlFor={`req-${field.id}`} className="text-xs text-zinc-400">Required</label>
                </div>
              </div>
              <button
                onClick={() => removeField(field.id)}
                className="text-zinc-600 hover:text-red-400 transition mt-1 shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-arb-blue hover:bg-arb-blue-light text-white font-semibold transition disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save waiver"}
      </button>
    </div>
  );
}
