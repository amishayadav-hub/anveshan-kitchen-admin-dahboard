import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface GeneratorSettings {
  enabled: boolean;
  rateLimitPerMin: number;
  groundingThreshold: number;
}

const DEFAULTS: GeneratorSettings = {
  enabled: true,
  rateLimitPerMin: 15,
  groundingThreshold: 0.5,
};

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const snap = await getAdminDb().collection("settings").doc("generator").get();
  const settings = snap.exists ? { ...DEFAULTS, ...snap.data() } : DEFAULTS;
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const b = await req.json().catch(() => ({}));
  const patch: Partial<GeneratorSettings> = {};
  if ("enabled" in b) patch.enabled = Boolean(b.enabled);
  if ("rateLimitPerMin" in b) patch.rateLimitPerMin = Math.max(1, Math.min(1000, Number(b.rateLimitPerMin) || 15));
  if ("groundingThreshold" in b)
    patch.groundingThreshold = Math.max(0, Math.min(1, Number(b.groundingThreshold)));

  await getAdminDb().collection("settings").doc("generator").set(patch, { merge: true });
  return NextResponse.json({ settings: { ...DEFAULTS, ...patch } });
}
