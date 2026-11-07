/**
 * Reset links carry the token in the URL fragment (`/reset#<token>`). Browsers never send
 * fragments to the server, so the token stays out of server, proxy and hosting access logs.
 */
export function resetLinkPath(token: string): string {
  return `/reset#${token}`;
}

export function tokenFromHash(hash: string): string {
  const token = hash.replace(/^#/, "");
  return /^[A-Za-z0-9-]{20,128}$/.test(token) ? token : "";
}
