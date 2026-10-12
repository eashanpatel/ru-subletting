import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/browse/site-header";
import { ForgotPasswordForm } from "@/components/account/password-forms";

export const metadata: Metadata = { title: "Reset your password | RU Subletting" };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader current="/sign-in" />
      <main className="flex flex-1 justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">We&apos;ll email you a link to set a new one.</p>
          <Suspense>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}
