# Phase 3 — Franchise Partner Module

This phase implements the proposal’s visually separate, premium Franchise Partner experience and its application-management workflow.

The franchise module is not just a contact form. It is a business-acquisition product surface that should communicate MINARA’s expansion model professionally while avoiding unsupported financial promises.

---

## Part 3.1 — Franchise content and data contract

Before implementation, obtain/confirm:

- official franchise proposition copy;
- descriptions of the four proposal models:
  - Retail;
  - Mini Store;
  - Distribution;
  - Pickle Partner;
- outlet concept images/renders if available;
- verified support/benefit claims;
- target geographies;
- qualification criteria;
- investment/capital fields if the client wants to collect them;
- application stages/statuses;
- contact/ownership inside the client team;
- legal disclaimer text;
- any franchise fee, ROI, margin, or earnings information only if formally approved.

### Exit criteria

- no major form/page structure depends on guessed business policy;
- content inventory is documented;
- unverified financial claims are excluded.

---

## Part 3.2 — Premium franchise landing experience

### Page structure

Implement the visual structure defined in `design.md`:

1. premium franchise hero;
2. MINARA brand/expansion story;
3. model cards;
4. outlet concept showcase;
5. benefits/support;
6. expansion/geography section when real data exists;
7. application process;
8. application CTA/form;
9. FAQs/disclaimer.

### Design rules

- visually distinct from shopping, but retain MINARA brand DNA;
- denser and more credible than generic “become a partner” landing pages;
- use real outlet/product/brand imagery where supplied;
- avoid gold gradients and pseudo-luxury decoration unless the brand system genuinely supports them;
- no fake maps or location pins;
- no invented partner counts.

### Exit criteria

- page works across desktop/mobile;
- franchise models are clearly differentiated;
- page contains no unsupported financial promise;
- application CTA remains easy to reach.

---

## Part 3.3 — Franchise application backend

### Model

Implement `FranchiseApplication` with final approved fields.

Must support at least:

- unique ID/reference;
- applicant/contact details;
- selected franchise model;
- preferred geography;
- status;
- created/updated timestamps.

The schema should support State > City > District without storing the entire location as one unusable text blob.

### Workflow

Suggested starting states, subject to client confirmation:

```text
new
-> under_review
-> contacted
-> qualified
-> approved / rejected / closed
```

### Tasks

- public API/workflow;
- server validation;
- reference generation;
- spam/rate-limit safeguards;
- acknowledgement email through Resend;
- internal notification if approved;
- admin detail/list/status actions;
- authorization tests.

### Exit criteria

- application can be submitted once and retrieved in admin;
- applicant receives expected acknowledgement;
- custom admin endpoints are protected;
- geography fields are queryable.

---

## Part 3.4 — Franchise form UX

If final application is short, use one well-grouped page. If long, use a multi-step form.

Potential sections:

- contact;
- current location;
- preferred franchise model;
- preferred territory;
- business/retail/distribution experience;
- readiness/investment questions if approved;
- declaration/consent.

### UX requirements

- mobile-friendly;
- clear progress for multi-step flow;
- preserve entered data across steps;
- inline validation;
- no validation only after final submit;
- accessible error summary for long forms;
- explicit privacy/consent text when supplied;
- success state shows application reference.

### Exit criteria

- form completion tested on mobile;
- keyboard navigation works;
- validation matches backend requirements;
- double-submit behaviour is safe.

---

## Part 3.5 — Franchise location/outlet readiness

The proposal says the platform should grow into State > City > District franchise partners and outlet locations without redevelopment.

This does **not** require a public outlet locator on day one unless the client asks for it.

Tasks now:

- make application/location models compatible with geographic hierarchy;
- reserve clean relation boundaries for approved franchise/outlet records;
- avoid encoding a future outlet network as uncontrolled application-note text.

If public locations are added later, build them from approved structured records.

---

## Part 3.6 — Franchise regression/SEO pass

- unique metadata and canonical URL;
- structured Organization/LocalBusiness data only when facts exist;
- form event analytics boundary;
- accessibility review;
- mobile review;
- email delivery review;
- admin workflow review;
- prevent indexing of private application routes/admin data.

## Phase 3 gate

Phase 3 is complete when the premium franchise experience is live in non-production, all four approved models are represented accurately, applicants can submit a validated application, and the MINARA team can review/manage applications from admin.
