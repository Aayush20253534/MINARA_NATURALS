import type { SVGProps } from "react";
const paths: Record<string, React.ReactNode> = {
  "fresh-produce": (
    <>
      <path d="M16 23c-7-8-16-1-12 10s10 18 16 12c6 6 12-1 16-12s-5-18-12-10" />
      <path d="M20 24c-1-7 2-12 8-15M20 19c-7 0-10-4-10-9 7 0 10 3 10 9" />
    </>
  ),
  groceries: (
    <>
      <path d="M20 47V12M20 24C10 24 8 17 8 13c9 0 12 6 12 11ZM20 36C10 36 8 29 8 25c9 0 12 6 12 11ZM20 30c10 0 12-7 12-11-9 0-12 6-12 11ZM20 42c10 0 12-7 12-11-9 0-12 6-12 11Z" />
    </>
  ),
  spices: (
    <>
      <path d="M30 16c4-8 7-7 10-6M30 16c-10 0-11 9-14 17-2 7-7 10-12 12 18 3 31-12 29-25Z" />
      <path d="m26 16 7 8" />
    </>
  ),
  "minara-pickles": (
    <>
      <rect x="10" y="11" width="24" height="6" rx="2" />
      <path d="M12 17v5l-3 5v16c0 3 2 4 5 4h16c3 0 5-1 5-4V27l-3-5v-5M9 29h26M9 40h26" />
      <path d="M18 35c2-3 5-3 8-3-1 5-4 6-8 3Z" />
    </>
  ),
  "pooja-samagri": (
    <>
      <path d="M5 32h34c-1 10-7 15-17 15S6 42 5 32Z" />
      <path d="M22 30c-8-7-5-14 0-20 5 6 8 13 0 20ZM8 27h28" />
    </>
  ),
  "household-personal-care": (
    <>
      <rect x="10" y="23" width="24" height="25" rx="4" />
      <path d="M17 23V13h10v10M22 13V7h14v6M18 35c3-4 7-4 10-4-1 7-5 9-10 4Z" />
    </>
  ),
};
export function CategoryGlyph({
  handle,
  ...props
}: SVGProps<SVGSVGElement> & { handle: string }) {
  return (
    <svg
      viewBox="0 0 44 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[handle] ?? paths.groceries}
    </svg>
  );
}
