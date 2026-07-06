import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/require-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { revalidateRecipesApp } from "@/lib/revalidate";
import type { CommunityPost } from "@/types";

export const runtime = "nodejs";

const REAL_PEEPS_PATH = "/recipes/real-peeps";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const snap = await getAdminDb().collection("communityPosts").orderBy("order").get();
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityPost));
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const b = await req.json().catch(() => ({}));
  if (!String(b.title || "").trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const db = getAdminDb();
  // Append after the current last post.
  const last = await db.collection("communityPosts").orderBy("order", "desc").limit(1).get();
  const nextOrder = last.empty ? 0 : (Number(last.docs[0].get("order")) || 0) + 1;

  const doc = {
    title: String(b.title),
    description: String(b.description || ""),
    author: String(b.author || ""),
    handle: String(b.handle || ""),
    date: String(b.date || ""),
    images: Array.isArray(b.images) ? b.images.filter(Boolean) : [],
    tags: Array.isArray(b.tags) ? b.tags : [],
    products: Array.isArray(b.products) ? b.products : [],
    likes: Number(b.likes) || 0,
    saves: Number(b.saves) || 0,
    shares: Number(b.shares) || 0,
    order: nextOrder,
    createdAt: FieldValue.serverTimestamp(),
  };
  const ref = await db.collection("communityPosts").add(doc);
  await revalidateRecipesApp([REAL_PEEPS_PATH]);
  return NextResponse.json({ id: ref.id, ...doc }, { status: 201 });
}
