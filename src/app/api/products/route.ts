import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { revalidateRecipesApp } from "@/lib/revalidate";
import type { AnveshanProduct } from "@/types";

export const runtime = "nodejs";

const CATEGORIES = ["ghee", "sweetener", "oil", "grain", "spice", "superfood"];

// GET → list all products.
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const snap = await getAdminDb().collection("products").get();
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AnveshanProduct));
  products.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ products });
}

// POST → create a product (doc id == product id, mirroring the seed pattern).
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const name = String(body.name || "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (body.category && !CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: `category must be one of ${CATEGORIES.join(", ")}` }, { status: 400 });
  }

  const ref = getAdminDb().collection("products").doc(id);
  if ((await ref.get()).exists) {
    return NextResponse.json({ error: `Product "${id}" already exists` }, { status: 409 });
  }

  const doc: Omit<AnveshanProduct, "id"> = {
    shopifyVariantId: String(body.shopifyVariantId || ""),
    name,
    image: String(body.image || ""),
    price: Number(body.price) || 0,
    category: body.category || "ghee",
    whyAnveshan: String(body.whyAnveshan || ""),
    ...(Array.isArray(body.variants) ? { variants: body.variants } : {}),
  };
  await ref.set(doc);
  await revalidateRecipesApp(["/recipes"]);
  return NextResponse.json({ id, ...doc }, { status: 201 });
}
