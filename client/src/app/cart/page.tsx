import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CartContents } from "@/components/commerce/cart-view";
import styles from "@/components/commerce/cart.module.css";
export const metadata: Metadata = {
  title: "Your shopping bag",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};
export default function CartPage() {
  return (
    <section className={styles.page}>
      <Container>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Your bag</span>
        </nav>
        <div className={styles.pageHeading}>
          <div>
            <p className="eyebrow">Your everyday essentials</p>
            <h1>Your shopping bag.</h1>
          </div>
          <p>
            A little fresh. A little familiar.
            <br />
            All your favourites, together.
          </p>
        </div>
        <CartContents />
      </Container>
    </section>
  );
}
