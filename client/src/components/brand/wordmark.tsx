import Link from "next/link";
import { LeafIcon } from "@/components/ui/icons";

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`wordmark${inverse ? " wordmark--inverse" : ""}`} href="/" aria-label="MINARA NATURALS home">
      <span className="wordmark__mark"><LeafIcon width={18} height={18} /></span>
      <span className="wordmark__copy"><strong>MINARA NATURALS</strong><small>Freshness · Quality · Trust</small></span>
    </Link>
  );
}
