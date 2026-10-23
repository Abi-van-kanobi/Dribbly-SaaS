"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSession, requireWorkspace } from "@/lib/session";
import { deleteAccount } from "@/lib/gdpr";
import { getStorage, isStorageConfigured } from "@/lib/storage";

/** Right to erasure: permanently deletes the account and everything in its workspace. */
export async function deleteAccountAction(formData: FormData) {
  const { user, workspace } = await requireWorkspace();

  // The demo workspace is shared sample data, not a person's account.
  if (workspace.isDemo) redirect("/app/settings?error=demo");
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") redirect("/app/settings?error=confirm");

  // Files too: if storage is not configured there can be no uploaded files to remove.
  await deleteAccount(prisma, user.id, isStorageConfigured() ? getStorage() : null);
  await clearSession();
  redirect("/?deleted=1");
}
