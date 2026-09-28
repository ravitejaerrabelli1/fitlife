import { CompleteResetForm } from "@/components/reset-forms";

export default async function ResetTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main id="main" className="mx-auto w-full max-w-sm px-5 py-14">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <div className="mt-6">
        <CompleteResetForm token={token} />
      </div>
    </main>
  );
}
