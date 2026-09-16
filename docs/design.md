# MINARA NATURALS Design System and UX Direction

## 1. Design objective

MINARA must feel like a **credible, premium Indian FMCG and modern-supermarket brand**, not a generic grocery template and not a green repaint of another startup website.

The design has to support two behaviours at once:

- fast, practical shopping for repeat retail customers;
- strong brand presentation for wholesale buyers, export prospects, franchise applicants, partners, and investors.

The visual system should therefore be clean and efficient in commerce surfaces, while allowing richer storytelling in brand, sourcing, export, and franchise sections.

The proposal establishes three brand ideas that should remain visible in the experience:

> **Freshness | Quality | Trust**

Every major design decision should reinforce at least one of those ideas.

---

## 2. Design personality

### Desired character

- fresh without looking childish;
- natural without becoming rustic or craft-market themed;
- premium without excessive empty space;
- warm without becoming visually noisy;
- commercial and trustworthy rather than experimental;
- Indian in product/category relevance, not through decorative clichés;
- polished enough for investors and franchise prospects;
- fast and straightforward enough for everyday grocery shopping.

### Avoid

Do not use:

- generic “AI startup” layouts with random floating cards;
- glassmorphism as the default surface treatment;
- excessive gradients;
- neon green grocery-app styling;
- giant rounded cards everywhere;
- unnecessary blur;
- oversized hero text that consumes most of a laptop viewport;
- decorative statistics without verified data;
- meaningless badges such as “100% trusted” unless supported;
- stock photography that looks unrelated to Indian FMCG/food contexts;
- different visual languages on every page;
- icon grids where actual product/category photography would be stronger;
- horizontal overflow, clipped artwork, or desktop-only interaction patterns.

---

## 3. Core visual system

Brand assets are not yet in the repository. The palette below is an implementation starting point, not a replacement for a future official brand guideline.

### 3.1 Primary palette

Use CSS custom properties so brand adjustments happen centrally.

```css
:root {
  --minara-green-950: #0d3b24;
  --minara-green-900: #14532d;
  --minara-green-800: #176238;
  --minara-green-700: #1f6b3a;
  --minara-green-600: #2f7d4a;
  --minara-green-100: #e7f3ea;
  --minara-green-50: #f3f8f4;

  --minara-cream: #fbfaf5;
  --minara-surface: #ffffff;
  --minara-ink: #17211a;
  --minara-muted: #66736a;
  --minara-line: #dfe7e1;

  --minara-pickle: #a94f1f;
  --minara-pickle-soft: #fff0e6;
  --minara-pooja: #a16b1b;
  --minara-pooja-soft: #fff6df;
  --minara-fresh: #558b3f;
  --minara-alert: #b42318;
}
```

Rules:

- deep green is for brand, navigation emphasis, important CTAs, and trust anchors;
- white/warm off-white is the dominant base;
- accents are category-specific and should never compete with the core brand;
- red is reserved for error, destructive state, urgent stock state, or a legitimate discount treatment;
- body copy should use dark neutral ink, not pure black;
- category-specific colour must always be paired with text/iconography so meaning does not depend on colour alone.

### 3.2 Category accents

Use accents intentionally:

- **Fresh produce:** leaf/farm greens.
- **Pickles/spices:** warm amber, chilli, terracotta.
- **Pooja Samagri:** saffron, turmeric, muted marigold, earthy brown.
- **Household/personal care:** restrained cool or botanical tones.
- **Wholesale/export:** deeper neutral greens with more structured B2B composition.
- **Franchise:** premium forest green, cream, charcoal, subtle gold/bronze accent if brand assets support it.

Do not tint entire pages heavily. The category colour should guide emphasis, not become a theme park.

---

## 4. Typography

Until an official typeface is supplied:

- use a clean, high-legibility modern sans for UI and commerce;
- `Manrope`, `Inter`, or an equivalent production-safe family is acceptable;
- load fonts through `next/font` where possible;
- keep the number of font families low;
- if a serif/display face is introduced for editorial brand storytelling, restrict it to large editorial headings and never use it for dense commerce UI.

Recommended hierarchy:

- Display/H1: 48–64px desktop, 34–42px mobile, responsive with `clamp()`.
- Section H2: 32–44px desktop, 28–34px mobile.
- H3/card title: 18–24px.
- Body: 15–17px, line-height 1.55–1.7.
- Product price: visually stronger than metadata but never cartoonishly large.
- UI labels: 12–14px with clear weight and case, not tiny low-contrast text.

Headings should be compact enough that key product or CTA content remains visible above the fold on normal laptops.

---

## 5. Spacing, radius, and elevation

### Spacing

Use a consistent 4/8px-derived spacing scale. Typical section vertical spacing:

- desktop: 72–112px depending on density;
- tablet: 56–80px;
- mobile: 40–64px.

Commerce screens should be denser than brand-story screens.

### Radius

- small controls: 8–10px;
- buttons/inputs: 10–12px;
- standard cards: 14–18px;
- major campaign/hero media: 20–28px only when it improves the composition.

Avoid making every component a pill or 28px blob.

### Elevation

Prefer borders and subtle tonal separation over heavy shadows. Product cards should not look like floating dashboard widgets.

---

## 6. Responsive system

Design mobile-first, then enhance.

Suggested layout ranges:

- small mobile: 320–479px;
- mobile: 480–767px;
- tablet: 768–1023px;
- laptop: 1024–1439px;
- wide desktop: 1440px+.

Use container widths around 1200–1360px for primary desktop content unless a full-bleed visual section needs more space.

### Mobile rules

- primary navigation collapses cleanly;
- search remains easy to reach;
- cart/account are never hidden behind obscure interactions;
- filters use a drawer/sheet rather than squeezing desktop sidebars;
- sticky bottom actions are acceptable on product/checkout flows if they improve completion;
- tap targets should be at least ~44px high;
- product grids default to two columns when card content remains readable;
- B2B/franchise forms should be single-column on small screens;
- no information may depend on hover.

---

## 7. Global shell

### 7.1 Announcement/service strip

Optional slim top strip for real operational information such as delivery coverage, customer support, or a verified offer. Avoid permanent marketing noise.

### 7.2 Header

Desktop header should support:

- MINARA logo/wordmark;
- category/shop navigation;
- search;
- Bulk/Wholesale;
- Export;
- Franchise;
- account;
- wishlist;
- cart.

The visual order should make retail shopping primary while keeping the B2B routes visible.

### 7.3 Search

Search deserves first-class placement because the catalogue is expected to grow.

Desired behaviour:

- fast text input;
- keyboard accessible;
- suggestions for products/categories when implemented;
- useful empty state;
- typo tolerance or smarter search can be added later if catalogue scale justifies a dedicated search service.

### 7.4 Footer

The footer should feel like a legitimate FMCG company footer rather than a link dump. Group:

- Shop;
- Help/customer service;
- Business/Wholesale;
- Export;
- Franchise;
- Company/About;
- policies;
- contact and verified company information;
- social links only if official accounts exist.

Use the full legal/company details once supplied.

---

## 8. Homepage composition

The homepage must balance shopping, owned-brand storytelling, and business credibility.

Recommended order:

1. **Hero / campaign area**
2. **Shop by category**
3. **Featured MINARA products / MINARA Pickles**
4. **Popular products**
5. **From Local Sources to Your Home** story section
6. **Category campaign block** such as fresh produce, spices, or pooja
7. **Why choose MINARA / trust proof** using only verified claims
8. **Bulk / Wholesale bridge**
9. **From Local to Global / Export bridge**
10. **Franchise opportunity bridge**
11. **Brand achievements / trade-show / ODOV recognition** when verified assets/content arrive
12. **Newsletter/support/footer** if appropriate

### Hero

The hero should be commerce-led, not a static corporate billboard.

It should contain:

- a clear value proposition;
- `Shop Now` primary CTA;
- `Explore Categories` secondary CTA;
- strong real product/category imagery;
- optional campaign badge only if genuine;
- no more than one or two competing messages per slide/state.

If a carousel is used, it must not auto-rotate so quickly that users cannot read it. A single strong hero is preferable to a weak carousel.

### Shop by category

Use product/category photography with concise labels. Categories should be generated from backend data or controlled configuration, not hardcoded in multiple components.

### Product rails

Horizontal rails may be used for featured/popular items, especially on mobile. They require:

- visible scroll affordance;
- consistent card width;
- keyboard controls on desktop;
- no clipped last card that looks accidental.

---

## 9. Product card standard

Every product card should have a predictable information hierarchy:

1. product image;
2. brand/category micro-label if useful;
3. product name;
4. selected/default pack size;
5. selling price;
6. MRP/discount only if valid;
7. stock state where necessary;
8. rating only when backed by real review data;
9. add-to-cart or choose-options control.

Rules:

- use a consistent image aspect ratio, generally 1:1 or 4:5 depending on supplied photography;
- avoid tiny images floating in oversized cards;
- pack-size changes must update price/availability correctly;
- `Add` should not add the wrong default variant when a choice is required;
- out-of-stock products should remain understandable, not just disable a green button with no explanation;
- wishlist is secondary and should not dominate the card;
- cards should remain visually stable while images load.

---

## 10. Product detail page

The PDP is a primary conversion surface.

### Above the fold

Desktop:

- image gallery left;
- product title, brand/category, rating if real, price, MRP, pack-size selector, stock, quantity, Add to Cart/Buy action right.

Mobile:

- swipeable media gallery;
- product info directly below;
- sticky purchase action is allowed after usability testing.

### Information sections

Support the proposal requirements:

- description;
- ingredients;
- shelf life;
- storage instructions;
- origin/source details;
- pack/quantity information;
- related products.

Do not render empty accordion sections. Product metadata should be structured in the backend rather than embedded as giant HTML blobs wherever practical.

---

## 11. Catalogue/category pages

Required controls from the proposal:

- price;
- brand;
- pack size;
- rating if the rating system exists;
- availability;
- search;
- sort order.

Desktop can use a left filter rail or compact horizontal controls depending on density. Mobile uses a filter drawer.

Category banners must not push actual products below the first screen unnecessarily.

Important UX states:

- loading skeleton;
- no products;
- no filter matches;
- API error/retry;
- pagination or infinite loading state;
- filters reflected in the URL where sensible so links are shareable and back-button behaviour works.

---

## 12. Cart and checkout

Cart must make variant/pack details obvious. A customer should never wonder whether they added 250g or 1kg.

Show:

- product image/name;
- variant/pack;
- unit price;
- quantity stepper;
- subtotal;
- valid promotion state;
- stock validation feedback;
- remove/save-for-later behaviour if implemented.

Checkout should minimize distraction and use a clear step structure such as:

1. contact/account;
2. delivery address;
3. shipping method;
4. payment;
5. review/confirmation.

Do not display payment methods that are not actually configured.

---

## 13. Customer account

The account should feel like a useful customer utility, not an admin dashboard.

Core areas:

- profile;
- orders;
- order details/tracking;
- addresses;
- wishlist;
- logout/security.

Use a compact responsive layout. On mobile, avoid permanent sidebars.

---

## 14. Pooja Samagri experience

Pooja is a dedicated merchandising section, not a completely different application.

Use earthy/saffron accents sparingly and allow festival collections when data exists. Categories may include agarbatti, dhoop, kapoor, diya, kumkum, hawan samagri, pooja thali, and festival items as supplied.

Maintain the same cart, account, checkout, and product-card system as the rest of the store.

---

## 15. Bulk and Wholesale design

This is a B2B lead-generation surface.

It should feel more structured and business-oriented than retail category pages.

Recommended sections:

- hero explaining who the programme is for;
- buyer types: retailers, hotels, distributors, institutions as confirmed;
- product/category availability;
- benefits/process;
- bulk inquiry form;
- response expectation/contact information if client supplies it;
- trust/brand proof.

The inquiry form should use progressive grouping rather than one giant unformatted column.

Potential fields:

- buyer/company name;
- contact person;
- phone/email;
- city/state;
- buyer type;
- product/category of interest;
- quantity/volume;
- frequency;
- message/requirements.

Final fields are a business decision and must be confirmed during Phase 2.

---

## 16. Export design

The proposal calls this experience **“From Local to Global.”**

It should communicate scale, quality, origin, packaging/private-label capability, and professionalism without making unsupported compliance claims.

Required inquiry concepts from the proposal:

- destination country;
- quantity;
- private-label interest;
- buyer details.

Potential visual sections:

- export hero;
- export-ready categories;
- sourcing/quality story;
- private-label capability if genuinely offered;
- process timeline;
- inquiry CTA/form.

Do not add certification logos until actual certification assets are supplied.

---

## 17. Franchise experience

The franchise section must be **visually distinct and premium**, as required by the proposal, while clearly remaining part of MINARA.

It should feel closer to a partnership/investor microsite than a retail category page.

### Recommended structure

1. franchise hero;
2. MINARA brand opportunity/story;
3. franchise model cards:
   - Retail;
   - Mini Store;
   - Distribution;
   - Pickle Partner;
4. outlet concept showcase;
5. benefits/support;
6. expansion map or state/city coverage when real data exists;
7. application process;
8. franchise application form;
9. FAQs/disclaimer.

Do not invent investment amount, guaranteed ROI, payback period, margin, or earnings.

### Application UX

If the form becomes long, split it into logical steps and preserve progress. Include a clear success state and application reference if the backend supports one.

---

## 18. Admin UX

Medusa Admin provides the commerce base. Custom admin views should match Medusa’s information density and interaction conventions rather than embedding a separate website-style dashboard inside Admin.

Custom admin areas should cover:

- bulk inquiries;
- export inquiries;
- franchise applications;
- homepage/banner content if not handled through standard product/promotion data;
- application/inquiry status and internal notes where approved.

Admin tables need:

- search;
- status filters;
- pagination;
- empty/loading/error states;
- detail drawer/page;
- clear timestamps;
- safe destructive actions;
- no fake analytics.

---

## 19. Motion and interaction

Motion should clarify, not entertain itself.

Use:

- subtle hover elevation/scale on clickable media;
- 150–250ms transitions for controls;
- restrained section reveal only where it does not delay content;
- cart feedback after successful add;
- skeletons for data-loading states.

Respect `prefers-reduced-motion`.

Do not animate core content into invisibility or make users wait for scroll-triggered reveals.

---

## 20. Accessibility requirements

Minimum expectations:

- semantic headings and landmarks;
- keyboard-accessible navigation, menus, filters, dialogs, and carousels;
- visible focus states;
- labels for every form control;
- error text connected to fields;
- sufficient colour contrast;
- alt text for meaningful product/brand imagery;
- decorative images ignored by assistive technology;
- no status communicated by colour alone;
- modal/drawer focus trapping and escape behaviour;
- logical tab order;
- reduced-motion support.

Target WCAG 2.2 AA behaviour for primary journeys where practical.

---

## 21. Performance design rules

The site is expected to be image-heavy, so visual ambition must not produce a slow grocery store.

- use `next/image` or an equivalent optimized image pipeline;
- define image dimensions/aspect ratios to prevent layout shift;
- keep hero media intentionally sized;
- lazy-load below-the-fold media;
- do not ship all product images for a grid item;
- use server rendering/cache strategy for catalogue pages;
- avoid unnecessary client components;
- do not load animation libraries for trivial effects;
- keep icons SVG-based;
- use route-level loading states;
- keep third-party scripts minimal.

Performance budgets should be checked on mobile, not only on a developer laptop.

---

## 22. SEO-aware design

The proposal depends on organic product/category discovery. UI composition must preserve crawlable content:

- one clear H1 per page;
- descriptive category copy without keyword stuffing;
- product name and structured attributes in actual text;
- breadcrumbs on category/product pages;
- clean internal linking;
- server-rendered primary catalogue content;
- visible canonical product information even when JavaScript interaction fails.

Do not bury meaningful product content inside client-only sliders or canvas effects.

---

## 23. Design acceptance gate

A feature is not visually complete until all of the following are checked:

- desktop, tablet, and mobile layouts are intentional;
- no horizontal overflow;
- no clipped cards/images/menus;
- typography and spacing use the shared system;
- interactive states exist: default, hover, focus, disabled, loading, error, success where relevant;
- empty states exist for data-dependent screens;
- real content does not break card heights or form layouts;
- colour contrast is reasonable;
- component proportions look deliberate rather than generated;
- mobile navigation/search/cart remain easy to reach;
- product pack/price information is unambiguous;
- no unverified business claim has been added for visual decoration;
- Lighthouse/Core Web Vitals regressions caused by the new UI are investigated before proceeding.
