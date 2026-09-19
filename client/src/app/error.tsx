"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="page-state">
      <p className="eyebrow">Something went wrong</p>
      <h1>We couldn’t load this part of MINARA.</h1>
      <p>
        Our shop is taking a little longer to respond. Please try again in a
        moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
