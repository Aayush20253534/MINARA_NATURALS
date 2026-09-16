# Phase 2 — Pooja Samagri, B2B/Export, and Admin Extensions

This maps to the proposal’s Phase 2.

The goal is to expand the commerce platform beyond retail shopping while keeping all new business workflows manageable from admin tooling.

---

## Part 2.1 — Pooja Samagri merchandising section

### Tasks

- create/confirm pooja categories:
  - agarbatti;
  - dhoop;
  - kapoor;
  - diya;
  - kumkum;
  - hawan samagri;
  - pooja thali;
  - festival products;
- build dedicated pooja landing/merchandising page;
- use shared product/category commerce components;
- apply earthy/saffron visual accents from design system;
- support festival collections when real product data exists;
- add SEO metadata/content for the section.

### Rule

Pooja is a merchandising vertical, not a second cart or second catalogue implementation.

### Exit criteria

- Pooja products use the same variants/cart/checkout/account flow;
- category visual identity feels distinct but coherent;
- no duplicated commerce logic.

---

## Part 2.2 — Bulk and Wholesale module

### Step 1: confirm business contract

Confirm final form fields, buyer types, status workflow, admin owners, notification recipients, and whether product/variant selection is needed.

### Backend tasks

- implement `BulkInquiry` module/model;
- create public submission workflow/API;
- server-side validation;
- spam/rate-limit protection appropriate to public forms;
- generate submission ID/reference;
- send acknowledgement through Resend if approved;
- send internal notification if approved;
- add status/history/internal notes if required.

### Frontend tasks

- build premium B2B landing page;
- explain buyer use cases;
- connect product/category context where helpful;
- implement inquiry form;
- success state with reference;
- error/retry behaviour;
- preserve entered data when recoverable errors occur.

### Admin tasks

- inquiry list;
- filters by status/date/type/location if fields exist;
- search;
- detail view;
- status update;
- internal notes if confirmed;
- timestamps/audit-friendly presentation.

### Exit criteria

- submitted inquiry appears in admin;
- acknowledgement/notification behaviour is tested;
- duplicate accidental submissions are mitigated where practical;
- public user cannot read inquiry data.

---

## Part 2.3 — Export module: “From Local to Global”

### Step 1: confirm business contract

At minimum the proposal calls for:

- destination country;
- quantity;
- private-label interest;
- buyer details.

Confirm product/category interests, company fields, target port/region, certifications questions, and internal status flow before implementing extras.

### Backend tasks

- implement `ExportInquiry` module/model;
- validate public submission;
- reference generation;
- status workflow;
- Resend acknowledgement/internal notification as approved;
- admin list/detail/status handling.

### Frontend tasks

- export landing page;
- source/quality/product presentation;
- private-label content only if actually offered;
- export inquiry form;
- country input/select with accessible UX;
- success and error states.

### Compliance/content rule

Do not add ISO/FSSAI/export certification claims, country availability, guaranteed logistics, or private-label capabilities unless verified by the client.

### Exit criteria

- export inquiry persists and is visible in admin;
- all proposal-required fields are present;
- page reads as B2B/export, not retail checkout;
- no unsupported compliance claim.

---

## Part 2.4 — Homepage banners and merchandising admin

The proposal expects admin control over coupons and homepage banners.

### Tasks

- decide final lightweight content model for homepage banners/featured rails;
- expose banner CRUD in Admin;
- allow activation windows/order where required;
- reference products/categories rather than duplicating their data;
- validate image/media requirements;
- make storefront resilient when no banner is active;
- ensure expired campaign data does not stay visible due to uncontrolled cache.

### Exit criteria

- authorized admin can update supported homepage merchandising without code deploy;
- invalid/missing campaign media does not break homepage;
- scheduled/active states are predictable.

---

## Part 2.5 — Coupon/promotion operational pass

### Tasks

- configure Medusa promotions for approved business rules;
- admin create/update/disable flow;
- coupon input state in cart/checkout;
- backend validation;
- display applied discount clearly;
- handle expired/invalid/not-applicable codes;
- prevent frontend-calculated discounts from becoming authoritative.

### Exit criteria

- promotion is calculated by backend;
- code behaviour matches configured rules;
- error messages are useful;
- order records preserve correct totals.

---

## Part 2.6 — Admin day-to-day workflow review

Validate the proposal’s day-to-day areas:

- Products & Categories;
- Pack Sizes & Pricing;
- Inventory;
- Orders & Customers;
- Bulk Inquiries;
- Export Inquiries;
- Coupons;
- Homepage Banners.

### Tasks

- remove redundant custom screens where Medusa Admin already handles the job;
- add custom widgets/pages only for MINARA-specific workflows;
- verify mobile/tablet admin usability enough for practical operations, while prioritizing desktop admin workflows;
- create short internal admin usage notes;
- verify permissions on all custom admin endpoints.

## Phase 2 gate

Phase 2 is complete when retail operations remain stable and the team can independently receive, review, and update Bulk and Export inquiries, manage Pooja merchandising, promotions, and supported homepage content from admin tooling.
