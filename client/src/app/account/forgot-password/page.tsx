import { AuthForm } from "@/components/commerce/account-client";
export const metadata = { title: "Your account", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}) { const {next}=await searchParams; return <AuthForm mode="forgot" returnTo={next}/>; }
