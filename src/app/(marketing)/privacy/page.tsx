import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What BWG collects, why, who else handles it, and how confidential (NDA) listings are protected.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p>
        This explains what personal information bulkwinegrapes.com (the &quot;Site&quot; or &quot;BWG&quot;) collects, what we do with it, and who
        else handles it. It goes with our <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your email, password, username, name and/or company name, whether you&apos;re
          a grower or a buyer, and your region. You can add a phone number. We don&apos;t ask for a street address when you sign up.
        </li>
        <li>
          <strong>Listings:</strong> everything you enter on a listing, including its description and, if you choose to,
          a vineyard name and winemaker.
        </li>
        <li>
          <strong>Messages:</strong> the inquiries you send and receive about listings.
        </li>
        <li>
          <strong>Saved searches:</strong> the filters you choose to save for email alerts, and whether each alert is on or off.
        </li>
        <li>
          <strong>Sign-in activity:</strong> each time you sign in we record the date, an approximate location (country, region
          and city, estimated from your IP address by our hosting provider), a shortened network address (for example the first
          three parts of an IPv4 address, never the full address), and your browser and device type, such as &quot;Chrome on
          Windows&quot;. It is shown to you on your Security page, is used to protect your account, and is deleted after 180 days.
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
        <li>
          To email you: confirming your account, resetting your password, telling you when you have a new message, and, only if you
          save a search, a daily digest of new listings that match it. Every alert email has a link to stop it, and you can pause
          or delete alerts any time. Alerts never reveal a confidential seller.
        </li>
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
          <strong>Resend</strong> sends our emails (account confirmation, password resets, new-message notifications, and saved-search alerts).
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
