/**
 * When `ALLOWED_SIGNUP_EMAILS` is set (comma-separated), only those emails can create
 * accounts. Used to keep staging or an early launch private. Unset means open sign-up.
 */
export function isSignupAllowed(email: string, allowList = process.env.ALLOWED_SIGNUP_EMAILS): boolean {
  const allowed = (allowList ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.length === 0 || allowed.includes(email.trim().toLowerCase());
}
