"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={cn("ui-drawer", "is-open")}>
      <button className="ui-drawer__backdrop" type="button" onClick={onClose} aria-label="Close menu" />
      <aside className="ui-drawer__panel" aria-label={title}>
        <div className="ui-drawer__header"><strong>{title}</strong><button type="button" className="icon-button" onClick={onClose} aria-label="Close menu">×</button></div>
        {children}
      </aside>
    </div>
  );
}
