import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/marketing/LegalPage";
import { BRAND_NAME, COMPANY_ADDRESS, COMPANY_NAME, GOVERNING_LAW, LIABILITY_CAP, PRIVACY_EMAIL } from "@/lib/legal";

export const metadata: Metadata = { title: `Terms of Use · ${BRAND_NAME}` };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <Section title="Agreement">
        <p>
          These Terms are between you and {COMPANY_NAME}, {COMPANY_ADDRESS} (&quot;we&quot;), and govern your use of{" "}
          {BRAND_NAME}. By creating an account you agree to them and to our{" "}
          <Link href="/privacy" className="mkt-link">
            Privacy Policy
          </Link>
          . If you use {BRAND_NAME} for an organisation, you confirm you can bind it.
        </p>
      </Section>

      <Section title="The service">
        <p>
          {BRAND_NAME} is a workspace for tracking creator campaigns, deliverables, contacts, notes and invoices. It
          is a record-keeping tool. It does not move money, process payments, provide legal, tax or accounting advice,
          or act as an agent for you or any creator or brand.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          You sign in with Google. Keep your Google account secure; you are responsible for activity under your
          account. You must be 18 or over and give accurate information.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You own what you put into {BRAND_NAME}. You give us the limited right to host and process it to provide the
          service to you. You confirm you have the right to enter it, including other people&apos;s personal data, and
          that doing so complies with the law that applies to you.
        </p>
      </Section>

      <Section title="Acceptable use">
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li>No unlawful, fraudulent or infringing use.</li>
          <li>No attempting to access other users&apos; data or to disrupt or reverse engineer the service.</li>
          <li>No automated scraping or excessive load.</li>
        </ul>
        <p>We may suspend accounts that break these rules.</p>
      </Section>

      <Section title="Ending your account">
        <p>
          You can export your data and permanently delete your account any time in{" "}
          <Link href="/app/settings" className="mkt-link">
            Settings
          </Link>
          . We may suspend or end access for breach of these Terms, giving notice where reasonable.
        </p>
      </Section>

      <Section title="Availability and changes">
        <p>
          We work to keep {BRAND_NAME} available but do not guarantee uninterrupted service. Features may change. We
          will give reasonable notice of material changes to these Terms and ask you to accept them where required.
        </p>
      </Section>

      <Section title="Disclaimers and liability">
        <p>
          The service is provided &quot;as is&quot;. To the extent the law allows, we are not liable for indirect or
          consequential loss, lost profits or lost data, and our total liability is limited to {LIABILITY_CAP}.
          Nothing limits liability that cannot be limited by law, including for fraud or death or personal injury
          caused by negligence.
        </p>
      </Section>

      <Section title="Governing law">
        <p>These Terms are governed by {GOVERNING_LAW}. Mandatory consumer protections in your country still apply.</p>
      </Section>

      <Section title="Contact">
        <p>Questions about these Terms: {PRIVACY_EMAIL}.</p>
      </Section>
    </LegalPage>
  );
}
