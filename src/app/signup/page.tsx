import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { Disclaimer } from "@/components/ui";

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <main id="main" className="mx-auto w-full max-w-sm px-5 py-14">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">
        Your food and training data is private to your account.
      </p>
      <div className="mt-6">
        <AuthForm mode="signup" />
      </div>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-brand underline">
          Sign in
        </Link>
      </p>
      <div className="mt-8">
        <Disclaimer />
      </div>
    </main>
  );
}
