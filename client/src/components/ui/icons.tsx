import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const SearchIcon = (props: IconProps) => <svg {...base} {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>;
export const MenuIcon = (props: IconProps) => <svg {...base} {...props}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
export const UserIcon = (props: IconProps) => <svg {...base} {...props}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6"/></svg>;
export const HeartIcon = (props: IconProps) => <svg {...base} {...props}><path d="M20.8 5.9a5.4 5.4 0 0 0-7.6 0L12 7.1l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.6Z"/></svg>;
export const BagIcon = (props: IconProps) => <svg {...base} {...props}><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>;
export const ArrowIcon = (props: IconProps) => <svg {...base} {...props}><path d="M5 12h13M14 7l5 5-5 5"/></svg>;
export const LeafIcon = (props: IconProps) => <svg {...base} {...props}><path d="M19.8 4.2C13 4.4 7.2 6.1 5 11.2c-1.2 2.8-.3 5.8 2 7.4 2.3 1.7 5.7 1.2 7.6-1.1 2.9-3.5 3.7-8.1 5.2-13.3Z"/><path d="M5.7 18.4c2.7-4.3 5.7-6.6 9.5-8.6"/></svg>;
export const GlobeIcon = (props: IconProps) => <svg {...base} {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
export const StoreIcon = (props: IconProps) => <svg {...base} {...props}><path d="M4 10v10h16V10M3 10l2-6h14l2 6"/><path d="M3 10c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0"/></svg>;
export const PackageIcon = (props: IconProps) => <svg {...base} {...props}><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></svg>;
