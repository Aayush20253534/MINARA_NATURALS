import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowIcon, GlobeIcon, LeafIcon, PackageIcon, StoreIcon } from "@/components/ui/icons";
import { CatalogPreview } from "@/components/commerce/catalog-preview";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getCatalogPreview } from "@/lib/catalog";
import { getFoundationConnection } from "@/lib/medusa";

export const dynamic = "force-dynamic";

const business = [
  { icon: PackageIcon, eyebrow: "For retailers & hospitality", title: "Bulk & Wholesale", copy: "A dedicated requirement path for retailers, hotels and distributors, separated from normal consumer checkout." },
  { icon: GlobeIcon, eyebrow: "From local to global", title: "Export", copy: "A focused buyer journey for destination, volume, private-label and export requirement enquiries." },
  { icon: StoreIcon, eyebrow: "Build with MINARA", title: "Franchise Partner", copy: "A premium B2B destination for retail, mini-store, distribution and pickle-partner models." },
] as const;

export default async function Home() {
  const [catalog, connection] = await Promise.all([
    getCatalogPreview(),
    process.env.NODE_ENV === "development" ? getFoundationConnection() : Promise.resolve(null),
  ]);

  return (
    <>
      <Section className="hero-section">
        <Container className="hero-grid">
          <div className="hero-copy">
            <Badge><LeafIcon width={15} height={15} /> Freshness · Quality · Trust</Badge>
            <p className="eyebrow">MINARA NATURALS</p>
            <h1>Everyday essentials,<br/><em>from local sources to your home.</em></h1>
            <p className="hero-lead">A modern home for fresh produce, groceries, spices, MINARA pickles, pooja essentials and the products families reach for every day.</p>
            <div className="hero-actions"><Link className="link-button link-button--primary" href="#categories">Explore categories <ArrowIcon /></Link><Link className="link-button link-button--secondary" href="#story">Discover MINARA</Link></div>
            <div className="hero-trust"><span><i>✓</i> Inventory-aware catalogue</span><span><i>✓</i> Multiple pack sizes</span><span><i>✓</i> Business & franchise journeys</span></div>
          </div>
          <div className="hero-art" aria-label="MINARA product category illustration">
            <div className="hero-art__halo" />
            <div className="hero-art__leaf hero-art__leaf--one"/><div className="hero-art__leaf hero-art__leaf--two"/><div className="hero-art__leaf hero-art__leaf--three"/>
            <div className="hero-art__label"><small>MINARA</small><strong>NATURALS</strong><span>Freshness · Quality · Trust</span></div>
            <div className="hero-art__chip hero-art__chip--one">Freshness</div><div className="hero-art__chip hero-art__chip--two">Quality</div><div className="hero-art__chip hero-art__chip--three">Trust</div>
          </div>
        </Container>
      </Section>

      <CatalogPreview
        categories={catalog.categories}
        products={catalog.products}
        connected={catalog.connected}
      />

      <Section className="story-section" id="story">
        <Container className="story-grid">
          <div className="story-visual"><div className="story-visual__field"/><div className="story-visual__card"><LeafIcon width={25} height={25}/><strong>From local sources<br/>to your home.</strong></div></div>
          <div className="story-copy"><p className="eyebrow">The MINARA promise</p><h2>One brand language across food, essentials and growth.</h2><p>The platform is designed as more than a checkout surface. Retail shopping sits alongside MINARA-owned products, sourcing stories, business enquiries and a credible franchise experience without turning the homepage into a corporate brochure.</p><div className="story-pill-row"><span>Freshness</span><span>Quality</span><span>Trust</span></div></div>
        </Container>
      </Section>

      <Section className="business-section" id="business">
        <Container>
          <div className="section-heading section-heading--light"><div><p className="eyebrow">MINARA for business</p><h2>Commerce beyond the consumer basket.</h2></div><p>Each business journey receives its own inquiry and administration workflow rather than being squeezed into retail checkout.</p></div>
          <div className="business-grid">{business.map(({ icon: Icon, eyebrow, title, copy }) => <article className="business-card" key={title}><div className="business-card__icon"><Icon /></div><p>{eyebrow}</p><h3>{title}</h3><span>{copy}</span><div className="business-card__footer">Dedicated journey <ArrowIcon width={17} height={17}/></div></article>)}</div>
        </Container>
      </Section>

      {connection && <Section className="dev-status"><Container><div className="dev-status__panel"><strong>Phase 1.1 connection check</strong><span className={connection.backendReachable ? "is-ok" : ""}>API {connection.backendReachable ? "reachable" : "not reachable"}</span><span className={connection.publishableKeyConfigured ? "is-ok" : ""}>Publishable key {connection.publishableKeyConfigured ? "configured" : "missing"}</span><span className={connection.storeApiReachable ? "is-ok" : ""}>Store API {connection.storeApiReachable ? "reachable" : "not verified"}</span></div></Container></Section>}
    </>
  );
}
