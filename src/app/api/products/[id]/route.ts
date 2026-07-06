import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { revalidateRecipesApp } from "@/lib/revalidate";

export const runtime = "nodejs";

// PUT → update an existing product (merge). DELETE → remove it.
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  // Never let the doc id drift from the product id.
  delete body.id;
  if ("price" in body) body.price = Number(body.price) || 0;

  const ref = getAdminDb().collection("products").doc(id);
  if (!(await ref.get()).exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  await ref.set(body, { merge: true });
  await revalidateRecipesApp(["/recipes"]);
  return NextResponse.json({ id, ...body });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  await getAdminDb().collection("products").doc(id).delete();
  await revalidateRecipesApp(["/recipes"]);
  return NextResponse.json({ ok: true, id });
}
