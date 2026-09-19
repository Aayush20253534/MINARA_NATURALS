"use client";
import Link from "next/link";
import s from "@/components/commerce/account.module.css";
export default function ErrorPage({ reset }:{ reset:()=>void }) {return <div className={s.page}><section className={s.panel}><p className="eyebrow">Let’s try that again</p><h1>We couldn’t load checkout.</h1><p>Your connection may have dropped or your session may have expired.</p><div className={s.actions}><button className={s.button} onClick={reset}>Try again</button><Link className={s.textLink} href="/account/login">Sign in again</Link><Link className={s.textLink} href="/shop">Back to the shop</Link></div></section></div>;}
