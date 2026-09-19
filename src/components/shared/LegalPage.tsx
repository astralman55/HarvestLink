import type { ReactNode } from "react";

/**
 * Shared layout for the Terms of Service and Privacy Policy. Plain prose
 * styling for h2/p/ul so each policy page can be written as ordinary JSX.
 *
 * Set NEXT_PUBLIC_CONTACT_EMAIL to show a contact address at the bottom of
 * each policy; with it unset the contact section is simply left out rather
 * than showing a placeholder.
 */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{title}</h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: {updated}</p>

      <div className="mt-8 space-y-4 text-stone-700 [&_a]:font-medium [&_a]:text-[var(--color-brand)] [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-stone-900 [&_li]:leading-relaxed [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}

        {contactEmail && (
          <>
            <h2>Contact</h2>
            <p>
              Questions about this page, or a request about your account or data? Email{" "}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
