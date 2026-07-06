import type { IconName } from "@/components/icons";

// Single source of truth for the admin sidebar / sections. Each phase fills in
// its page; the nav is declared up front so the shell is stable.
export interface NavItem {
  href: string;
  label: string;
  /** Short description shown on the overview cards. */
  blurb: string;
  /** SVG icon key (see components/icons.tsx). */
  icon: IconName;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Overview", blurb: "Dashboard home and health.", icon: "overview" },
  { href: "/analytics", label: "Click Analytics", blurb: "Button & link clicks, desktop vs mobile.", icon: "analytics" },
  { href: "/products", label: "Products", blurb: "The hero — manage sellable products.", icon: "products" },
  { href: "/recipes", label: "Recipes", blurb: "Create, edit and delete recipes.", icon: "recipes" },
  { href: "/submissions", label: "Submissions", blurb: "Moderate community recipe submissions.", icon: "submissions" },
  { href: "/community", label: "Real Peeps", blurb: "Manage the community feed.", icon: "community" },
  { href: "/generator", label: "Generator", blurb: "AI generator config & funnel.", icon: "generator" },
];
