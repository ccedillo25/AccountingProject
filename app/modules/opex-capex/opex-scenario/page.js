"use client";

import Link from "next/link";

export default function OpexScenarioPage() {
  return (
    <>
      <section className="hero">
        <p className="badge">Scenario</p>
        <h1 className="hero__title">Opex Example: Routine Device Repairs</h1>
        <p className="hero__lead">
          A batch of devices is returned from the field with performance issues. The
          operations team replaces worn batteries, swaps cracked screens, and installs
          a minor firmware patch to restore normal operating condition.
        </p>
      </section>

      <section className="card">
        <h3 className="card__title">Scenario details</h3>
        <ul className="card__subtitle">
          <li>1,200 devices repaired across three months during normal maintenance cycles.</li>
          <li>Parts and labor are billed monthly by an external vendor.</li>
          <li>The work does not extend useful life or add new capabilities.</li>
          <li>Product performance returns to original specifications.</li>
        </ul>
      </section>

      <section className="card">
        <h3 className="card__title">Why this is Opex</h3>
        <ul className="card__subtitle">
          <li>Costs are maintenance activities that keep assets in normal condition.</li>
          <li>No enhancement in capacity, output, or useful life is created.</li>
          <li>Benefits are consumed in the current period, matching service delivery.</li>
          <li>Repairs are recurring and expected under the operating model.</li>
        </ul>
      </section>

      <section className="card">
        <h3 className="card__title">GAAP justification</h3>
        <ul className="card__subtitle">
          <li>ASC 360: routine repairs and maintenance are expensed as incurred.</li>
          <li>ASC 340/720: costs without future economic benefit are period expenses.</li>
          <li>Capitalization requires a new asset or measurable improvement.</li>
        </ul>
      </section>

      <section className="card">
        <h3 className="card__title">Suggested accounting</h3>
        <div className="tchart">
          <div className="tchart__header">
            <div className="tchart__cell">Debit</div>
            <div className="tchart__cell">Credit</div>
          </div>
          <div className="tchart__row">
            <div className="tchart__entry">
              <div className="tchart__label">Repairs & Maintenance Expense</div>
              <div className="tchart__meta">Expense immediately</div>
            </div>
            <div className="tchart__entry">
              <div className="tchart__label">Accounts Payable / Cash</div>
              <div className="tchart__meta">Vendor invoice or payment</div>
            </div>
          </div>
        </div>
      </section>

      <Link className="tab" href="/modules/opex-capex">
        Back to Spend Classification
      </Link>
    </>
  );
}
