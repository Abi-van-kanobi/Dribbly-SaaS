"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, setSession } from "@/lib/session";
import { TERMS_VERSION } from "@/lib/legal";
import { currencyForCountry, isCountryCode, isLaunchCurrency, isValidTimeZone } from "@/lib/locale";

/**
 * The only place a new account and workspace are created. Reached only after Google has proven
 * who the person is; creates everything in one transaction, and only if the Terms box is ticked.
 */
export async function completeOnboardingAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.kind === "user") redirect("/app");

  if (formData.get("agree") !== "on") redirect("/onboarding?error=terms");

  const type = formData.get("type");
  if (type !== "MANAGER_AGENCY" && type !== "INDIVIDUAL_CREATOR") redirect("/onboarding?error=type");

  // Detected in the browser, then re-checked here. Never trusted as sent.
  const timezoneRaw = String(formData.get("timezone") ?? "");
  const countryRaw = String(formData.get("country") ?? "").toUpperCase();
  const timezone = isValidTimeZone(timezoneRaw) ? timezoneRaw : "UTC";
  const country = isCountryCode(countryRaw) ? countryRaw : null;
  const currency = currencyForCountry(country);
  if (!isLaunchCurrency(currency)) redirect("/onboarding?error=type");

  const displayName = session.name?.trim() || session.email.split("@")[0];
  const firstName = displayName.split(" ")[0];
  const handle = `@${session.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "") || "creator"}`;

  let result: { uid: string; wid: string } | null = null;
  let emailTaken = false;

  try {
    result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: session.email,
          name: displayName,
          googleSub: session.sub,
          termsAcceptedAt: new Date(),
          termsVersion: TERMS_VERSION,
          lastLoginAt: new Date(),
        },
      });
      const workspace = await tx.workspace.create({
        data: { name: `${firstName}'s workspace`, type, currency, timezone, country },
      });
      await tx.membership.create({ data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" } });

      // A solo creator manages exactly one creator: themselves.
      if (type === "INDIVIDUAL_CREATOR") {
        await tx.creator.create({
          data: { name: displayName, handle, category: "General", isSelf: true, workspaceId: workspace.id },
        });
      }
      return { uid: user.id, wid: workspace.id };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") emailTaken = true;
    else throw e;
  }

  if (emailTaken || !result) redirect("/login?error=email-in-use");

  await setSession({ kind: "user", uid: result.uid, wid: result.wid });
  redirect("/app");
}
