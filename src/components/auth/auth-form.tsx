"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";

type Mode = "sign-in" | "sign-up";

const schema = z.object({
  name: z.string().trim().max(80, "Keep it under 80 characters.").optional(),
  email: z.email("Enter an email address like you@example.com."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type Values = z.infer<typeof schema>;

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-sheet px-3 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "sign-up" ? "sign-up" : "sign-in");
  const [formError, setFormError] = useState<string | null>(
    params.get("error") === "oauth" ? "Google sign-in didn't finish. Try again." : null,
  );
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await submit(values);
    } catch {
      setFormError("We couldn't reach the sign-in service. Check your connection and try again in a moment.");
    }
  }

  async function submit(values: Values) {
    const supabase = createClient();
    const { error } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
        : await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: { data: { full_name: values.name || undefined } },
          });

    if (error) {
      setFormError(authErrorMessage(error, mode));
      return;
    }
    // Signed in: always land on browse.
    router.replace("/");
    router.refresh();
  }

  async function signInWithGoogle() {
    setFormError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGoogleLoading(false);
      setFormError(authErrorMessage(error, "sign-in"));
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "sign-in" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "sign-in"
          ? "Save places and contact people who are subletting."
          : "Post your place or save the ones you like."}
      </p>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={googleLoading}
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-input bg-sheet text-sm font-medium transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {googleLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-rule" />
        or with email
        <span className="h-px flex-1 bg-rule" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {mode === "sign-up" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Name <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input id="name" autoComplete="name" className={inputClass} {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            {mode === "sign-in" && (
              <Link href="/forgot-password" className="text-sm font-medium text-brand underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            className={inputClass}
            {...register("password")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-brand-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-60",
          )}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {mode === "sign-in" ? "New here? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setFormError(null);
          }}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
