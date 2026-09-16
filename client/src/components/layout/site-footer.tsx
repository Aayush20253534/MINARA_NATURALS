import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__top">
          <div className="site-footer__brand"><Wordmark inverse /><p>A scalable commerce home for MINARA NATURALS retail, wholesale, export and franchise experiences.</p></div>
          <div className="footer-column"><strong>Shop</strong><Link href="#categories">Categories</Link><Link href="#categories">MINARA Pickles</Link><Link href="#categories">Pooja Samagri</Link></div>
          <div className="footer-column"><strong>Business</strong><Link href="#business">Bulk & Wholesale</Link><Link href="#business">Export</Link><Link href="#business">Franchise Partner</Link></div>
          <div className="footer-column"><strong>Company</strong><Link href="#story">Our Story</Link><span>Customer support</span><span>Policies</span></div>
        </div>
        <div className="site-footer__bottom"><span>© {new Date().getFullYear()} MINARA NATURALS</span><span>Freshness · Quality · Trust</span></div>
      </Container>
    </footer>
  );
}
