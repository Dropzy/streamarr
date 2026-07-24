import { getCurrentSession } from "@/server/auth";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      workspaces: session.user.memberships.map((membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: membership.role,
      })),
    },
  });
}
