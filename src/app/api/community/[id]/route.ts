import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { revalidateRecipesApp } from "@/lib/revalidate";

export const runtime = "nodejs";

const REAL_PEEPS_PATH = "/recipes/real-peeps";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/community/[id]">) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  delete body.id;
  delete body.createdAt;
  // Coerce numeric counters if present.
  for (const k of ["likes", "saves", "shares", "order"]) {
    if (k in body) body[k] = Number(body[k]) || 0;
  }
  if ("images" in body && Array.isArray(body.images)) body.images = body.images.filter(Boolean);

  const ref = getAdminDb().collection("communityPosts").doc(id);
  if (!(await ref.get()).exists) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  await ref.set(body, { merge: true });
  await revalidateRecipesApp([REAL_PEEPS_PATH]);
  return NextResponse.json({ id, ...body });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/community/[id]">) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  await getAdminDb().collection("communityPosts").doc(id).delete();
  await revalidateRecipesApp([REAL_PEEPS_PATH]);
  return NextResponse.json({ ok: true, id });
}
