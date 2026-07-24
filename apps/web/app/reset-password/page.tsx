import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="content">
      <h1>Reset password</h1>
      <ResetPasswordForm token={token ?? ""} />
    </main>
  );
}
