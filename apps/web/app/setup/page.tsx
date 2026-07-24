import { redirect } from "next/navigation";
import { prisma } from "@streamarr/database";

import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const existingUsers = await prisma.user.count();

  if (existingUsers > 0) {
    redirect("/sign-in");
  }

  return (
    <main className="content">
      <div className="topline">
        <div>
          <p className="muted">Installation</p>
          <h1>Create the first administrator</h1>
        </div>
      </div>
      <SetupForm initialError={error ?? null} />
    </main>
  );
}
