import type { AuthError } from "@supabase/supabase-js";

/** Turn Supabase auth errors into messages that say what happened and what to do. */
export function authErrorMessage(error: AuthError, mode: "sign-in" | "sign-up"): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match. Check them, or create an account if you're new.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Sign in instead.";
    case "weak_password":
      return "Choose a stronger password: at least 8 characters, ideally with a number or symbol.";
    case "email_address_invalid":
      return "That email address doesn't look right. Check it for typos.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    case "email_not_confirmed":
      return "Confirm your email first. Check your inbox for the link.";
    case "signup_disabled":
      return "New sign-ups are paused right now. Try again later.";
    case "provider_disabled":
      return "That sign-in method isn't turned on yet.";
  }

  // Network failures, misconfiguration, and server errors: never show raw text.
  if (!error.status || error.status >= 500 || error.status === 404) {
    return "We couldn't reach the sign-in service. Check your connection and try again in a moment.";
  }
  return mode === "sign-in"
    ? "Sign-in didn't work. Check your email and password and try again."
    : "We couldn't create your account. Check your details and try again.";
}
