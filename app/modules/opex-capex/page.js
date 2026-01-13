export default function OpexCapexPage() {
  return (
    <>
    <section className="hero">
        <p className="badge">Module 2</p>
        <h1 className="hero__title">Spend Classification</h1>
        <p className="hero__lead">
          Structure the decision on whether a cost is expensed immediately or capitalized
          as a long-lived asset. Use this checklist to document rationale and policy
          consistency.
        </p>
      </section>

      <section className="grid grid--two">
        <div className="card">
          <h2 className="card__title">Core Principle</h2>
          <p className="card__subtitle">
            Capitalize when the spend creates a future economic benefit beyond the
            current period. Expense when it maintains current condition or provides
            short-lived benefit.
          </p>
          <div className="badge-row">
            <span className="badge">Future Benefit</span>
            <span className="badge">Materiality</span>
            <span className="badge">Consistency</span>
          </div>
        </div>
        <div className="card">
          <h2 className="card__title">Policy Factors</h2>
          <ul className="card__subtitle">
            <li>Apply the same de minimis threshold across periods.</li>
            <li>Document why a spend qualifies as an improvement or extension.</li>
            <li>Align with procurement and FP&amp;A on the expected useful life.</li>
            <li>Attach support for large or judgment-heavy classifications.</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3 className="card__title">Decision Tree</h3>
        <div className="decision-tree">
          <div className="decision-tree__node">
            <div className="decision-tree__title">Step 1</div>
            Does the spend create a new asset or improve an existing one beyond current
            condition?
          </div>
          <div className="decision-tree__arrow">↓</div>
          <div className="decision-tree__row">
            <div className="decision-tree__node">
              <div className="decision-tree__title">Yes</div>
              Capitalize and amortize/depreciate over the useful life.
            </div>
            <div className="decision-tree__node">
              <div className="decision-tree__title">No</div>
              Expense as incurred in the period of benefit.
            </div>
          </div>
          <div className="decision-tree__arrow">↓</div>
          <div className="decision-tree__node">
            <div className="decision-tree__title">Borderline</div>
            Apply materiality thresholds, document the rationale, and align with policy.
          </div>
        </div>
      </section>

      <section className="grid grid--two">
        <div className="card">
          <h3 className="card__title">Capitalize when the spend</h3>
          <ul className="card__subtitle">
            <li>Creates a new asset or materially improves an existing one.</li>
            <li>Extends useful life, increases capacity, or unlocks new outputs.</li>
            <li>Delivers benefits that clearly span multiple reporting periods.</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="card__title">Expense when the spend</h3>
          <ul className="card__subtitle">
            <li>Repairs or maintains assets at their current performance level.</li>
            <li>Provides routine support, training, or minor fixes.</li>
            <li>Benefits only the current period.</li>
          </ul>
        </div>
      </section>

      <section className="grid grid--two">
        <div className="card">
          <h3 className="card__title">Real-world examples</h3>
          <ul className="card__subtitle">
            <li>Cloud migration project: capex for development after feasibility.</li>
            <li>Data center upgrades: capex for added capacity, opex for patching.</li>
            <li>Brand redesign: opex if short-lived, capex if tied to long-lived assets.</li>
            <li>Major leasehold improvements: capex over the lease term.</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3 className="card__title">Common Judgment Areas</h3>
        <div className="grid grid--two">
          <div className="card__note">
            <strong>Facilities:</strong> Roof replacement (capex) vs patching leaks (opex).
          </div>
          <div className="card__note">
            <strong>Equipment:</strong> New production line (capex) vs tune-up (opex).
          </div>
          <div className="card__note">
            <strong>Software:</strong> Development after feasibility (capex) vs research/support (opex).
          </div>
          <div className="card__note">
            <strong>Leases/TI:</strong> Long-lived tenant improvements (capex) vs repainting (opex).
          </div>
        </div>
      </section>
    </>
  );
}
