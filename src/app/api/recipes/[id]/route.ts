import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { revalidateRecipesApp } from "@/lib/revalidate";

export const runtime = "nodejs";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/recipes/[id]">) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  delete body.id;
  if ("servings" in body) body.servings = Number(body.servings) || 0;

  const ref = getAdminDb().collection("recipes").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  await ref.set(body, { merge: true });

  // Revalidate the listing and both the old and new slug (in case it changed).
  const oldSlug = (snap.data() as { slug?: string })?.slug;
  const paths = new Set<string>(["/recipes"]);
  if (oldSlug) paths.add(`/recipes/${oldSlug}`);
  if (typeof body.slug === "string" && body.slug) paths.add(`/recipes/${body.slug}`);
  await revalidateRecipesApp([...paths]);

  return NextResponse.json({ id, ...body });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/recipes/[id]">) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await ctx.params;
  const ref = getAdminDb().collection("recipes").doc(id);
  const snap = await ref.get();
  const slug = (snap.data() as { slug?: string } | undefined)?.slug;
  await ref.delete();

  const paths = ["/recipes", ...(slug ? [`/recipes/${slug}`] : [])];
  await revalidateRecipesApp(paths);
  return NextResponse.json({ ok: true, id });
}
