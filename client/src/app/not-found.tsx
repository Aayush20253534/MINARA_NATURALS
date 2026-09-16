import Link from "next/link";

export default function NotFound() {
  return <div className="page-state"><p className="eyebrow">404</p><h1>This page isn’t on the shelf.</h1><p>The address may have changed or the page may not exist yet.</p><Link className="link-button link-button--primary" href="/">Back to MINARA</Link></div>;
}
