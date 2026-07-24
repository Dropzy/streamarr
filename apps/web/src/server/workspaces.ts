import { redirect } from "next/navigation";

import { getCurrentSession } from "@/server/auth";

export async function getCurrentWorkspaceContext() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  const membership = session.user.memberships[0];

  if (!membership) {
    throw new Error("Authenticated user has no workspace membership.");
  }

  return {
    user: session.user,
    workspace: membership.workspace,
    role: membership.role,
  };
}
