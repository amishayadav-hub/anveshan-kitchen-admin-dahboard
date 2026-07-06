"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button, Field, Modal, TextArea, TextInput } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { CommunityPost } from "@/types";

type Draft = Partial<CommunityPost> & { id?: string };

const EMPTY: Draft = {
  title: "",
  description: "",
  author: "",
  handle: "",
  date: "",
  images: [],
  tags: [],
  products: [],
  likes: 0,
  saves: 0,
  shares: 0,
};

const toLines = (a?: string[]) => (a ?? []).join("\n");
const fromLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const toCsv = (a?: string[]) => (a ?? []).join(", ");
const fromCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function CommunityPage() {
  const { authedFetch } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
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
      const res = await authedFetch("/api/community");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPosts(data.posts);
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
  function openEdit(p: CommunityPost) {
    setDraft({ ...p });
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
        ? await authedFetch("/api/community", { method: "POST", body: JSON.stringify(draft) })
        : await authedFetch(`/api/community/${encodeURIComponent(draft.id!)}`, {
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

  async function del(p: CommunityPost) {
    if (!confirm(`Delete post "${p.title}"?`)) return;
    const res = await authedFetch(`/api/community/${encodeURIComponent(p.id)}`, { method: "DELETE" });
    if (res.ok) await load();
    else setError((await res.json()).error || "Delete failed");
  }

  // Admin view: filter by search, then sort alphabetically by title (A→Z).
  // This is display-only — the public feed order (the `order` field) is unchanged.
  const visible = (posts ?? [])
    .filter((p) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.author ?? "").toLowerCase().includes(q) ||
        (p.handle ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <header className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Icon name="community" className="h-6 w-6 text-emerald-700" /> Real Peeps
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{posts ? `${posts.length} posts` : "…"}</p>
        </div>
        <Button onClick={openNew}>+ New post</Button>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {error.toLowerCase().includes("not configured") && (
            <p className="mt-1 text-xs">
              Tip: run <code className="font-mono">node scripts/seed-community.mjs</code> after setting the service account to migrate the feed.
            </p>
          )}
        </div>
      )}
      {posts && posts.length > 0 && (
        <div className="mb-5 relative sm:max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </span>
          <TextInput
            placeholder="Search posts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}

      {posts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => (
            <div key={p.id} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden flex flex-col">
              <div className="h-40 bg-neutral-100 overflow-hidden">
                {p.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-neutral-900 leading-tight">{p.title}</h3>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {p.author} {p.handle} · {p.date}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                  <Icon name="heart" className="h-3.5 w-3.5" /> {p.likes ?? 0}
                  <Icon name="bookmark" className="h-3.5 w-3.5 ml-1.5" /> {p.saves ?? 0}
                  <Icon name="share" className="h-3.5 w-3.5 ml-1.5" /> {p.shares ?? 0}
                  <span className="ml-1.5">· {p.images?.length ?? 0} img</span>
                </p>
                <div className="mt-3 pt-3 border-t border-neutral-100 flex gap-2">
                  <Button variant="secondary" onClick={() => openEdit(p)} className="flex-1">
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => del(p)} className="text-red-500 hover:text-red-700">
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-neutral-500 col-span-full py-8 text-center">
              {posts.length === 0 ? "No posts yet." : "No posts match your search."}
            </p>
          )}
        </div>
      )}

      {draft && (
        <Modal
          title={isNew ? "New post" : `Edit ${draft.title}`}
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
          <Field label="Title">
            <TextInput value={draft.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Caption / description">
            <TextArea rows={4} value={draft.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Author">
              <TextInput value={draft.author ?? ""} onChange={(e) => set("author", e.target.value)} />
            </Field>
            <Field label="Handle">
              <TextInput value={draft.handle ?? ""} onChange={(e) => set("handle", e.target.value)} placeholder="@handle" />
            </Field>
          </div>
          <Field label="Date">
            <TextInput value={draft.date ?? ""} onChange={(e) => set("date", e.target.value)} placeholder="Jun 28, 2026" />
          </Field>

          <Field label="Image URLs" hint="One CDN URL per line. Previews below.">
            <TextArea
              rows={3}
              value={toLines(draft.images)}
              onChange={(e) => set("images", fromLines(e.target.value))}
              placeholder="https://cdn.example.com/photo1.jpg"
            />
          </Field>
          {(draft.images ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(draft.images ?? []).map((u, i) => (
                <div key={i} className="h-16 w-16 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <Field label="Product IDs" hint="Comma-separated Anveshan product ids.">
            <TextInput value={toCsv(draft.products)} onChange={(e) => set("products", fromCsv(e.target.value))} />
          </Field>
          <Field label="Tags" hint="Comma-separated.">
            <TextInput value={toCsv(draft.tags)} onChange={(e) => set("tags", fromCsv(e.target.value))} />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Likes">
              <TextInput type="number" value={draft.likes ?? 0} onChange={(e) => set("likes", Number(e.target.value))} />
            </Field>
            <Field label="Saves">
              <TextInput type="number" value={draft.saves ?? 0} onChange={(e) => set("saves", Number(e.target.value))} />
            </Field>
            <Field label="Shares">
              <TextInput type="number" value={draft.shares ?? 0} onChange={(e) => set("shares", Number(e.target.value))} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
