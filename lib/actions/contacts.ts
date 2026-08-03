"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ContactType } from "@prisma/client";

export async function createContact(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim() || undefined;
  const org = String(formData.get("org") || "").trim() || undefined;
  const email = String(formData.get("email") || "").trim() || undefined;
  const phone = String(formData.get("phone") || "").trim() || undefined;
  const type = (String(formData.get("type") || "BRAND") as ContactType);

  if (!name) return;

  await prisma.contact.create({ data: { name, role, org, email, phone, type } });

  revalidatePath("/app/contacts");
}
