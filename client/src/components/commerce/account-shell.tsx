import type { ReactNode } from "react";
import { AccountNav } from "./account-client";
import s from "./account.module.css";
export function AccountShell({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  return (
    <div className={s.page}>
      <header className={s.intro}>
        <p className="eyebrow">A place for your everyday</p>
        <h1>Your account.</h1>
        <p>Your details, your favourites, and every good thing on its way.</p>
      </header>
      <div className={s.shell}>
        <AccountNav active={active} />
        <div>{children}</div>
      </div>
    </div>
  );
}
