import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export interface CampaignRow {
  id: string;
  source: string;
  medium: string;
  campaign: string;
  visits: number;
  conversions: number;
  lastAt: number | null;
}

// Reads first-party campaign attribution (campaigns/*) written by the public site.
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    const snap = await getAdminDb().collection("campaigns").get();
    const rows: CampaignRow[] = snap.docs.map((d) => {
      const v = d.data();
      const ts = v.lastAt;
      return {
        id: d.id,
        source: String(v.source ?? ""),
        medium: String(v.medium ?? ""),
        campaign: String(v.campaign ?? ""),
        visits: Number(v.visits ?? 0),
        conversions: Number(v.conversions ?? 0),
        lastAt: ts && typeof ts.toMillis === "function" ? ts.toMillis() : null,
      };
    });
    rows.sort((a, b) => b.visits - a.visits);
    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? `${e.name}: ${e.message}` : "Failed to read campaigns" },
      { status: 500 }
    );
  }
}
