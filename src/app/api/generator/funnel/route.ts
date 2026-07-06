import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface EventDoc {
  id: string;
  type: "generate" | "variation_click";
  uid: string;
  sessionId: string | null;
  ts: number | null;
  query?: string;
  ingredients?: string[];
  language?: string;
  variationsReturned?: string[];
  generateEventId?: string | null;
  variationIndex?: number;
  variationName?: string;
  products?: string[];
  subtotal?: number;
  action?: string;
}

function tally(entries: string[], limit = 15): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const e of entries) {
    const k = (e || "").trim();
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const snap = await getAdminDb()
    .collection("generatorEvents")
    .orderBy("ts", "desc")
    .limit(2000)
    .get();

  const events: EventDoc[] = snap.docs.map((d) => {
    const v = d.data();
    const ts = v.ts;
    return {
      id: d.id,
      type: v.type,
      uid: String(v.uid ?? "anon"),
      sessionId: v.sessionId ?? null,
      ts: ts && typeof ts.toMillis === "function" ? ts.toMillis() : null,
      query: v.query,
      ingredients: v.ingredients,
      language: v.language,
      variationsReturned: v.variationsReturned,
      generateEventId: v.generateEventId ?? null,
      variationIndex: v.variationIndex,
      variationName: v.variationName,
      products: v.products,
      subtotal: v.subtotal,
      action: v.action,
    };
  });

  const generates = events.filter((e) => e.type === "generate");
  const clicks = events.filter((e) => e.type === "variation_click");

  // keyword → click conversion: generate events that produced ≥1 variation click.
  const clickedGenIds = new Set(clicks.map((c) => c.generateEventId).filter(Boolean));
  const converted = generates.filter((g) => clickedGenIds.has(g.id)).length;

  const totals = {
    generates: generates.length,
    variationClicks: clicks.length,
    uniqueUsers: new Set(events.map((e) => e.uid)).size,
    conversionRate: generates.length ? Math.round((converted / generates.length) * 100) : 0,
  };

  const topKeywords = tally(generates.map((g) => g.query ?? ""));
  const topVariations = tally(clicks.map((c) => c.variationName ?? ""));
  const topProducts = tally(clicks.flatMap((c) => c.products ?? []));

  // Recent per-user journeys: latest generate events with their linked clicks.
  const clicksByGen = new Map<string, EventDoc[]>();
  for (const c of clicks) {
    if (!c.generateEventId) continue;
    const arr = clicksByGen.get(c.generateEventId) ?? [];
    arr.push(c);
    clicksByGen.set(c.generateEventId, arr);
  }
  const journeys = generates.slice(0, 60).map((g) => ({
    id: g.id,
    uid: g.uid,
    sessionId: g.sessionId,
    ts: g.ts,
    query: g.query || "(ingredients only)",
    ingredients: g.ingredients ?? [],
    language: g.language ?? "en",
    variationsReturned: g.variationsReturned ?? [],
    clicks: (clicksByGen.get(g.id) ?? []).map((c) => ({
      variationName: c.variationName,
      variationIndex: c.variationIndex,
      action: c.action,
      products: c.products ?? [],
      subtotal: c.subtotal ?? 0,
    })),
  }));

  return NextResponse.json({ totals, topKeywords, topVariations, topProducts, journeys });
}
