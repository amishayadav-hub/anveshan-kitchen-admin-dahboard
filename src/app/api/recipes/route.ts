import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { revalidateRecipesApp } from "@/lib/revalidate";
import type { Recipe } from "@/types";

export const runtime = "nodejs";

// GET → list all recipes (lightweight; full docs are fine at this scale).
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const snap = await getAdminDb().collection("recipes").get();
  const recipes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recipe));
  recipes.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ recipes });
}

// POST → create a recipe (doc id == recipe id, mirroring the seed pattern).
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const slug = String(body.slug || "").trim();
  const name = String(body.name || "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const ref = getAdminDb().collection("recipes").doc(id);
  if ((await ref.get()).exists) {
    return NextResponse.json({ error: `Recipe "${id}" already exists` }, { status: 409 });
  }

  // Normalize numeric + array fields; store the rest as provided.
  const doc = {
    ...body,
    servings: Number(body.servings) || 0,
    ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
    steps: Array.isArray(body.steps) ? body.steps : [],
    anveshanProducts: Array.isArray(body.anveshanProducts) ? body.anveshanProducts : [],
  };
  delete doc.id; // stored as the doc id, not a field
  await ref.set(doc);
  await revalidateRecipesApp(["/recipes", `/recipes/${slug}`]);
  return NextResponse.json({ id, ...doc }, { status: 201 });
}
