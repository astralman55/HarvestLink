/**
 * Questions and answers shown on /faq, in the homepage teaser, and as
 * FAQPage JSON-LD. Plain text only (no markdown) so the same string can be
 * used as the visible answer and the structured-data answer.
 *
 * These describe how the site actually works today: BWG is a
 * listing and messaging service. It does not charge fees on transactions,
 * process payments, or handle shipping; buyers and sellers agree terms
 * directly. Keep answers in line with the Terms of Service.
 */
export interface FaqItem {
  q: string;
  a: string;
  /** Show in the short homepage teaser. */
  featured?: boolean;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What is bulkwinegrapes.com?",
    a: "bulkwinegrapes.com (BWG) is an online marketplace where wine grape growers, wineries, and wine brands buy and sell wine grapes by the ton and bulk wine by the gallon, directly with each other. Sellers can list openly or confidentially under NDA. Buyers search by variety, vintage, region, farming practice, price, and more, then contact sellers through the site.",
    featured: true,
  },
  {
    q: "What is bulk wine?",
    a: "Bulk wine is wine sold by volume, usually in gallons, before it is bottled. It is stored in tanks, barrels, or totes and sold to wineries and brands that blend it, age it further, or bottle it under their own label.",
    featured: true,
  },
  {
    q: "How is bulk wine priced?",
    a: "Bulk wine is priced per gallon. Each BWG bulk wine listing shows the price per gallon and the total lot value calculated from the quantity. The price depends on varietal, vintage, appellation, quality, farming practice, and market conditions.",
    featured: true,
  },
  {
    q: "How are wine grapes priced?",
    a: "Wine grapes are priced per ton. The price depends on variety, region or appellation, quality, farming practice, contract terms, and market conditions. Each BWG grape listing shows the price per ton, the estimated tonnage, and details such as the brix target and harvest year.",
  },
  {
    q: "Does BWG charge fees?",
    a: "BWG does not currently charge fees to browse, list, or contact sellers, and it does not take a commission on sales. Buyers and sellers agree on price and terms directly with each other.",
    featured: true,
  },
  {
    q: "How do payment and delivery work?",
    a: "Payment, delivery, samples, and paperwork are arranged privately between the buyer and the seller. BWG does not process payments, hold funds, or handle shipping, and it is not a party to any sale. Buyers should confirm the details in writing with the seller.",
    featured: true,
  },
  {
    q: "How do I contact a seller?",
    a: "Create a free account, open a listing, and send an inquiry. Your message is delivered to the seller through BWG, replies come back through the site, and each side gets an email when there is a new message. Sellers on confidential listings stay anonymous until they choose to share more.",
  },
  {
    q: "What does selling under NDA mean?",
    a: "When a seller lists under NDA, their name, winery, vineyard, and contact details are hidden on the listing, and location is shown only at the level of detail the seller chose. Buyers still see the details that matter, such as variety or varietal, vintage, quantity, price, ABV, and farming practice. NDA is a confidentiality setting on the listing. It is not by itself a legal agreement between the parties.",
    featured: true,
  },
  {
    q: "Can buyers see who the seller is on a confidential listing?",
    a: "No. The seller's identity is hidden from buyers and from search engines. Buyers contact the seller through BWG, and the seller decides whether and when to reveal who they are.",
  },
  {
    q: "Who can buy bulk wine?",
    a: "Bulk wine is generally a trade product. In the United States it typically moves between licensed wine businesses under federal (TTB) and state rules. Confirm which permits and requirements apply to you before you buy. BWG does not provide legal advice.",
  },
  {
    q: "Can I buy grapes or wine for home winemaking?",
    a: "Most BWG lots are commercial quantities, measured in tons of grapes or gallons of wine. Each seller sets their own minimums, so ask the seller before assuming a smaller purchase is possible.",
  },
  {
    q: "How do email alerts work?",
    a: "Set your filters on the Grapes or Bulk Wine page, choose Save this search, and BWG emails you a daily digest when new listings match. You can pause or delete a saved search at any time, and every email has a one-click unsubscribe link. Alerts never reveal the identity of a confidential seller.",
  },
  {
    q: "How do I list grapes or bulk wine for sale?",
    a: "Create an account, choose Sell, and pick Wine Grapes or Bulk Wine. Enter the details buyers look for, decide whether to list openly or under NDA, and publish. You can edit or archive the listing at any time.",
  },
  {
    q: "Are farming practices and certifications verified?",
    a: "Farming practices such as organic, biodynamic, natural, sustainable, regenerative organic, and Demeter certified biodynamic are declared by the seller. Buyers should ask for certification documents before relying on a label.",
  },
  {
    q: "Does BWG guarantee quality or provide samples and lab analysis?",
    a: "No. BWG lists what sellers submit. Request samples, lab analysis (such as ABV and total sulfites), and any documentation directly from the seller before you agree to buy.",
  },
];
