"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui";
import { Icon } from "@/components/icons";

interface Submission {
  id: string;
  name: string;
  city?: string;
  recipeName: string;
  products: string[];
  story: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  createdAt: number | null;
}

const FILTERS = ["pending", "approved", "rejected", "all"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

export default function SubmissionsPage() {
  const { authedFetch } = useAuth();
  const [items, setItems] = useState<Submission[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authedFetch("/api/submissions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load submissions");
      setItems(data.submissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic patch, then persist.
  async function patch(id: string, body: Partial<Pick<Submission, "status" | "featured">>) {
    setItems((cur) => cur?.map((s) => (s.id === id ? { ...s, ...body } : s)) ?? cur);
    const res = await authedFetch(`/api/submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json()).error || "Update failed");
      load(); // resync on failure
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this submission permanently?")) return;
    setItems((cur) => cur?.filter((s) => s.id !== id) ?? cur);
    await authedFetch(`/api/submissions/${id}`, { method: "DELETE" });
  }

  const counts = {
    pending: items?.filter((s) => s.status === "pending").length ?? 0,
    approved: items?.filter((s) => s.status === "approved").length ?? 0,
    rejected: items?.filter((s) => s.status === "rejected").length ?? 0,
  };
  const visible = (items ?? []).filter((s) => filter === "all" || s.status === filter);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Icon name="submissions" className="h-6 w-6 text-emerald-700" /> Submissions
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Review community recipe submissions.</p>
      </header>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-emerald-700 text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {f}
            {f !== "all" && counts[f] > 0 && <span className="ml-1.5 opacity-70">{counts[f]}</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {loading && <p className="text-sm text-neutral-500">Loading…</p>}

      <div className="space-y-3">
        {visible.map((s) => (
          <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-neutral-900">{s.recipeName}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[s.status]}`}>
                    {s.status}
                  </span>
                  {s.featured && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">★ Featured</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-neutral-400">
                  by {s.name}
                  {s.city ? ` · ${s.city}` : ""}
                  {s.createdAt ? ` · ${new Date(s.createdAt).toLocaleDateString()}` : ""}
                </p>
              </div>
            </div>

            <p className="mt-2 text-sm text-neutral-600 whitespace-pre-wrap">{s.story}</p>

            {s.products.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.products.map((p) => (
                  <span key={p} className="text-xs bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5">
                    {p}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-2">
              {s.status !== "approved" && (
                <Button onClick={() => patch(s.id, { status: "approved" })}>Approve</Button>
              )}
              {s.status !== "rejected" && (
                <Button variant="secondary" onClick={() => patch(s.id, { status: "rejected" })}>
                  Reject
                </Button>
              )}
              <Button variant="secondary" onClick={() => patch(s.id, { featured: !s.featured })}>
                {s.featured ? "Unfeature" : "★ Feature"}
              </Button>
              <Button variant="ghost" onClick={() => del(s.id)} className="text-red-500 hover:text-red-700 ml-auto">
                Delete
              </Button>
            </div>
          </div>
        ))}
        {!loading && visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
            No {filter === "all" ? "" : filter} submissions.
          </div>
        )}
      </div>
    </div>
  );
}
