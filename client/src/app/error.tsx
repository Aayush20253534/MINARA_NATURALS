"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <div className="page-state"><p className="eyebrow">Something went wrong</p><h1>We couldn’t load this part of MINARA.</h1><p>Please try the request again. No order or account action has been assumed successful.</p><Button onClick={reset}>Try again</Button></div>;
}
