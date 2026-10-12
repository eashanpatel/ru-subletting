import type { Metadata } from "next";
import { SiteHeader } from "@/components/browse/site-header";
import { AccountSettings } from "@/components/account/account-settings";

export const metadata: Metadata = { title: "Account | RU Subletting" };

export default function AccountPage() {
  return (
    <>
      <SiteHeader current="/account" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:px-7">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Account</h1>
        <AccountSettings />
      </main>
    </>
  );
}
