import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return children;
}
