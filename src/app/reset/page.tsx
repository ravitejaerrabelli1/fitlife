import { RequestResetForm } from "@/components/reset-forms";

export default function ResetPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-sm px-5 py-14">
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the email on your account and we will create a one-hour reset
        link. Your FitLife admin can send it to you.
      </p>
      <div className="mt-6">
        <RequestResetForm />
      </div>
    </main>
  );
}
