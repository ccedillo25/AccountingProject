"use client";

import { useState } from "react";
import DataTable from "../../components/DataTable";
import MetricCard from "../../components/MetricCard";
import { formatScheduleCurrency, formatScheduleNumber } from "../../lib/calculations";

const DEFAULT_VENDOR = "Nova Devices";
const DEFAULT_RATE = 2.75;
const DEFAULT_START = "2024-01-01";
const DEFAULT_UNITS = [1200, 1500, 980];

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(Date.UTC(year, month - 1, day));
};

const addMonths = (date, months) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));

const monthEnd = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const formatDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export default function RoyaltyExpensePage() {
  const [vendor, setVendor] = useState(DEFAULT_VENDOR);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [unitsByMonth, setUnitsByMonth] = useState(DEFAULT_UNITS);
  const [cadence, setCadence] = useState("quarterly");
  const [modelError, setModelError] = useState("");
  const [modelResult, setModelResult] = useState(null);

  const monthLabels = unitsByMonth.map((_, index) => {
    const start = parseDate(startDate);
    if (!start) return `Month ${index + 1}`;
    const labelDate = addMonths(start, index);
    const year = labelDate.getUTCFullYear();
    const month = String(labelDate.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const handleUnitChange = (index, value) => {
    setUnitsByMonth((prev) => {
      const next = [...prev];
      const normalized = value.replace(/_/g, "");
      next[index] = normalized === "" ? 0 : Number(normalized);
      return next;
    });
  };

  const handleAddMonth = () => {
    setUnitsByMonth((prev) => [...prev, 0]);
  };

  const handleRemoveMonth = (index) => {
    setUnitsByMonth((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCalculate = () => {
    const start = parseDate(startDate);
    const units = unitsByMonth.map((value) => Number(value || 0));
    if (!units.length) {
      setModelError("Enter at least one unit value.");
      setModelResult(null);
      return;
    }
    if (units.some((value) => Number.isNaN(value) || value < 0)) {
      setModelError("Units sold must be zero or a positive number.");
      setModelResult(null);
      return;
    }
    if (!start) {
      setModelError("Enter a valid start date (YYYY-MM-DD).");
      setModelResult(null);
      return;
    }
    if (!rate || rate <= 0) {
      setModelError("Enter a royalty rate greater than zero.");
      setModelResult(null);
      return;
    }

    const schedule = [];
    let accrued = 0;
    units.forEach((count, index) => {
      const postingDate = monthEnd(addMonths(start, index));
      const expense = round2(count * rate);
      accrued = round2(accrued + expense);
      schedule.push({
        Posting_Date: formatDate(postingDate),
        Units: count,
        Royalty_Expense: expense,
        Accrued_Payable: accrued
      });
    });

    const payments = [];
    if (cadence === "monthly") {
      schedule.forEach((row) => {
        payments.push({
          Date: row.Posting_Date,
          Amount: row.Royalty_Expense,
          Label: "Monthly settlement"
        });
      });
    } else {
      let bucketTotal = 0;
      let quarterEndDate = "";
      schedule.forEach((row, index) => {
        bucketTotal += row.Royalty_Expense;
        const posting = parseDate(row.Posting_Date);
        if (posting) {
          const quarterEndMonth = Math.floor(posting.getUTCMonth() / 3) * 3 + 2;
          quarterEndDate = formatDate(monthEnd(new Date(Date.UTC(posting.getUTCFullYear(), quarterEndMonth, 1))));
        }
        const isQuarterEnd = (index + 1) % 3 === 0 || index === schedule.length - 1;
        if (isQuarterEnd) {
          payments.push({
            Date: quarterEndDate || row.Posting_Date,
            Amount: round2(bucketTotal),
            Label: "Quarterly settlement"
          });
          bucketTotal = 0;
        }
      });
    }

    setModelError("");
    setModelResult({
      schedule,
      payments,
      totals: {
        units: units.reduce((sum, value) => sum + value, 0),
        expense: schedule.reduce((sum, row) => sum + row.Royalty_Expense, 0)
      }
    });
  };

  return (
    <>
      <section className="hero">
        <p className="badge">Module 4</p>
        <h1 className="hero__title">Device Inventory Royalties</h1>
        <p className="hero__lead">
          Focused on device inventory and sales-driven royalties. Learn how royalties
          tied to units sold or shipped flow through expense recognition, accruals,
          and settlement, with cutoffs anchored to sell-through data.
        </p>
      </section>

      <section className="grid grid--two">
        <div className="card">
          <h2 className="card__title">Core idea</h2>
          <p className="card__subtitle">
            For hardware or device inventory, royalties are typically triggered by
            sales or shipments. Expense is recognized with the revenue event, while
            the payable is accrued if the royalty statement invoices later.
          </p>
          <div className="badge-row">
            <span className="badge">Units Sold</span>
            <span className="badge">Sell-Through Cutoff</span>
            <span className="badge">AP Accrual</span>
          </div>
        </div>
        <div className="card">
          <h2 className="card__title">Key recognition points</h2>
          <ul className="card__subtitle">
            <li>Expense follows units sold or shipped (match to revenue).</li>
            <li>AP is accrued for earned royalties not yet invoiced.</li>
            <li>Sell-through reports support period cutoff.</li>
            <li>Cash settlement clears the payable when statements are paid.</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3 className="card__title">Example flow</h3>
        <div className="tchart">
          <div className="tchart__header">
            <div className="tchart__cell">Debit</div>
            <div className="tchart__cell">Credit</div>
          </div>
          <div className="tchart__row">
            <div className="tchart__entry">
              <div className="tchart__label">Royalty Expense</div>
              <div className="tchart__meta">Month-end accrual (units sold)</div>
            </div>
            <div className="tchart__entry">
              <div className="tchart__label">Accounts Payable (Royalty)</div>
              <div className="tchart__meta">Month-end accrual</div>
            </div>
          </div>
          <div className="tchart__row">
            <div className="tchart__entry">
              <div className="tchart__label">Accounts Payable (Royalty)</div>
              <div className="tchart__meta">Statement payment</div>
            </div>
            <div className="tchart__entry">
              <div className="tchart__label">Cash</div>
              <div className="tchart__meta">Statement payment</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="card__title">Full device inventory royalty lifecycle</h3>
        <div className="grid grid--two">
          <div className="card__note">
            <strong>1) Sales capture:</strong> Pull sell-through data (units sold)
            from channel reports to anchor the royalty base.
          </div>
          <div className="card__note">
            <strong>2) Accrual:</strong> Record royalty expense and AP for the period
            based on unit counts and contract rate.
          </div>
          <div className="card__note">
            <strong>3) Statement match:</strong> Tie the vendor royalty statement to
            the accrued units and investigate variances.
          </div>
          <div className="card__note">
            <strong>4) Payment:</strong> Settle AP when the statement invoice is paid.
          </div>
          <div className="card__note">
            <strong>5) Reconciliation:</strong> Reconcile AP (royalty) balance to
            open statements and adjust for timing differences.
          </div>
          <div className="card__note">
            <strong>6) Close review:</strong> Confirm cutoff around period-end sales
            and document assumptions.
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="card__title">Royalty model (units sold x rate)</h3>
        <p className="card__subtitle">
          Use this model to translate unit sales into royalty expense, AP accruals, and settlement timing.
        </p>
        <div className="controls">
          <div className="controls__row">
            <div>
              <label htmlFor="royalty-vendor">Vendor</label>
              <input
                id="royalty-vendor"
                type="text"
                value={vendor}
                onChange={(event) => setVendor(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="royalty-rate">Royalty Rate (per unit)</label>
              <input
                id="royalty-rate"
                type="number"
                min={0}
                step={0.01}
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
              />
            </div>
            <div>
              <label htmlFor="royalty-start">Start Date</label>
              <input
                id="royalty-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="royalty-cadence">Settlement Cadence</label>
              <select
                id="royalty-cadence"
                value={cadence}
                onChange={(event) => setCadence(event.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
          <div>
            <label>Units Sold by Month</label>
            <div className="controls">
              {unitsByMonth.map((value, index) => (
                <div key={`${monthLabels[index]}-${index}`} className="controls__row controls__row--inline">
                  <div>
                    <label>{monthLabels[index]}</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={value}
                      onChange={(event) => handleUnitChange(index, event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="sr-only">Remove month</label>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleRemoveMonth(index)}
                      disabled={unitsByMonth.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" className="secondary" onClick={handleAddMonth}>
                Add Month
              </button>
            </div>
          </div>
          <button type="button" onClick={handleCalculate}>
            Calculate Royalty Expense
          </button>
          {modelError && <div className="notice">{modelError}</div>}
        </div>
      </section>

      {modelResult && (
        <>
          <section className="card">
            <h3 className="card__title">Summary Metrics</h3>
            <div className="metric-grid">
              <MetricCard label="Vendor" value={vendor || "Vendor"} />
              <MetricCard label="Total Units" value={formatScheduleNumber(modelResult.totals.units)} />
              <MetricCard label="Royalty Rate" value={formatScheduleCurrency(rate)} />
              <MetricCard label="Total Royalty Expense" value={formatScheduleCurrency(modelResult.totals.expense)} />
            </div>
          </section>

          <section className="card">
            <h3 className="card__title">Accrual Schedule</h3>
            <DataTable
              columns={["Posting Date", "Units Sold", "Royalty Expense", "Accrued Payable"]}
              rows={modelResult.schedule.map((row) => [
                row.Posting_Date,
                formatScheduleNumber(row.Units),
                formatScheduleCurrency(row.Royalty_Expense),
                formatScheduleCurrency(row.Accrued_Payable)
              ])}
            />
          </section>

          <section className="card">
            <h3 className="card__title">Settlement Schedule</h3>
            <DataTable
              columns={["Date", "Amount", "Cadence"]}
              rows={modelResult.payments.map((row) => [
                row.Date,
                formatScheduleCurrency(row.Amount),
                row.Label
              ])}
            />
          </section>

          <section className="card">
            <h3 className="card__title">Journal Entries</h3>
            <DataTable
              columns={["Date", "JE Type", "Account", "Account Number", "Debit", "Credit"]}
              rows={[
                ...modelResult.schedule.flatMap((row) => [
                  [
                    row.Posting_Date,
                    "ACCRUAL",
                    "Royalty Expense",
                    51010,
                    formatScheduleCurrency(row.Royalty_Expense),
                    formatScheduleCurrency(0)
                  ],
                  [
                    row.Posting_Date,
                    "ACCRUAL",
                    "Accounts Payable (Royalty)",
                    22611,
                    formatScheduleCurrency(0),
                    formatScheduleCurrency(row.Royalty_Expense)
                  ]
                ]),
                ...modelResult.payments.flatMap((row) => [
                  [
                    row.Date,
                    "PAYMENT",
                    "Accounts Payable (Royalty)",
                    22611,
                    formatScheduleCurrency(row.Amount),
                    formatScheduleCurrency(0)
                  ],
                  [
                    row.Date,
                    "PAYMENT",
                    "Cash",
                    10000,
                    formatScheduleCurrency(0),
                    formatScheduleCurrency(row.Amount)
                  ]
                ])
              ]}
            />
          </section>
        </>
      )}

      <section className="grid grid--two">
        <div className="card">
          <h3 className="card__title">Common pitfalls</h3>
          <ul className="card__subtitle">
            <li>Recognizing expense on invoice date instead of sales period.</li>
            <li>Missing channel inventory changes that affect sell-through.</li>
            <li>Not reconciling unit counts to revenue reporting.</li>
            <li>Clearing AP without matching royalty statements.</li>
          </ul>
        </div>
        <div className="card">
          <h3 className="card__title">What to document</h3>
          <ul className="card__subtitle">
            <li>Sales source and unit counts used for accruals.</li>
            <li>Royalty rate per unit or tiered rate structure.</li>
            <li>Cutoff logic for sell-in vs sell-through.</li>
            <li>Statement matching and settlement cadence.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
