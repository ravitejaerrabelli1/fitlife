import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  if (await getSessionUser()) redirect("/dashboard");
  const { reset } = await searchParams;

  return (
    <main id="main" className="mx-auto w-full max-w-sm px-5 py-14">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to continue.</p>
      {reset ? (
        <p className="mt-3 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand">
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      <div className="mt-6">
        <AuthForm mode="signin" />
      </div>
      <p className="mt-4 text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="font-medium text-brand underline">
          Create one
        </Link>
        {" · "}
        <Link href="/reset" className="font-medium text-brand underline">
          Forgot password
        </Link>
      </p>
    </main>
  );
}
