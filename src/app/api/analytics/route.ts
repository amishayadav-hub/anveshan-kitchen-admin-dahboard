import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export interface ClickRow {
  id: string;
  event: string;
  surface: string | null;
  label: string;
  count: number;
  mobile: number;
  desktop: number;
  lastAt: number | null;
}

// Reads the first-party click counters (clicks/*) written by the public site.
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const snap = await getAdminDb().collection("clicks").get();
  const rows: ClickRow[] = snap.docs.map((d) => {
    const v = d.data();
    const ts = v.lastAt;
    return {
      id: d.id,
      event: String(v.event ?? d.id),
      surface: v.surface ?? null,
      label: String(v.label ?? v.event ?? d.id),
      count: Number(v.count ?? 0),
      mobile: Number(v.mobile ?? 0),
      desktop: Number(v.desktop ?? 0),
      lastAt:
        ts && typeof ts.toMillis === "function" ? ts.toMillis() : null,
    };
  });

  rows.sort((a, b) => b.count - a.count);
  return NextResponse.json({ rows });
}
