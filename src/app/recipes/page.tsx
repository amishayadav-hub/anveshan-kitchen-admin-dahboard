"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button, Field, ImageUrlField, Modal, Select, TextArea, TextInput } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { Recipe, Ingredient } from "@/types";

type Draft = Partial<Recipe> & { id: string };

const EMPTY: Draft = {
  id: "",
  slug: "",
  name: "",
  description: "",
  image: "",
  category: "",
  prepTime: "",
  cookTime: "",
  servings: 4,
  isVeg: true,
  ingredients: [],
  steps: [],
  anveshanProducts: [],
  tags: [],
  intro: "",
  faqs: [],
  tips: [],
};

// ── array helpers ────────────────────────────────────────────────────────────
const toLines = (a?: string[]) => (a ?? []).join("\n");
const fromLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const toCsv = (a?: string[]) => (a ?? []).join(", ");
const fromCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function IngredientEditor({
  items,
  onChange,
}: {
  items: Ingredient[];
  onChange: (next: Ingredient[]) => void;
}) {
  function update(i: number, patch: Partial<Ingredient>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-2 space-y-2">
          <div className="grid grid-cols-[1fr_70px_70px_auto] gap-2 items-center">
            <TextInput placeholder="Ingredient" value={it.name} onChange={(e) => update(i, { name: e.target.value })} />
            <TextInput placeholder="Qty" value={it.quantity} onChange={(e) => update(i, { quantity: e.target.value })} />
            <TextInput placeholder="Unit" value={it.unit} onChange={(e) => update(i, { unit: e.target.value })} />
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-red-400 hover:text-red-600 px-2"
              aria-label="Remove ingredient"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={!!it.anveshan}
                onChange={(e) => update(i, { anveshan: e.target.checked })}
              />
              Anveshan product
            </label>
            {it.anveshan && (
              <TextInput
                placeholder="anveshanProductId (e.g. ghee)"
                value={it.anveshanProductId ?? ""}
                onChange={(e) => update(i, { anveshanProductId: e.target.value })}
                className="flex-1"
              />
            )}
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() => onChange([...items, { name: "", quantity: "", unit: "" }])}
      >
        + Add ingredient
      </Button>
    </div>
  );
}

function FaqEditor({
  items,
  onChange,
}: {
  items: { question: string; answer: string }[];
  onChange: (next: { question: string; answer: string }[]) => void;
}) {
  function update(i: number, patch: Partial<{ question: string; answer: string }>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-2 space-y-2">
          <div className="flex gap-2">
            <TextInput placeholder="Question" value={it.question} onChange={(e) => update(i, { question: e.target.value })} />
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 px-2">
              ×
            </button>
          </div>
          <TextArea rows={2} placeholder="Answer" value={it.answer} onChange={(e) => update(i, { answer: e.target.value })} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...items, { question: "", answer: "" }])}>
        + Add FAQ
      </Button>
    </div>
  );
}

export default function RecipesPage() {
  const { authedFetch } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rRes, pRes] = await Promise.all([
        authedFetch("/api/recipes"),
        authedFetch("/api/products"),
      ]);
      const rData = await rRes.json();
      if (!rRes.ok) throw new Error(rData.error || "Failed to load recipes");
      setRecipes(rData.recipes);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProductIds((pData.products ?? []).map((p: { id: string }) => p.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setDraft({ ...EMPTY });
    setIsNew(true);
    setFormError("");
  }
  function openEdit(r: Recipe) {
    setDraft({ ...EMPTY, ...r });
    setIsNew(false);
    setFormError("");
  }

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setFormError("");
    try {
      const res = isNew
        ? await authedFetch("/api/recipes", { method: "POST", body: JSON.stringify(draft) })
        : await authedFetch(`/api/recipes/${encodeURIComponent(draft.id)}`, {
            method: "PUT",
            body: JSON.stringify(draft),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setDraft(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(r: Recipe) {
    if (!confirm(`Delete recipe "${r.name}"?`)) return;
    const res = await authedFetch(`/api/recipes/${encodeURIComponent(r.id)}`, { method: "DELETE" });
    if (res.ok) await load();
    else setError((await res.json()).error || "Delete failed");
  }

  const filtered = (recipes ?? []).filter(
    (r) => !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.slug.includes(query)
  );

  return (
    <div>
      <header className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Icon name="recipes" className="h-6 w-6 text-emerald-700" /> Recipes
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{recipes ? `${recipes.length} recipes` : "…"}</p>
        </div>
        <Button onClick={openNew}>+ New recipe</Button>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <TextInput
        placeholder="Search recipes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 max-w-xs"
      />

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}

      {recipes && (
        <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3">
              <div className="h-12 w-12 rounded-lg bg-neutral-50 overflow-hidden shrink-0">
                {r.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900 truncate">{r.name}</p>
                <p className="text-xs text-neutral-400 truncate">
                  {r.category} · /{r.slug} {r.isVeg === false ? "· non-veg" : ""}
                </p>
              </div>
              <Button variant="secondary" onClick={() => openEdit(r)}>
                Edit
              </Button>
              <Button variant="ghost" onClick={() => del(r)} className="text-red-500 hover:text-red-700">
                Delete
              </Button>
            </div>
          ))}
          {filtered.length === 0 && <p className="p-4 text-sm text-neutral-500">No recipes match.</p>}
        </div>
      )}

      {draft && (
        <Modal
          title={isNew ? "New recipe" : `Edit ${draft.name}`}
          onClose={() => setDraft(null)}
          footer={
            <>
              {formError && <span className="text-sm text-red-600 mr-auto self-center">{formError}</span>}
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Recipe ID" hint={isNew ? "Fixed after create." : "Fixed."}>
              <TextInput value={draft.id} disabled={!isNew} onChange={(e) => set("id", e.target.value.trim())} />
            </Field>
            <Field label="Slug" hint="URL: /recipes/<slug>">
              <TextInput value={draft.slug ?? ""} onChange={(e) => set("slug", e.target.value.trim())} />
            </Field>
          </div>
          <Field label="Name">
            <TextInput value={draft.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Description">
            <TextArea rows={2} value={draft.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <ImageUrlField value={draft.image ?? ""} onChange={(v) => set("image", v)} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <TextInput value={draft.category ?? ""} onChange={(e) => set("category", e.target.value)} />
            </Field>
            <Field label="Sub-category (optional)">
              <TextInput value={draft.subCategory ?? ""} onChange={(e) => set("subCategory", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Prep time">
              <TextInput value={draft.prepTime ?? ""} onChange={(e) => set("prepTime", e.target.value)} placeholder="15 mins" />
            </Field>
            <Field label="Cook time">
              <TextInput value={draft.cookTime ?? ""} onChange={(e) => set("cookTime", e.target.value)} placeholder="30 mins" />
            </Field>
            <Field label="Servings">
              <TextInput type="number" value={draft.servings ?? 0} onChange={(e) => set("servings", Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Veg?">
            <Select value={draft.isVeg === false ? "no" : "yes"} onChange={(e) => set("isVeg", e.target.value === "yes")}>
              <option value="yes">Vegetarian</option>
              <option value="no">Non-veg</option>
            </Select>
          </Field>

          <Field label="Ingredients">
            <IngredientEditor items={draft.ingredients ?? []} onChange={(v) => set("ingredients", v)} />
          </Field>

          <Field label="Steps" hint="One step per line.">
            <TextArea rows={6} value={toLines(draft.steps)} onChange={(e) => set("steps", fromLines(e.target.value))} />
          </Field>

          <Field label="Anveshan product IDs" hint={`Comma-separated. Available: ${productIds.join(", ") || "—"}`}>
            <TextInput value={toCsv(draft.anveshanProducts)} onChange={(e) => set("anveshanProducts", fromCsv(e.target.value))} />
          </Field>

          <Field label="Tags" hint="Comma-separated.">
            <TextInput value={toCsv(draft.tags)} onChange={(e) => set("tags", fromCsv(e.target.value))} />
          </Field>

          <Field label="Intro (SEO)">
            <TextArea rows={3} value={draft.intro ?? ""} onChange={(e) => set("intro", e.target.value)} />
          </Field>

          <Field label="FAQs">
            <FaqEditor items={draft.faqs ?? []} onChange={(v) => set("faqs", v)} />
          </Field>

          <Field label="Tips" hint="One tip per line.">
            <TextArea rows={3} value={toLines(draft.tips)} onChange={(e) => set("tips", fromLines(e.target.value))} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
