import type { Metadata } from "next";
import { SiteHeader } from "@/components/browse/site-header";
import { NewPasswordForm } from "@/components/account/password-forms";

export const metadata: Metadata = { title: "Set a new password | RU Subletting" };

export default function UpdatePasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-sm">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">Set a new password</h1>
          <NewPasswordForm afterSave="browse" />
        </div>
      </main>
    </>
  );
}
