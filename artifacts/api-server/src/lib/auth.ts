import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { doctorsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface AuthedRequest extends Request {
  doctorId: string;
}

export async function requireDoctor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = auth.userId;
  const existing = await db
    .select()
    .from(doctorsTable)
    .where(eq(doctorsTable.id, userId))
    .limit(1);

  if (existing.length === 0) {
    let email = "";
    let name = "";
    try {
      const user = await clerkClient.users.getUser(userId);
      email = user.primaryEmailAddress?.emailAddress ?? "";
      name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    } catch {
      // best effort
    }
    await db
      .insert(doctorsTable)
      .values({ id: userId, email, name })
      .onConflictDoNothing();
  }

  (req as AuthedRequest).doctorId = userId;
  next();
}
