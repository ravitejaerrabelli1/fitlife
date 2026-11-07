"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import {
  completePasswordResetAction,
  requestPasswordResetAction,
  type ActionResult,
} from "@/app/actions";
import { tokenFromHash } from "@/lib/reset-link";
import { Button, Field, Input } from "./ui";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** Shows the new-password form for `/reset#<token>` links, otherwise the request form. */
export function ResetPanel() {
  const hashToken = useSyncExternalStore(
    subscribeToHash,
    () => tokenFromHash(window.location.hash),
    () => "",
  );
  // Keep the token once seen, so in-page anchors like the skip link (#main) don't drop it.
  const [token, setToken] = useState("");
  if (hashToken && hashToken !== token) setToken(hashToken);
  if (token) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <div className="mt-6">
          <CompleteResetForm token={token} />
        </div>
      </>
    );
  }
  return (
    <>
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the email on your account and we will create a one-hour reset
        link. Your FitLife admin can send it to you.
      </p>
      <div className="mt-6">
        <RequestResetForm />
      </div>
    </>
  );
}

export function RequestResetForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    requestPasswordResetAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Email" htmlFor="reset-email">
        <Input id="reset-email" name="email" type="email" required />
      </Field>
      {state?.message ? (
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm break-words">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Working…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function CompleteResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    completePasswordResetAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label="New password" htmlFor="new-password" hint="At least 8 characters.">
        <Input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
      {state?.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.message ? (
        <p className="rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand" role="status">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending || Boolean(state?.ok)}>
        {pending ? "Working…" : "Update password"}
      </Button>
    </form>
  );
}
