import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What HarvestLink collects, why, who else handles it, and how confidential (NDA) listings are protected.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p>
        This explains what personal information HarvestLink (the &quot;Site&quot;) collects, what we do with it, and who
        else handles it. It goes with our <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your email, password, username, name and/or company name, whether you&apos;re
          a grower or a buyer, and your region. Buyers also give an address. You can add a phone number.
        </li>
        <li>
          <strong>Listings:</strong> everything you enter on a listing, including its description and, if you choose to,
          a vineyard name and winemaker.
        </li>
        <li>
          <strong>Messages:</strong> the inquiries you send and receive about listings.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address, which we use briefly to limit abuse such as repeated login or
          signup attempts, and standard server logs kept by our hosting provider.
        </li>
        <li>
          <strong>Cookies:</strong> only the ones needed to keep you signed in. We don&apos;t use advertising or
          analytics trackers.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run the Site: create your account, show listings, and let buyers and sellers message each other.</li>
        <li>To email you: confirming your account and telling you when you have a new message.</li>
        <li>To keep the Site secure and prevent abuse, and to meet legal obligations.</li>
      </ul>
      <p>We don&apos;t sell your personal information, and we don&apos;t use it for advertising.</p>

      <h2>Confidential (NDA) listings</h2>
      <p>
        When a seller lists confidentially, their name, business, username, vineyard, winemaker, and contact details are
        hidden from other visitors, and the listing is shown with a reference number instead. The seller can still see
        it as their own, and our administrators can see who a confidential seller is when needed to run the Site or
        respond to a legal request; each of those views is logged. Buyers never see a confidential seller&apos;s email
        address: messages are relayed through the Site.
      </p>

      <h2>What other users see</h2>
      <ul>
        <li>
          On a listing that isn&apos;t confidential, buyers see the seller&apos;s company name and region, and the
          listing&apos;s details, including any vineyard or winemaker the seller entered.
        </li>
        <li>Your username may be shown to other members.</li>
        <li>The people in a message thread can read that thread.</li>
      </ul>

      <h2>Who else handles your data</h2>
      <p>We rely on a few service providers, who only receive what they need to do their job:</p>
      <ul>
        <li>
          <strong>Supabase</strong> stores our database and handles sign-in.
        </li>
        <li>
          <strong>Vercel</strong> hosts the Site.
        </li>
        <li>
          <strong>Resend</strong> sends our emails (account confirmation and new-message notifications).
        </li>
        <li>
          <strong>Google Maps Platform or OpenStreetMap</strong> suggest addresses as you type in the address field, so
          what you type there is sent to one of them.
        </li>
        <li>
          <strong>Have I Been Pwned</strong> checks whether a new password has appeared in a known breach. Only the first
          five characters of a one-way hash of the password are sent, never the password itself.
        </li>
      </ul>
      <p>We may also disclose information if the law requires it, or to protect the safety of users or the Site.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep your information while your account is open. When you ask us to delete your account we remove your
        profile and listings, though we may keep limited records where the law requires it or where we need them to
        prevent abuse.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are handled by our sign-in provider and never stored in plain text. Data is sent over HTTPS, and access
        to it is limited by database rules. No online service is completely secure, so we can&apos;t guarantee absolute
        security.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us to show, correct, or delete the personal information we hold about you. If you live in California
        or another place with privacy laws, you may have additional rights, and we won&apos;t treat you differently for
        using them. To make a request, use the contact details below.
      </p>

      <h2>Children</h2>
      <p>The Site is for business use by adults and isn&apos;t directed at anyone under 18.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy in a meaningful way we&apos;ll update the date at the top. Continuing to use the Site
        afterward means you accept the updated policy.
      </p>
    </LegalPage>
  );
}
