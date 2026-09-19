import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Wordmark inverse />
            <p>
              Everyday essentials, MINARA specialities and dedicated business
              journeys in one considered commerce experience.
            </p>
          </div>
          <div className="footer-column">
            <strong>Shop</strong>
            <Link href="/shop">All products</Link>
            <Link href="/category/minara-pickles">MINARA Pickles</Link>
            <Link href="/category/pooja-samagri">Pooja Samagri</Link>
          </div>
          <div className="footer-column">
            <strong>Business</strong>
            <Link href="/#business">Bulk & Wholesale</Link>
            <Link href="/#business">Export</Link>
            <Link href="/#business">Franchise Partner</Link>
          </div>
          <div className="footer-column">
            <strong>Company</strong>
            <Link href="/#story">Our Story</Link>
            <span>Customer support</span>
            <span>Policies</span>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} MINARA NATURALS</span>
          <span>Freshness · Quality · Trust</span>
        </div>
      </Container>
    </footer>
  );
}
