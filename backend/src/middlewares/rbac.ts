import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db, usersTable, type User } from "../db";

export async function getAuthUser(req: Request): Promise<User | null> {
  if (!req.auth) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth.userId));
  return user ?? null;
}

export async function requireAuthUser(req: Request, res: Response): Promise<User | null> {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

export function isAdmin(user: User): boolean {
  return user.role === "admin";
}

export function isClient(user: User): boolean {
  return user.role === "client";
}

export function isSetter(user: User): boolean {
  return user.role === "setter";
}

export function isCloser(user: User): boolean {
  return user.role === "closer";
}

/** Admin + client roles may access agency-wide dashboard and client campaign data. */
export function canViewAgencyData(user: User): boolean {
  return user.role === "admin" || user.role === "client";
}

export async function assertClientAccess(req: Request, res: Response, clientId: number): Promise<boolean> {
  const user = await requireAuthUser(req, res);
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isClient(user) && user.clientId === clientId) return true;
  res.status(403).json({ error: "Forbidden" });
  return false;
}

/** Returns setterId filter: setters always get own id; admin may pass query param or see all. */
export function resolveSetterScope(user: User, querySetterId?: number): number | "all" | "forbidden" {
  if (isSetter(user)) return user.id;
  if (isAdmin(user)) return querySetterId ?? "all";
  return "forbidden";
}

export function resolveCloserScope(user: User, queryCloserId?: number): number | "all" | "forbidden" {
  if (isCloser(user)) return user.id;
  if (isAdmin(user)) return queryCloserId ?? "all";
  return "forbidden";
}

/** Client users are scoped to their linked clientId; admin sees all. */
export function resolveClientScope(user: User, queryClientId?: number): number | "all" | "forbidden" {
  if (isAdmin(user)) return queryClientId ?? "all";
  if (isClient(user)) return user.clientId ?? "forbidden";
  return "forbidden";
}
