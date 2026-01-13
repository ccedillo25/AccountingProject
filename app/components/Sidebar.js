"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Guide Overview" },
  { href: "/modules/content", label: "Content Licensing" },
  { href: "/modules/opex-capex", label: "Spend Classification" },
  { href: "/modules/Expense-Concepts", label: "Accounting Ops" }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__title">Interactive Accounting Guide</div>
        <div className="sidebar__subtitle">
          Practical, auditable models for content, inventory, and policy judgment.
        </div>
      </div>
      <nav className="sidebar__nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link${pathname === link.href ? " active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="card__note">
        Use the modules to calculate schedules, journal entries, and downloadable logic.
      </div>
    </aside>
  );
}
