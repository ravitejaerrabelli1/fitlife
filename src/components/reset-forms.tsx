"use client";

import { useActionState } from "react";
import {
  completePasswordResetAction,
  requestPasswordResetAction,
  type ActionResult,
} from "@/app/actions";
import { Button, Field, Input } from "./ui";

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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Working…" : "Update password"}
      </Button>
    </form>
  );
}
