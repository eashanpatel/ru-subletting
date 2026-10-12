"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { useSession } from "@/hooks/use-session";

export const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-sheet px-3 text-base outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive";
export const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:brightness-110 active:scale-[0.98] disabled:opacity-60";

/** Step 1: ask for the email and send a reset link. */
export function ForgotPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(
    params.get("error") === "expired" ? "That reset link expired or was already used. Send a new one." : null,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!z.email().safeParse(email.trim()).success) {
      setError("Enter the email you signed up with.");
      return;
    }
    setError(null);
    setState("sending");
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    if (error && error.code !== "user_not_found") {
      setState("error");
      setError(authErrorMessage(error, "sign-in"));
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div role="status">
        <p className="font-medium">Check your email.</p>
        <p className="mt-1 text-muted-foreground">
          If there&apos;s an account for {email.trim()}, we sent a link to reset the password. It can take a minute to arrive,
          so check spam too.
        </p>
        <Link href="/sign-in" className="mt-5 inline-flex font-medium text-brand underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "reset-error" : undefined}
          className={fieldClass}
        />
      </div>
      {error && (
        <p id="reset-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className={primaryButton}>
        {state === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Send reset link
      </button>
      <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        Back to sign in
      </Link>
    </form>
  );
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords don't match." });

/** Set a new password for the signed-in user (after a reset link, or from the account page). */
export function NewPasswordForm({ afterSave }: { afterSave: "browse" | "stay" }) {
  const router = useRouter();
  const { userId, ready } = useSession();
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });

  if (ready && !userId) {
    return (
      <div>
        <p className="font-medium">This reset link expired or was already used.</p>
        <Link href="/forgot-password" className="mt-3 inline-flex font-medium text-brand underline-offset-4 hover:underline">
          Send a new link
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (v) => {
        setServerError(null);
        const { error } = await createClient().auth.updateUser({ password: v.password });
        if (error) {
          setServerError(
            error.code === "same_password" ? "Choose a password you haven't used here before." : authErrorMessage(error, "sign-up"),
          );
          return;
        }
        reset();
        if (afterSave === "browse") {
          router.replace("/");
        } else {
          setDone(true);
        }
      })}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="text-sm font-medium">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          className={fieldClass}
          {...register("password", { onChange: () => setDone(false) })}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirm}
          className={fieldClass}
          {...register("confirm")}
        />
        {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm text-accent-foreground">
          Password updated.
        </p>
      )}
      <button type="submit" disabled={isSubmitting || !ready} className={`${primaryButton} w-fit`}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {afterSave === "browse" ? "Save and continue" : "Update password"}
      </button>
    </form>
  );
}
