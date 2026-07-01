"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  { id: "age", label: "Age", type: "number", required: true },
  { id: "email", label: "Email address", type: "email", required: true },
  { id: "country", label: "Country", type: "text", required: true },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function SortableField({
  field,
  updateField,
  removeField,
}: {
  field: Field;
  updateField: (id: string, patch: Partial<Field>) => void;
  removeField: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 flex items-start gap-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-zinc-500 hover:text-zinc-300 mt-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Label</label>
          <input
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Type</label>
          <select
            value={field.type}
            onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent"
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
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent"
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
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => updateField(field.id, { required: e.target.checked })}
            className="accent-wavr-blue"
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
  );
}

type InitialData = {
  id: string;
  title: string;
  body_text: string;
  fields: Field[];
  slug?: string | null;
  cover_image_url?: string | null;
  trip_time_slots?: string | null;
};

function toSlug(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function WaiverBuilder({ initial }: { initial?: InitialData }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initial?.slug);
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.cover_image_url ?? "");
  const [tripTimeSlots, setTripTimeSlots] = useState(initial?.trip_time_slots ?? "8:00 AM,1:00 PM");
  const [bodyText, setBodyText] = useState(
    initial?.body_text ??
    "I understand that participating in this activity involves risk of injury or death. I voluntarily assume all risks and waive any claims against the operator."
  );
  const [fields, setFields] = useState<Field[]>(initial?.fields ?? DEFAULT_FIELDS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((f) => f.id === active.id);
        const newIndex = items.findIndex((f) => f.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugEdited) setSlug(toSlug(val));
  }

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

    let err;
    if (initial?.id) {
      ({ error: err } = await supabase
        .from("waivers")
        .update({ title: title.trim(), slug: slug || null, cover_image_url: coverImageUrl || null, trip_time_slots: tripTimeSlots || null, body_text: bodyText, fields })
        .eq("id", initial.id)
        .eq("operator_id", user!.id));
    } else {
      ({ error: err } = await supabase.from("waivers").insert({
        operator_id: user!.id,
        title: title.trim(),
        slug: slug || null,
        cover_image_url: coverImageUrl || null,
        trip_time_slots: tripTimeSlots || null,
        body_text: bodyText,
        fields,
        is_active: true,
      }));
    }

    if (err) {
      setError(err.message);
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
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Bled Canyoning Waiver"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            URL slug <span className="text-zinc-500 font-normal">(used in the sign link)</span>
          </label>
          <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-700 overflow-hidden focus-within:ring-2 focus-within:ring-wavr-blue">
            <span className="px-3 py-2.5 text-zinc-500 text-sm border-r border-zinc-700 select-none whitespace-nowrap">/sign/</span>
            <input
              value={slug}
              onChange={(e) => { setSlug(toSlug(e.target.value)); setSlugEdited(true); }}
              placeholder="bled-canyoning"
              className="flex-1 px-3 py-2.5 bg-transparent text-white text-sm placeholder-zinc-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Cover photo URL <span className="text-zinc-500 font-normal">(shown on the welcome screen)</span>
          </label>
          <input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://example.com/your-activity-photo.jpg"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent text-sm"
          />
          {coverImageUrl && (
            <img src={coverImageUrl} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-lg opacity-80" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Departure time slots <span className="text-zinc-500 font-normal">(comma-separated — leave blank to skip trip date step)</span>
          </label>
          <input
            value={tripTimeSlots}
            onChange={(e) => setTripTimeSlots(e.target.value)}
            placeholder="8:00 AM,1:00 PM"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent text-sm"
          />
          {tripTimeSlots && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {tripTimeSlots.split(",").filter(Boolean).map((s) => (
                <span key={s} className="text-xs bg-wavr-blue/20 text-wavr-blue-light px-2 py-1 rounded-full">{s.trim()}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Waiver text / liability statement</label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-wavr-blue focus:border-transparent resize-none text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">Guest fields</h2>
          <button
            onClick={addField}
            className="flex items-center gap-1.5 text-xs text-wavr-blue-light hover:text-wavr-teal transition"
          >
            <Plus size={14} />
            Add field
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  updateField={updateField}
                  removeField={removeField}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-wavr-blue hover:bg-wavr-blue-light text-white font-semibold transition disabled:opacity-50"
      >
        {saving ? "Saving…" : initial?.id ? "Save changes" : "Save waiver"}
      </button>
    </div>
  );
}
