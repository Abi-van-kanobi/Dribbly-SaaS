"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import type { ContactType } from "@prisma/client";

export async function createContact(formData: FormData) {
  const { db, workspace } = await requireWorkspace();

  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim() || undefined;
  const org = String(formData.get("org") || "").trim() || undefined;
  const email = String(formData.get("email") || "").trim() || undefined;
  const phone = String(formData.get("phone") || "").trim() || undefined;
  const type = (String(formData.get("type") || "BRAND") as ContactType);

  if (!name) return;

  await db.contact.create({ data: { name, role, org, email, phone, type, workspaceId: workspace.id } });

  revalidatePath("/app/contacts");
}
