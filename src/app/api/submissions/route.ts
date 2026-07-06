import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import type { RecipeSubmission } from "@/types";

export const runtime = "nodejs";

// GET → list all community submissions, newest first. The Admin SDK bypasses
// the firestore.rules read lock, so no rules change is needed.
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const snap = await getAdminDb().collection("submissions").get();
  const submissions: RecipeSubmission[] = snap.docs.map((d) => {
    const v = d.data();
    const ts = v.createdAt;
    return {
      id: d.id,
      name: String(v.name ?? ""),
      city: v.city ?? undefined,
      recipeName: String(v.recipeName ?? ""),
      products: Array.isArray(v.products) ? v.products : [],
      story: String(v.story ?? ""),
      status: (v.status ?? "pending") as RecipeSubmission["status"],
      featured: Boolean(v.featured),
      createdAt: ts && typeof ts.toMillis === "function" ? ts.toMillis() : null,
    };
  });

  submissions.sort(
    (a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)
  );
  return NextResponse.json({ submissions });
}
