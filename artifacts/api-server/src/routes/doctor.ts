import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { doctorsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { UpdateMeBody } from "@workspace/api-zod";
import { requireDoctor, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/me", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const rows = await db
    .select()
    .from(doctorsTable)
    .where(eq(doctorsTable.id, doctorId))
    .limit(1);
  const d = rows[0];
  if (!d) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: d.id,
    email: d.email,
    name: d.name,
    clinicName: d.clinicName,
    phone: d.phone,
    address: d.address,
  });
});

router.put("/me", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const updated = await db
    .update(doctorsTable)
    .set({
      name: parsed.data.name,
      clinicName: parsed.data.clinicName,
      phone: parsed.data.phone,
      address: parsed.data.address,
    })
    .where(eq(doctorsTable.id, doctorId))
    .returning();
  const d = updated[0];
  if (!d) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: d.id,
    email: d.email,
    name: d.name,
    clinicName: d.clinicName,
    phone: d.phone,
    address: d.address,
  });
});

export default router;
