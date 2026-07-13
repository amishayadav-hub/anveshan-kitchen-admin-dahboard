import type { SVGProps } from "react";

// Line-style SVG icon set (24×24, currentColor stroke) replacing emoji across
// the admin UI. One component, keyed by name, so callers just do
// <Icon name="products" className="h-5 w-5" />.

export type IconName =
  | "overview"
  | "analytics"
  | "products"
  | "recipes"
  | "submissions"
  | "community"
  | "generator"
  | "cart"
  | "key"
  | "dish"
  | "heart"
  | "bookmark"
  | "share"
  | "eye"
  | "menu"
  | "close"
  | "campaign";

const PATHS: Record<IconName, React.ReactNode> = {
  overview: (
    <>
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  analytics: (
    <>
      <line x1="3" y1="21" x2="21" y2="21" />
      <rect x="5" y="11" width="3.5" height="8" rx="1" />
      <rect x="10.25" y="6" width="3.5" height="13" rx="1" />
      <rect x="15.5" y="14" width="3.5" height="5" rx="1" />
    </>
  ),
  products: (
    <>
      <path d="M6 2 3 6.5V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6.5L18 2z" />
      <line x1="3" y1="6.5" x2="21" y2="6.5" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  recipes: (
    <>
      <path d="M4 11h16v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <line x1="2.5" y1="11" x2="21.5" y2="11" />
      <path d="M8 11V6.5a4 4 0 0 1 8 0V11" />
      <line x1="20" y1="13" x2="22" y2="13" />
      <line x1="2" y1="13" x2="4" y2="13" />
    </>
  ),
  submissions: (
    <>
      <path d="M4 13h4l1.5 3h5L16 13h4" />
      <path d="M5.5 5h13l3.5 8v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6z" />
    </>
  ),
  community: (
    <>
      <path d="M3 7h3.5L8 4.5h8L17.5 7H21a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  generator: (
    <>
      <path d="M12 3l1.8 4.9L18.5 9.7 13.8 11.5 12 16.5l-1.8-5L5.5 9.7l4.7-1.8z" />
      <path d="M19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="16" r="4.5" />
      <path d="M11.2 12.8 21 3" />
      <path d="M18 6l2.5 2.5" />
      <path d="M15 9l2.5 2.5" />
    </>
  ),
  dish: (
    <>
      <path d="M3 13a9 9 0 0 1 18 0z" />
      <line x1="2" y1="13" x2="22" y2="13" />
      <line x1="12" y1="4" x2="12" y2="8.5" />
    </>
  ),
  heart: (
    <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z" />
  ),
  bookmark: <path d="M19 21l-7-4.5L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  menu: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </>
  ),
  close: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  campaign: (
    <>
      <path d="M3 11v2a1 1 0 0 0 1 1h3l4 4V6L7 10H4a1 1 0 0 0-1 1z" />
      <path d="M15 8a4 4 0 0 1 0 8" />
      <path d="M18.5 5.5a8 8 0 0 1 0 13" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <line x1="8.2" y1="13.2" x2="15.8" y2="17.8" />
      <line x1="15.8" y1="6.2" x2="8.2" y2="10.8" />
    </>
  ),
};

export function Icon({
  name,
  className,
  ...props
}: { name: IconName; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
