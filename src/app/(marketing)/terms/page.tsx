import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use BWG to list, browse, or buy wine grapes and bulk wine.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="September 2026">
      <p>
        These terms apply to your use of bulkwinegrapes.com (the &quot;Site&quot; or &quot;BWG&quot;), a marketplace where growers and winemakers
        list wine grapes and bulk wine, and buyers find and contact them. By creating an account or using the Site you
        agree to them. If you don&apos;t agree, please don&apos;t use the Site.
      </p>

      <h2>1. What BWG is, and isn&apos;t</h2>
      <p>
        BWG helps buyers and sellers find each other. We are not a party to any sale. We don&apos;t set prices or
        terms, process payments, inspect fruit or wine, arrange shipping, or guarantee that a listing is accurate or that
        a deal will happen. Any agreement is between the buyer and the seller, and you are responsible for doing your own
        due diligence before you commit to one.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>The Site is for business and professional use. You must be at least 18 and able to enter a binding agreement.</li>
        <li>Give accurate information and keep it up to date. Keep your password secure; you&apos;re responsible for activity on your account.</li>
        <li>Your username is public. Don&apos;t choose one that impersonates someone else or is offensive.</li>
        <li>We may suspend or close accounts that break these terms or put other users at risk.</li>
      </ul>

      <h2>3. Listings and licensing</h2>
      <ul>
        <li>Only list what you actually have, and have the right to sell. Keep quantities, prices, and status current.</li>
        <li>
          Selling wine is regulated. You are solely responsible for holding any licenses or permits that apply to what
          you sell or buy (for example federal TTB permits and state alcohol licensing) and for following the laws that
          apply to the transaction.
        </li>
        <li>
          Farming practices and certifications are declared by the seller and aren&apos;t verified by us. Buyers should
          ask for documentation.
        </li>
        <li>We may remove or edit listings that are inaccurate, unlawful, or otherwise break these terms.</li>
      </ul>

      <h2>4. Confidential (NDA) listings</h2>
      <p>
        Sellers can choose to list confidentially. When they do, the Site hides their name, business, username, vineyard,
        winemaker, contact details, and (depending on the seller&apos;s choice) exact location from other visitors, and
        buyers contact them through the Site&apos;s messaging instead.
      </p>
      <ul>
        <li>
          This is a privacy feature of the Site, not a legal contract between buyer and seller, and we don&apos;t make
          buyers sign a non-disclosure agreement. If you need one, agree it directly with the other party.
        </li>
        <li>
          We work to keep confidential details private, but we can&apos;t promise it in every circumstance. What you
          write in a description, a message, or a photo can identify you, and it&apos;s your responsibility to avoid
          that.
        </li>
        <li>
          Our administrators can see a confidential seller&apos;s identity when needed to run the Site, keep users safe,
          or comply with the law. Those views are logged.
        </li>
        <li>
          Don&apos;t try to work out who a confidential seller is, and don&apos;t use anything you learn about one to
          contact or solicit them outside the Site.
        </li>
      </ul>

      <h2>5. Messaging</h2>
      <p>
        The Site&apos;s inquiry messages are for genuine business inquiries about a listing. Don&apos;t send spam,
        harassment, or anything unlawful. We store messages so both participants can read them and so we can investigate
        abuse.
      </p>

      <h2>6. What you can&apos;t do</h2>
      <ul>
        <li>Post false, misleading, or fraudulent listings or messages.</li>
        <li>Scrape or bulk-collect data from the Site, or try to defeat its confidentiality protections or rate limits.</li>
        <li>Interfere with the Site or its security, or access accounts or data that aren&apos;t yours.</li>
        <li>Use the Site to break the law, or to sell anything unlawful.</li>
      </ul>

      <h2>7. Fees</h2>
      <p>
        BWG is currently free to use. If we introduce fees we&apos;ll tell you before they apply to you.
      </p>

      <h2>8. Your content</h2>
      <p>
        You keep ownership of what you post. You give us a non-exclusive license to host, display, and distribute it on and
        through the Site as needed to run the service (for example showing your listing to buyers and including it in
        search results). You promise that you have the right to post it.
      </p>

      <h2>9. No warranty</h2>
      <p>
        The Site is provided &quot;as is&quot; and &quot;as available.&quot; We don&apos;t promise it will be
        uninterrupted, error-free, or that listings, users, or outcomes will meet your expectations. To the fullest extent
        the law allows, we disclaim all warranties, express or implied.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the fullest extent the law allows, BWG and the people behind it aren&apos;t liable for indirect,
        incidental, special, or consequential damages, or for lost profits or data, arising from your use of the Site or
        from any transaction or dispute between users. Our total liability for any claim relating to the Site is limited
        to the greater of the amount you paid us in the past 12 months or $100.
      </p>

      <h2>11. Indemnity</h2>
      <p>
        You agree to cover us for claims and costs that arise from your listings, your messages, your transactions with
        other users, or your breach of these terms or of the law.
      </p>

      <h2>12. Ending your account</h2>
      <p>
        You can stop using the Site at any time and ask us to close your account. We may suspend or end access if these
        terms are broken. Sections that by their nature should survive, such as 9 through 11, will.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update these terms. When we make a material change we&apos;ll update the date at the top, and continuing
        to use the Site afterward means you accept the updated terms. How we handle personal information is described in
        our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
