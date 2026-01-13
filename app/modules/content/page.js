"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import DataTable from "../../components/DataTable";
import MetricCard from "../../components/MetricCard";
import {
  createAmortizationSchedule,
  createAmortizationSummary,
  generateAmortizationJournals,
  createVariableRoyaltySchedule,
  generateVariableRoyaltyJournals,
  generateVariableRoyaltyPayments,
  createMgHybridSchedule,
  generateMgHybridJournals,
  formatScheduleCurrency,
  formatScheduleNumber
} from "../../lib/calculations";

const LICENSE_NAME = "Content Licensing Agreement";
const DEFAULT_COST = 200000000;
const DEFAULT_START_DATE = "2020-12-01";
const DEFAULT_END_DATE = "2023-12-31";
const DEFAULT_RATE = 0.005;
const DEFAULT_MG = 500000;

const parseDateInput = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(Date.UTC(year, month - 1, day));
};

const addMonths = (date, months) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));

const formatMonthLabel = (date) => {
  if (!date) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatJournalRows = (rows) =>
  rows.map((row) => [
    row.Date,
    row.JE_Type,
    row.Account_Description,
    row.Account_Number,
    formatScheduleCurrency(row.Debit),
    formatScheduleCurrency(row.Credit)
  ]);

const getNumberFormat = (header) => {
  const normalized = header.toLowerCase();
  if (normalized.includes("rate")) {
    return "#,##0.####";
  }
  if (normalized.includes("stream") || normalized.includes("month") || normalized.includes("account number")) {
    return "#,##0";
  }
  return "#,##0.00";
};

const formatForWidth = (value, format) => {
  if (typeof value !== "number") {
    return String(value ?? "");
  }

  if (format === "#,##0") {
    return value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  if (format === "#,##0.####") {
    return value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  }
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const buildWorkbook = (sheets, fileName) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    const columnWidths = sheet.headers.map((header, colIndex) => {
      const format = getNumberFormat(header);
      let maxLength = String(header).length;
      sheet.rows.forEach((row) => {
        const value = row[colIndex];
        const formatted = formatForWidth(value, format);
        maxLength = Math.max(maxLength, formatted.length);
      });
      return { wch: Math.min(Math.max(maxLength + 2, 10), 40) };
    });

    sheet.rows.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (typeof value !== "number") return;
        const format = getNumberFormat(sheet.headers[colIndex]);
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
        if (!worksheet[cellAddress]) return;
        worksheet[cellAddress].z = format;
      });
    });

    worksheet["!cols"] = columnWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  XLSX.writeFile(workbook, fileName);
};

export default function ContentModulePage() {
  const [method, setMethod] = useState("fixed");
  const [fixedCost, setFixedCost] = useState(DEFAULT_COST);
  const [fixedStartDate, setFixedStartDate] = useState(DEFAULT_START_DATE);
  const [fixedEndDate, setFixedEndDate] = useState(DEFAULT_END_DATE);
  const [fixedResult, setFixedResult] = useState(null);
  const [fixedError, setFixedError] = useState("");

  const [variableRate, setVariableRate] = useState(DEFAULT_RATE);
  const [variableStartDate, setVariableStartDate] = useState(DEFAULT_START_DATE);
  const [variableStreams, setVariableStreams] = useState([1000000, 1200000, 950000]);
  const [variableResult, setVariableResult] = useState(null);
  const [variableError, setVariableError] = useState("");

  const [mgAmount, setMgAmount] = useState(DEFAULT_MG);
  const [mgRate, setMgRate] = useState(DEFAULT_RATE);
  const [mgStartDate, setMgStartDate] = useState(DEFAULT_START_DATE);
  const [mgStreams, setMgStreams] = useState([1000000, 1200000, 950000]);
  const [mgResult, setMgResult] = useState(null);
  const [mgError, setMgError] = useState("");

  const variableMonthLabels = variableStreams.map((_, index) => {
    const start = parseDateInput(variableStartDate);
    if (!start) return `Month ${index + 1}`;
    return formatMonthLabel(addMonths(start, index));
  });

  const mgMonthLabels = mgStreams.map((_, index) => {
    const start = parseDateInput(mgStartDate);
    if (!start) return `Month ${index + 1}`;
    return formatMonthLabel(addMonths(start, index));
  });

  const handleVariableStreamChange = (index, value) => {
    setVariableStreams((prev) => {
      const next = [...prev];
      const normalized = value.replace(/_/g, "");
      next[index] = normalized === "" ? 0 : Number(normalized);
      return next;
    });
  };

  const handleMgStreamChange = (index, value) => {
    setMgStreams((prev) => {
      const next = [...prev];
      const normalized = value.replace(/_/g, "");
      next[index] = normalized === "" ? 0 : Number(normalized);
      return next;
    });
  };

  const addVariableMonth = () => {
    setVariableStreams((prev) => [...prev, 0]);
  };

  const addMgMonth = () => {
    setMgStreams((prev) => [...prev, 0]);
  };

  const removeVariableMonth = (index) => {
    setVariableStreams((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeMgMonth = (index) => {
    setMgStreams((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFixedCalculate = () => {
    const result = createAmortizationSchedule(fixedCost, fixedStartDate, fixedEndDate);
    if (result?.error) {
      setFixedError(result.error);
      setFixedResult(null);
      return;
    }
    setFixedError("");
    setFixedResult(result);
  };

  const handleVariableCalculate = () => {
    const streams = variableStreams.map((value) => Number(value || 0));
    if (!streams.length) {
      setVariableError("Enter at least one monthly stream value.");
      setVariableResult(null);
      return;
    }
    if (streams.some((value) => Number.isNaN(value) || value < 0)) {
      setVariableError("Monthly streams must be zero or a positive number.");
      setVariableResult(null);
      return;
    }

    const result = createVariableRoyaltySchedule(streams, variableRate, variableStartDate);
    if (result?.error) {
      setVariableError(result.error);
      setVariableResult(null);
      return;
    }

    setVariableError("");
    setVariableResult({ schedule: result.schedule, streams });
  };

  const handleMgCalculate = () => {
    const streams = mgStreams.map((value) => Number(value || 0));
    if (!streams.length) {
      setMgError("Enter at least one monthly stream value.");
      setMgResult(null);
      return;
    }
    if (streams.some((value) => Number.isNaN(value) || value < 0)) {
      setMgError("Monthly streams must be zero or a positive number.");
      setMgResult(null);
      return;
    }

    const result = createMgHybridSchedule(streams, mgRate, mgAmount, mgStartDate);
    if (result?.error) {
      setMgError(result.error);
      setMgResult(null);
      return;
    }

    setMgError("");
    setMgResult({ schedule: result.schedule, streams });
  };

  const fixedSchedule = fixedResult?.schedule ?? [];
  const fixedSummary = fixedResult
    ? createAmortizationSummary(fixedCost, fixedResult.totalMonths, fixedResult.monthlyExpense)
    : [];
  const fixedPreviewSchedule = fixedSchedule.slice(0, 5);
  const fixedJournalPreview = fixedPreviewSchedule.length
    ? generateAmortizationJournals(fixedPreviewSchedule, LICENSE_NAME, fixedCost)
    : [];
  const fixedJournalFull = fixedSchedule.length
    ? generateAmortizationJournals(fixedSchedule, LICENSE_NAME, fixedCost)
    : [];

  const variableSchedule = variableResult?.schedule ?? [];
  const variableJournal = variableSchedule.length
    ? generateVariableRoyaltyJournals(variableSchedule, LICENSE_NAME)
    : [];
  const variablePayments = variableSchedule.length
    ? generateVariableRoyaltyPayments(variableSchedule, LICENSE_NAME)
    : [];

  const mgSchedule = mgResult?.schedule ?? [];
  const mgJournal = mgSchedule.length
    ? generateMgHybridJournals(mgSchedule, LICENSE_NAME, mgAmount, mgStartDate)
    : [];

  const handleFixedExport = () => {
    if (!fixedSchedule.length) return;
    const summaryRows = fixedSummary.map(([metric, value]) => [metric, value]);
    const scheduleRows = fixedSchedule.map((row) => [
      row.Posting_Date,
      row.Amortization_Expense,
      row.Accumulated_Amortization,
      row.Net_Book_Value_NBV
    ]);
    const journalRows = fixedJournalFull.map((row) => [
      row.Date,
      row.JE_Type,
      row.Account_Description,
      row.Account_Number,
      row.Debit,
      row.Credit
    ]);
    buildWorkbook(
      [
        { name: "Summary", headers: ["Metric", "Value"], rows: summaryRows },
        {
          name: "Amortization Schedule",
          headers: [
            "Posting Date",
            "Amortization Expense",
            "Accumulated Amortization",
            "Net Book Value"
          ],
          rows: scheduleRows
        },
        {
          name: "Journal Entries",
          headers: [
            "Date",
            "JE Type",
            "Account",
            "Account Number",
            "Debit",
            "Credit"
          ],
          rows: journalRows
        }
      ],
      "Content_Licensing_Fixed_Fee.xlsx"
    );
  };

  const handleVariableExport = () => {
    if (!variableSchedule.length) return;
    const totalStreams = variableSchedule.reduce((sum, row) => sum + row.Streams, 0);
    const totalExpense = variableSchedule.reduce((sum, row) => sum + row.Royalty_Expense, 0);
    const summaryRows = [
      ["Royalty Rate ($/stream)", variableRate],
      ["Total Streams", totalStreams],
      ["Total Royalty Expense", totalExpense]
    ];
    const scheduleRows = variableSchedule.map((row) => [
      row.Posting_Date,
      row.Streams,
      row.Royalty_Expense,
      row.Accrued_Payable
    ]);
    const journalRows = variableJournal.map((row) => [
      row.Date,
      row.JE_Type,
      row.Account_Description,
      row.Account_Number,
      row.Debit,
      row.Credit
    ]);
    const paymentRows = variablePayments.map((row) => [
      row.Date,
      row.JE_Type,
      row.Account_Description,
      row.Account_Number,
      row.Debit,
      row.Credit
    ]);
    buildWorkbook(
      [
        { name: "Summary", headers: ["Metric", "Value"], rows: summaryRows },
        {
          name: "Usage Schedule",
          headers: ["Posting Date", "Streams", "Royalty Expense", "Accrued Payable"],
          rows: scheduleRows
        },
        {
          name: "Journal Entries",
          headers: [
            "Date",
            "JE Type",
            "Account",
            "Account Number",
            "Debit",
            "Credit"
          ],
          rows: journalRows
        },
        {
          name: "Payment Schedule",
          headers: [
            "Date",
            "JE Type",
            "Account",
            "Account Number",
            "Debit",
            "Credit"
          ],
          rows: paymentRows
        }
      ],
      "Content_Licensing_Variable_Royalty.xlsx"
    );
  };

  const handleMgExport = () => {
    if (!mgSchedule.length) return;
    const totalUsage = mgSchedule.reduce((sum, row) => sum + row.Usage_Expense, 0);
    const totalOverage = mgSchedule.reduce((sum, row) => sum + row.Overage_Expense, 0);
    const summaryRows = [
      ["Minimum Guarantee", mgAmount],
      ["Total Usage Expense", totalUsage],
      ["Total Overage Expense", totalOverage],
      ["Ending Prepaid Balance", mgSchedule[mgSchedule.length - 1].Ending_Prepaid]
    ];
    const scheduleRows = mgSchedule.map((row) => [
      row.Posting_Date,
      row.Streams,
      row.Usage_Expense,
      row.Prepaid_Amortization,
      row.Overage_Expense,
      row.Ending_Prepaid,
      row.Accrued_Overage
    ]);
    const journalRows = mgJournal.map((row) => [
      row.Date,
      row.JE_Type,
      row.Account_Description,
      row.Account_Number,
      row.Debit,
      row.Credit
    ]);
    buildWorkbook(
      [
        { name: "Summary", headers: ["Metric", "Value"], rows: summaryRows },
        {
          name: "MG Schedule",
          headers: [
            "Posting Date",
            "Streams",
            "Usage Expense",
            "Prepaid Amortization",
            "Overage Expense",
            "Ending Prepaid",
            "Accrued Overage"
          ],
          rows: scheduleRows
        },
        {
          name: "Journal Entries",
          headers: [
            "Date",
            "JE Type",
            "Account",
            "Account Number",
            "Debit",
            "Credit"
          ],
          rows: journalRows
        }
      ],
      "Content_Licensing_MG_Hybrid.xlsx"
    );
  };

  return (
    <>
      <section className="hero">
        <p className="badge">Module 1</p>
        <h1 className="hero__title">Content License Accounting</h1>
        <p className="hero__lead">
          Model prepaid licensing, variable royalties, and minimum guarantees with
          automated schedules, journal entries, and payment timing.
        </p>
      </section>

      <section className="grid grid--two">
        <div className="card">
          <h2 className="card__title">Why this matters</h2>
          <p className="card__subtitle">
            Content and data deals usually grant time-based access, not ownership of
            a separable asset. That often means the upfront fee is a prepaid expense,
            recognized over the access period.
          </p>
          <div className="card__note">
            If the contract only delivers service access, the balance sheet shows a
            prepaid asset that declines as the content is consumed.
          </div>
        </div>
        <div className="card">
          <h2 className="card__title">Key accounting concepts</h2>
          <ul className="card__subtitle">
            <li>Prepaid Content Licensing: upfront payment recorded as an asset.</li>
            <li>Expense Recognition: monthly debit to Content Expense.</li>
            <li>Accumulated Amortization: total expense recognized to date.</li>
            <li>Net Book Value (NBV): remaining prepaid balance.</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3 className="card__title">Journal entry flow (fixed fee example)</h3>
        <div className="tchart">
          <div className="tchart__header">
            <div className="tchart__cell">Debit</div>
            <div className="tchart__cell">Credit</div>
          </div>
          <div className="tchart__row">
            <div className="tchart__entry">
              <div className="tchart__label">Prepaid Content Licensing</div>
              <div className="tchart__meta">Initial setup entry</div>
            </div>
            <div className="tchart__entry">
              <div className="tchart__label">Cash</div>
              <div className="tchart__meta">Initial setup entry</div>
            </div>
          </div>
          <div className="tchart__row">
            <div className="tchart__entry">
              <div className="tchart__label">Content Expense</div>
              <div className="tchart__meta">Monthly recognition</div>
            </div>
            <div className="tchart__entry">
              <div className="tchart__label">Prepaid Content Licensing</div>
              <div className="tchart__meta">Monthly recognition</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Select the contract structure</h2>
        <p className="section-subtitle">
          Pick the arrangement that matches your contract so the model applies the
          right accounting logic.
        </p>
        <div className="tab-row">
          <button
            className={`tab${method === "fixed" ? " active" : ""}`}
            type="button"
            onClick={() => setMethod("fixed")}
          >
            Fixed Fee (Straight-Line)
          </button>
          <button
            className={`tab${method === "variable" ? " active" : ""}`}
            type="button"
            onClick={() => setMethod("variable")}
          >
            Variable Royalty (Pure Usage)
          </button>
          <button
            className={`tab${method === "mg" ? " active" : ""}`}
            type="button"
            onClick={() => setMethod("mg")}
          >
            Minimum Guarantee (Hybrid)
          </button>
        </div>
      </section>

      {method === "fixed" && (
        <section className="grid">
          <div className="card">
            <h3 className="card__title">Fixed Fee (Straight-Line) Model</h3>
            <p className="card__subtitle">
              Use when an upfront license fee is consumed evenly over the contract term.
            </p>
            <div className="controls">
              <div className="controls__row">
                <div>
                  <label htmlFor="fixed-cost">Total License Cost</label>
                  <input
                    id="fixed-cost"
                    type="number"
                    value={fixedCost}
                    min={1000}
                    step={1000}
                    onChange={(event) => setFixedCost(Number(event.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="fixed-start">Start Date</label>
                  <input
                    id="fixed-start"
                    type="date"
                    value={fixedStartDate}
                    onChange={(event) => setFixedStartDate(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="fixed-end">End Date</label>
                  <input
                    id="fixed-end"
                    type="date"
                    value={fixedEndDate}
                    onChange={(event) => setFixedEndDate(event.target.value)}
                  />
                </div>
              </div>
              <button type="button" onClick={handleFixedCalculate}>
                Calculate Schedule
              </button>
              {fixedError && <div className="notice">{fixedError}</div>}
            </div>
          </div>

          {fixedResult && (
            <>
              <div className="card">
                <h3 className="card__title">Summary Metrics</h3>
                <div className="metric-grid">
                  {fixedSummary.map(([label, value]) => (
                    <MetricCard key={label} label={label} value={value} />
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="card__title">Expense Recognition Schedule (First 5 Months)</h3>
                <DataTable
                  columns={[
                    "Posting Date",
                    "Expense Recognized",
                    "Cumulative Expense",
                    "Remaining Prepaid"
                  ]}
                  rows={fixedPreviewSchedule.map((row) => [
                    row.Posting_Date,
                    formatScheduleCurrency(row.Amortization_Expense),
                    formatScheduleCurrency(row.Accumulated_Amortization),
                    formatScheduleCurrency(row.Net_Book_Value_NBV)
                  ])}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Journal Entry Mappings (Preview)</h3>
                <DataTable
                  columns={[
                    "Date",
                    "JE Type",
                    "Account",
                    "Account Number",
                    "Debit",
                    "Credit"
                  ]}
                  rows={formatJournalRows(fixedJournalPreview)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Full Journal Entries</h3>
                <p className="card__subtitle">
                  {fixedJournalFull.length} rows generated for the full term.
                </p>
                <DataTable
                  columns={[
                    "Date",
                    "JE Type",
                    "Account",
                    "Account Number",
                    "Debit",
                    "Credit"
                  ]}
                  rows={formatJournalRows(fixedJournalFull)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Export</h3>
                <p className="card__subtitle">
                  Download a single Excel workbook with summary, schedule, and journal sheets.
                </p>
                <button type="button" onClick={handleFixedExport}>
                  Download Excel Workbook
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {method === "variable" && (
        <section className="grid">
          <div className="card">
            <h3 className="card__title">Variable Royalty (Pure Usage)</h3>
            <p className="card__subtitle">
              Expenses track monthly usage. No upfront asset is capitalized.
            </p>
            <div className="card__note">
              <strong>Learning focus:</strong> Each month you accrue the royalty
              expense as usage occurs. The payable grows until cash is settled, so
              there is no prepaid balance or amortization schedule.
            </div>
            <div className="controls">
              <div className="controls__row">
                <div>
                  <label htmlFor="variable-rate">Royalty Rate (per stream)</label>
                  <input
                    id="variable-rate"
                    type="number"
                    min={0}
                    step={0.0001}
                    value={variableRate}
                    onChange={(event) => setVariableRate(Number(event.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="variable-start">Start Date</label>
                  <input
                    id="variable-start"
                    type="date"
                    value={variableStartDate}
                    onChange={(event) => setVariableStartDate(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label>Monthly Streams</label>
                <div className="controls">
                  {variableStreams.map((value, index) => (
                    <div key={`${variableMonthLabels[index]}-${index}`} className="controls__row controls__row--inline">
                      <div>
                        <label>{variableMonthLabels[index]}</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={value}
                          onChange={(event) => handleVariableStreamChange(index, event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="sr-only">Remove month</label>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => removeVariableMonth(index)}
                          disabled={variableStreams.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="secondary" onClick={addVariableMonth}>
                    Add Month
                  </button>
                </div>
              </div>
              <button type="button" onClick={handleVariableCalculate}>
                Calculate Usage Expense
              </button>
              {variableError && <div className="notice">{variableError}</div>}
            </div>
          </div>

          {variableSchedule.length > 0 && (
            <>
              <div className="card">
                <h3 className="card__title">Summary Metrics</h3>
                <div className="metric-grid">
                  <MetricCard label="Royalty Rate" value={`$${variableRate.toFixed(4)}`} />
                  <MetricCard
                    label="Total Streams"
                    value={formatScheduleNumber(variableSchedule.reduce((sum, row) => sum + row.Streams, 0))}
                  />
                  <MetricCard
                    label="Total Royalty Expense"
                    value={formatScheduleCurrency(
                      variableSchedule.reduce((sum, row) => sum + row.Royalty_Expense, 0)
                    )}
                  />
                </div>
              </div>

              <div className="card">
                <h3 className="card__title">Usage Expense Schedule</h3>
                <DataTable
                  columns={["Posting Date", "Streams", "Royalty Expense", "Accrued Payable"]}
                  rows={variableSchedule.map((row) => [
                    row.Posting_Date,
                    formatScheduleNumber(row.Streams),
                    formatScheduleCurrency(row.Royalty_Expense),
                    formatScheduleCurrency(row.Accrued_Payable)
                  ])}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Journal Entry Mappings</h3>
                <DataTable
                  columns={[
                    "Date",
                    "JE Type",
                    "Account",
                    "Account Number",
                    "Debit",
                    "Credit"
                  ]}
                  rows={formatJournalRows(variableJournal)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Quarterly Settlement Schedule</h3>
                <p className="card__subtitle">
                  Payables clear at quarter-end for all usage accrued in the prior
                  three months.
                </p>
                <DataTable
                  columns={[
                    "Date",
                    "JE Type",
                    "Account",
                    "Account Number",
                    "Debit",
                    "Credit"
                  ]}
                  rows={formatJournalRows(variablePayments)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Export</h3>
                <p className="card__subtitle">
                  Download a single Excel workbook with summary, usage, journal, and payment sheets.
                </p>
                <button type="button" onClick={handleVariableExport}>
                  Download Excel Workbook
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {method === "mg" && (
        <section className="grid">
          <div className="card">
            <h3 className="card__title">Minimum Guarantee (Hybrid Usage)</h3>
            <p className="card__subtitle">
              Upfront MG acts as prepaid content, drawn down by usage until the break-even
              point.
            </p>
            <div className="card__note">
              <strong>Learning focus:</strong> The MG starts as a prepaid asset. Each
              period you apply usage against the prepaid balance. Any usage above the
              remaining MG is an overage expense with an accrued payable.
            </div>
            <div className="controls">
              <div className="controls__row">
                <div>
                  <label htmlFor="mg-amount">Minimum Guarantee</label>
                  <input
                    id="mg-amount"
                    type="number"
                    min={0}
                    step={1000}
                    value={mgAmount}
                    onChange={(event) => setMgAmount(Number(event.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="mg-rate">Royalty Rate (per stream)</label>
                  <input
                    id="mg-rate"
                    type="number"
                    min={0}
                    step={0.0001}
                    value={mgRate}
                    onChange={(event) => setMgRate(Number(event.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="mg-start">Start Date</label>
                  <input
                    id="mg-start"
                    type="date"
                    value={mgStartDate}
                    onChange={(event) => setMgStartDate(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label>Monthly Streams</label>
                <div className="controls">
                  {mgStreams.map((value, index) => (
                    <div key={`${mgMonthLabels[index]}-${index}`} className="controls__row controls__row--inline">
                      <div>
                        <label>{mgMonthLabels[index]}</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={value}
                          onChange={(event) => handleMgStreamChange(index, event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="sr-only">Remove month</label>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => removeMgMonth(index)}
                          disabled={mgStreams.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="secondary" onClick={addMgMonth}>
                    Add Month
                  </button>
                </div>
              </div>
              <button type="button" onClick={handleMgCalculate}>
                Calculate MG Usage
              </button>
              {mgError && <div className="notice">{mgError}</div>}
            </div>
          </div>

          {mgSchedule.length > 0 && (
            <>
              <div className="card">
                <h3 className="card__title">Summary Metrics</h3>
                <div className="metric-grid">
                  <MetricCard label="Minimum Guarantee" value={formatScheduleCurrency(mgAmount)} />
                  <MetricCard
                    label="Total Usage Expense"
                    value={formatScheduleCurrency(
                      mgSchedule.reduce((sum, row) => sum + row.Usage_Expense, 0)
                    )}
                  />
                  <MetricCard
                    label="Total Overage Expense"
                    value={formatScheduleCurrency(
                      mgSchedule.reduce((sum, row) => sum + row.Overage_Expense, 0)
                    )}
                  />
                  <MetricCard
                    label="Ending Prepaid Balance"
                    value={formatScheduleCurrency(mgSchedule[mgSchedule.length - 1].Ending_Prepaid)}
                  />
                </div>
              </div>

              <div className="card">
                <h3 className="card__title">MG Usage Schedule</h3>
                <DataTable
                  columns={[
                    "Posting Date",
                    "Streams",
                    "Usage Expense",
                    "Prepaid Amortization",
                    "Overage Expense",
                    "Ending Prepaid",
                    "Accrued Overage"
                  ]}
                  rows={mgSchedule.map((row) => [
                    row.Posting_Date,
                    formatScheduleNumber(row.Streams),
                    formatScheduleCurrency(row.Usage_Expense),
                    formatScheduleCurrency(row.Prepaid_Amortization),
                    formatScheduleCurrency(row.Overage_Expense),
                    formatScheduleCurrency(row.Ending_Prepaid),
                    formatScheduleCurrency(row.Accrued_Overage)
                  ])}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Journal Entry Mappings</h3>
                <DataTable
                  columns={[
                    "Date",
                    "JE Type",
                    "Account",
                    "Account Number",
                    "Debit",
                    "Credit"
                  ]}
                  rows={formatJournalRows(mgJournal)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Export</h3>
                <p className="card__subtitle">
                  Download a single Excel workbook with summary, schedule, and journal sheets.
                </p>
                <button type="button" onClick={handleMgExport}>
                  Download Excel Workbook
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
