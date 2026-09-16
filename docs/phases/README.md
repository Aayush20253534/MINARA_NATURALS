# MINARA NATURALS Implementation Roadmap

This roadmap preserves the four delivery phases in the proposal but breaks them into implementable parts with explicit dependencies and exit gates.

A preliminary **Phase 0** is added because the repository currently contains only a starter Next.js app and a placeholder Express server. Attempting to begin catalogue or UI work before the commerce backend, design system, environment model, and deployment assumptions are fixed would create avoidable rework.

## High-level sequence

```text
Phase 0  Foundation and architecture
   |
   v
Phase 1  Core retail storefront and commerce
   |
   v
Phase 2  Pooja + Bulk + Export + Admin extensions
   |
   v
Phase 3  Franchise Partner module
   |
   v
Phase 4  Catalogue import + production QA + go-live
```

## Phase files

- [`00-foundation.md`](./00-foundation.md)
- [`01-core-commerce.md`](./01-core-commerce.md)
- [`02-business-verticals-admin.md`](./02-business-verticals-admin.md)
- [`03-franchise.md`](./03-franchise.md)
- [`04-data-qa-launch.md`](./04-data-qa-launch.md)

## Working rule

Each phase is divided into parts. A part can be developed on a branch and reviewed independently, but later parts should not assume incomplete contracts from earlier parts.

Every part should finish with:

1. code complete;
2. responsive UI checked where applicable;
3. error/loading/empty states implemented;
4. lint/typecheck/build passing;
5. relevant tests passing;
6. docs/env examples updated;
7. no unresolved mock/fake production claims;
8. acceptance checklist reviewed.

## Cross-phase blockers to resolve early

These decisions are not all required on Day 1, but they become blockers at specific points:

| Decision | Needed by |
| --- | --- |
| Official logo/brand assets | Phase 1 Part 1.2 |
| Initial category hierarchy | Phase 1 Part 1.3 |
| Initial product sample dataset | Phase 1 Part 1.3 |
| Payment provider | Before Phase 1 checkout completion |
| Shipping/serviceability rules | Before Phase 1 checkout completion |
| Login method beyond email/password | Before Phase 1 account completion |
| Bulk inquiry fields/status process | Phase 2 Part 2.2 |
| Export inquiry fields/process | Phase 2 Part 2.3 |
| Franchise application fields/status process | Phase 3 Part 3.3 |
| Final product spreadsheet/images | Phase 4 Part 4.1 |
| Legal company/contact/policy content | Before production launch |
| Domain/DNS access | Phase 4 deployment |

## Branch/commit discipline

Prefer implementation slices that are reviewable and reversible. Examples:

```text
feat/foundation-medusa
feat/design-system-shell
feat/catalogue-listing
feat/product-detail
feat/cart
feat/checkout
feat/customer-account
feat/bulk-inquiries
feat/export-inquiries
feat/franchise
chore/catalog-import
chore/production-hardening
```

Do not mix a full redesign, backend schema migration, checkout rewrite, and deployment change in one giant patch unless there is a very strong reason. That style of development mainly produces archaeology for whoever debugs it later.
