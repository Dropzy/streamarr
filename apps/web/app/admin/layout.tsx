import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "INSTANCE_ADMIN") {
    redirect("/app");
  }

  return children;
}
