import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/browse/site-header";

export const metadata: Metadata = { title: "Sign in | RU Subletting" };

export default function SignInPage() {
  return (
    <>
      <SiteHeader current="/sign-in" />
      <main className="flex flex-1 justify-center px-4 py-12 md:py-20">
        <Suspense>
          <AuthForm />
        </Suspense>
      </main>
    </>
  );
}
