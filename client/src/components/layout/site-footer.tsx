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
              For well-stocked kitchens, familiar flavours and the everyday
              rituals that make a home.
            </p>
            <span className="footer-signoff">Good things, every day.</span>
          </div>
          <div className="footer-column">
            <strong>Your everyday shop</strong>
            <Link href="/shop">All products</Link>
            <Link href="/category/fresh-produce">Fresh produce</Link>
            <Link href="/category/groceries">Groceries & staples</Link>
            <Link href="/category/spices">Spices</Link>
          </div>
          <div className="footer-column">
            <strong>Discover MINARA</strong>
            <Link href="/category/minara-pickles">Our pickle collection</Link>
            <Link href="/category/pooja-samagri">Pooja essentials</Link>
            <Link href="/category/household-personal-care">
              Home & personal care
            </Link>
            <Link href="/#story">Our story</Link>
          </div>
          <div className="footer-column">
            <strong>Grow with us</strong>
            <Link href="/#wholesale">Bulk & wholesale</Link>
            <Link href="/#export">From local to global</Link>
            <Link href="/#franchise">Franchise partnerships</Link>
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
