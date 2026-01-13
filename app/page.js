export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="badge">Personal project by Chris Cedillo</p>
        <h1 className="hero__title">Accounting Concepts in Action</h1>
        <p className="hero__lead">
          I built this personal project to help college students and accounting professionals
          turn core concepts into interactive, real-world examples. Explore content licensing
          schedules, journal entry mappings, and policy judgment frameworks.
        </p>
        <div className="card__note">
          Work in progress: this guide is in early development and evolving with new modules and examples.
        </div>
        <div className="badge-row">
          <span className="badge">Content Accounting</span>
          <span className="badge">Transfer Pricing</span>
          <span className="badge">Financial Control</span>
          <span className="badge">Expense Recognition</span>
        </div>
      </section>

      <section className="grid grid--two">
        <div className="card">
          <h2 className="card__title">Module 1: Content Licensing</h2>
          <p className="card__subtitle">
            Straight-line, variable royalty, and MG hybrid models with amortization
            schedules, accrual logic, and payment timing.
          </p>
          <div className="card__note">
            Launch the module to simulate schedules and generate journal entries.
          </div>
        </div>
        <div className="card">
          <h2 className="card__title">Module 2: Spend Classification</h2>
          <p className="card__subtitle">
            Use a structured checklist to document cost classification decisions and
            communicate policy rationale.
          </p>
          <div className="card__note">
            Capture judgement logic and align stakeholders with policy.
          </div>
        </div>
        <div className="card">
          <h2 className="card__title">Module 3: Accounting Ops</h2>
          <p className="card__subtitle">
            Expense coding, cash application, payroll entries, and reconciliations
            with outputs that mirror month-end workflows.
          </p>
          <div className="card__note">
            Practice operational accounting with journals, schedules, and tie-outs.
          </div>
        </div>
        <div className="card">
          <h2 className="card__title">Module 4: Royalty Expense</h2>
          <p className="card__subtitle">
            Model device inventory royalties from units sold through accruals and
            settlements, with period cutoff support.
          </p>
          <div className="card__note">
            Work through royalty expense timing and payment flows.
          </div>
        </div>
      </section>
    </>
  );
}
