import { Bell, CalendarRange, LayoutDashboard, Megaphone, MessageCircle, Package, PlusCircle, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { flags } from "@/lib/flags";

export interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

/** The member area's own pages. */
export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/listings/mine", label: "My Listings", icon: Package },
  { href: "/sell", label: "Create Listing", icon: PlusCircle },
  ...(flags.wanted ? [{ href: "/requests", label: "My Requests", icon: Megaphone }] : []),
  { href: "/planning", label: "Crop Planning", icon: CalendarRange },
  { href: "/inquiries", label: "Inquiries", icon: MessageCircle },
  { href: "/alerts", label: "Email Alerts", icon: Bell },
  { href: "/security", label: "Security", icon: ShieldCheck },
];

/** Public site links, so a member is never stranded inside the dashboard. */
export function siteLinks(): NavItem[] {
  return [
    { href: "/", label: "Home" },
    { href: "/grapes", label: "Browse Grapes" },
    ...(flags.bulkWine ? [{ href: "/bulk-wine", label: "Browse Bulk Wine" }] : []),
    ...(flags.wanted ? [{ href: "/wanted", label: "Wanted" }] : []),
    { href: "/regions", label: "Regions" },
    { href: "/varieties", label: "Varieties" },
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
  ];
}
