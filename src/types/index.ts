// Shared content shapes — mirrored from anveshan-recipes/src/types/index.ts so
// the admin dashboard reads/writes the exact same Firestore document shapes.
// Keep in sync with the public app.

export type GheeVariant = "gir-cow" | "desi-cow" | "buffalo";

export interface GheeVariantOption {
  type: GheeVariant;
  label: string;
  shopifyVariantId: string;
  price: number;
}

export interface AnveshanProduct {
  id: string;
  shopifyVariantId: string;
  name: string;
  image: string;
  price: number;
  category: "ghee" | "sweetener" | "oil" | "grain" | "spice" | "superfood";
  variants?: GheeVariantOption[];
  whyAnveshan: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  anveshan?: boolean;
  anveshanProductId?: string;
  note?: string;
}

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  category: string;
  subCategory?: string;
  ingredients: Ingredient[];
  steps: string[];
  anveshanProducts: string[];
  tags?: string[];
  isVeg?: boolean;
  intro?: string;
  faqs?: { question: string; answer: string }[];
  tips?: string[];
}

export interface RecipeSubmission {
  id: string;
  name: string;
  city?: string;
  recipeName: string;
  products: string[];
  story: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  createdAt?: unknown;
}

// ─── Admin-dashboard-specific shapes ─────────────────────────────────────────

/** Aggregate click counter — Firestore `clicks/{eventKey}`. */
export interface ClickCounter {
  count: number;
  label: string;
  surface?: string;
  device?: "mobile" | "desktop" | "unknown";
  lastAt?: unknown;
}

/** One post in the migrated Real Peeps feed — Firestore `communityPosts/{id}`. */
export interface CommunityPost {
  id: string;
  title: string;
  description: string;
  author: string;
  handle: string;
  date: string;
  images: string[];
  tags: string[];
  products: string[];
  likes: number;
  saves?: number;
  shares?: number;
  order?: number;
}
