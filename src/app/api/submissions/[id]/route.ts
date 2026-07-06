import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const STATUSES = ["pending", "approved", "rejected"];

// PATCH → moderate: update status and/or featured.
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/submissions/[id]">) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if ("status" in body) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: `status must be one of ${STATUSES.join(", ")}` }, { status: 400 });
    }
    patch.status = body.status;
  }
  if ("featured" in body) patch.featured = Boolean(body.featured);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const ref = getAdminDb().collection("submissions").doc(id);
  if (!(await ref.get()).exists) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  await ref.set(patch, { merge: true });
  return NextResponse.json({ id, ...patch });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/submissions/[id]">) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  await getAdminDb().collection("submissions").doc(id).delete();
  return NextResponse.json({ ok: true, id });
}
