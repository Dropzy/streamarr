import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { prisma } from "@streamarr/database";

const scryptAsync = promisify(scrypt);
const passwordKeyLength = 64;

export type InstanceRole = "instance_admin" | "standard_user";
export type WorkspaceRole = "owner" | "administrator" | "editor" | "viewer";

export type Principal = {
  userId: string;
  instanceRole: InstanceRole;
  workspaces: Record<string, WorkspaceRole>;
};

const workspaceRank: Record<WorkspaceRole, number> = {
  viewer: 1,
  editor: 2,
  administrator: 3,
  owner: 4,
};

export function canAccessInstanceAdmin(principal: Principal): boolean {
  return principal.instanceRole === "instance_admin";
}

export function canReadWorkspace(
  principal: Principal,
  workspaceId: string,
): boolean {
  return (
    principal.workspaces[workspaceId] !== undefined ||
    canAccessInstanceAdmin(principal)
  );
}

export function canEditOverlay(
  principal: Principal,
  workspaceId: string,
): boolean {
  const role = principal.workspaces[workspaceId];
  return (
    canAccessInstanceAdmin(principal) ||
    (role !== undefined && workspaceRank[role] >= workspaceRank.editor)
  );
}

export function canPublishOverlay(
  principal: Principal,
  workspaceId: string,
): boolean {
  const role = principal.workspaces[workspaceId];
  return (
    canAccessInstanceAdmin(principal) ||
    role === "owner" ||
    role === "administrator"
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scryptAsync(
    password,
    salt,
    passwordKeyLength,
  )) as Buffer;

  return `scrypt:${salt}:${derived.toString("base64url")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, salt, encodedHash] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !encodedHash) {
    return false;
  }

  const expected = Buffer.from(encodedHash, "base64url");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function createPasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createUserSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string) {
  return prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              workspace: true,
            },
          },
        },
      },
    },
  });
}

export async function revokeSessionToken(token: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
