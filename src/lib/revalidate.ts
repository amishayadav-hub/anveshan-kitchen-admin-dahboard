import "server-only";

// Tells the public recipe app to regenerate the given paths immediately after
// an admin write, so edits go live without waiting for the hourly ISR window.
// Best-effort: never throws (a failed revalidate just means slightly stale
// pages until the next natural revalidation).
export async function revalidateRecipesApp(paths: string[]): Promise<void> {
  const url = process.env.RECIPES_APP_URL?.replace(/\/$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret || paths.length === 0) return;
  try {
    await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, paths }),
    });
  } catch {
    // ignore — revalidation is best-effort
  }
}
