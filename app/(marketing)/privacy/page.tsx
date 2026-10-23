import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/marketing/LegalPage";
import { BRAND_NAME, COMPANY_ADDRESS, COMPANY_NAME, PRIVACY_EMAIL, RETENTION_AFTER_DELETE } from "@/lib/legal";

export const metadata: Metadata = { title: `Privacy Policy · ${BRAND_NAME}` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <Section title="Who we are">
        <p>
          {BRAND_NAME} is operated by {COMPANY_NAME}, {COMPANY_ADDRESS} (&quot;we&quot;, &quot;us&quot;). We are the
          controller of the personal data described here. Contact us about privacy at {PRIVACY_EMAIL}.
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          <b>Account data.</b> When you sign in with Google we receive your name, email address and a Google
          account identifier. We do not store your Google profile picture, and we request no access to your Gmail,
          contacts or Drive.
        </p>
        <p>
          <b>Workspace choices.</b> The type of workspace you pick, plus a time zone and country detected from your
          browser, used to choose a default currency and format dates.
        </p>
        <p>
          <b>Content you add.</b> Creators, brands, campaigns, deliverables, invoices, tasks, notes and contacts you
          enter. This can include other people&apos;s names, contact details and rates. You are responsible for
          having a proper basis to enter them.
        </p>
        <p>
          <b>Files and links you add to the Work Aligner.</b> Uploaded images and PDFs, pasted links (for example
          to Notion or Google Docs) and typed notes. Screenshots and photos can contain other people&apos;s personal
          data, such as names and phone numbers in a chat. Only add what you have the right to add. We store these
          files privately for your workspace and do not read, scan or analyse their contents. Links are stored as
          links: we do not open them or copy the page behind them.
        </p>
        <p>
          <b>Consent record.</b> The date and version of the Terms and Privacy Policy you accepted.
        </p>
        <p>
          <b>Technical data.</b> A sign-in cookie, and standard server logs (IP address, browser type, request time)
          kept by our hosting provider for security and reliability.
        </p>
        <p>
          We do not process payments. Invoices in {BRAND_NAME} are records you keep; no card or bank details are
          collected or stored.
        </p>
      </Section>

      <Section title="Why we use it, and our legal basis">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>To create your account and provide the service: performance of a contract.</li>
          <li>To keep the service secure and prevent abuse: our legitimate interests.</li>
          <li>To record that you accepted our Terms and Privacy Policy: your consent, and our legal obligation to evidence it.</li>
          <li>To meet legal obligations such as responding to lawful requests.</li>
        </ul>
        <p>We do not sell personal data, and we do not use it for advertising or to train AI models.</p>
      </Section>

      <Section title="Who we share it with">
        <p>These providers process data on our behalf under their data processing terms:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Neon (database hosting). Region: [DATABASE REGION].</li>
          <li>Vercel (application hosting).</li>
          <li>Google (sign-in).</li>
          <li>Cloudflare, Inc. (R2 file storage, for files you upload). Region: [STORAGE REGION].</li>
        </ul>
        <p>We disclose data to authorities only when the law requires it.</p>
      </Section>

      <Section title="International transfers">
        <p>
          Some providers may process data outside your country, including outside the EEA or UK. Where they do, we
          rely on appropriate safeguards such as Standard Contractual Clauses.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          We use one cookie, a strictly necessary sign-in cookie that keeps you logged in. It is not used for tracking
          and does not require consent. If we later add analytics or marketing cookies we will ask first.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your data while your account is open. When you delete your account, your workspace and everything in
          it is permanently erased from our live systems immediately, and from backups within {RETENTION_AFTER_DELETE}.
          Server logs are kept for [LOG RETENTION PERIOD].
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live (including under the GDPR, UK GDPR and India&apos;s Digital Personal Data
          Protection Act) you can access, correct, port, restrict or erase your data, object to processing, and
          withdraw consent. You can do the two most common things yourself, any time, in{" "}
          <Link href="/app/settings" className="mkt-link">
            Settings
          </Link>
          :
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>Download my data: a JSON copy of everything in your workspace.</li>
          <li>Delete my account: permanent erasure of your account and workspace.</li>
        </ul>
        <p>
          For anything else, email {PRIVACY_EMAIL}. You may also complain to your data protection authority, such as
          the ICO in the UK, or the Data Protection Board of India.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data is encrypted in transit, workspaces are logically isolated from each other, and sign-in sessions are
          cryptographically signed and expire. No system is perfectly secure. If a breach affects your data we will
          notify you and regulators as the law requires.
        </p>
      </Section>

      <Section title="Children">
        <p>{BRAND_NAME} is for people 18 and over. We do not knowingly collect data from children.</p>
      </Section>

      <Section title="Changes">
        <p>
          If we make material changes we will update the date above and, where required, ask you to accept the new
          version.
        </p>
      </Section>
    </LegalPage>
  );
}
