"use client";

import Link from "next/link";

export default function CapexScenarioPage() {
  return (
    <>
      <section className="hero">
        <p className="badge">Scenario</p>
        <h1 className="hero__title">Capex Example: Production Line Upgrade</h1>
        <p className="hero__lead">
          A manufacturing line is upgraded with new equipment, automation controls,
          and facility improvements that increase capacity and extend expected useful life.
        </p>
      </section>

      <section className="card">
        <h3 className="card__title">Scenario details</h3>
        <ul className="card__subtitle">
          <li>Capital project replaces legacy equipment and installs new robotics.</li>
          <li>Line output increases by 30% and defect rates drop materially.</li>
          <li>Useful life is extended by five years due to core system replacement.</li>
          <li>Work spans multiple quarters with progress billings.</li>
        </ul>
      </section>

      <section className="card">
        <h3 className="card__title">Why this is Capex</h3>
        <ul className="card__subtitle">
          <li>Creates measurable future economic benefit beyond the current period.</li>
          <li>Improves capacity, efficiency, and useful life of the asset base.</li>
          <li>Meets capitalization thresholds and policy criteria for PP&E.</li>
          <li>Costs are directly attributable to bringing the asset to use.</li>
        </ul>
      </section>

      <section className="card">
        <h3 className="card__title">GAAP justification</h3>
        <ul className="card__subtitle">
          <li>ASC 360: capitalization required for improvements that extend useful life.</li>
          <li>Capitalized costs are depreciated over the revised useful life.</li>
          <li>Construction-in-progress is accumulated until placed in service.</li>
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
              <div className="tchart__label">Fixed Assets / CIP</div>
              <div className="tchart__meta">Capitalize and depreciate</div>
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
