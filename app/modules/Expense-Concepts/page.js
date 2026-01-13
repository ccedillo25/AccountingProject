"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import DataTable from "../../components/DataTable";
import MetricCard from "../../components/MetricCard";
import {
  formatScheduleCurrency,
  formatScheduleNumber,
  parseCsvAmountPairs,
  createExpenseCodingModel,
  generateExpenseCodingJournals,
  createCashApplicationModel,
  generateCashApplicationJournals,
  createPayrollModel,
  generatePayrollJournals
} from "../../lib/calculations";

const MODULE_TITLE = "Accounting Ops: Expense Coding, Cash App, Payroll + Recs";

const DEFAULT_EXPENSE = {
  amount: 12000,
  invoiceDate: "2026-01-05",
  serviceStart: "2026-01-01",
  serviceEnd: "2026-12-31",
  payDate: "2026-01-10",
  category: "Software",
  prepaidPolicy: "auto" // auto | force_prepaid | force_expense
};

const DEFAULT_CASHAPP = {
  customer: "Acme Co",
  paymentAmount: 10000,
  paymentDate: "2026-01-08",
  openInvoicesCsv: "INV-1001: 6000, INV-1002: 4000"
};

const DEFAULT_PAYROLL = {
  employeeName: "Jamie Carter",
  periodStart: "2026-01-01",
  periodEnd: "2026-01-15",
  payDate: "2026-01-20",
  grossPay: 5000,
  deductions: {
    fed: 600,
    socialSecurity: 310,
    medicare: 72.5,
    state: 150,
    k401: 250
  },
  employerTaxes: {
    socialSecurity: 310,
    medicare: 72.5,
    futa: 30,
    suta: 60
  }
};


const formatJournalRows = (rows) =>
  rows.map((row) => [
    row.Date,
    row.JE_Type,
    row.Account_Description,
    row.Account_Number,
    formatScheduleCurrency(row.Debit),
    formatScheduleCurrency(row.Credit),
    row.Memo ?? ""
  ]);

const getNumberFormat = (header) => {
  const normalized = header.toLowerCase();
  if (normalized.includes("rate")) {
    return "#,##0.####";
  }
  if (normalized.includes("stream") || normalized.includes("month") || normalized.includes("acct #")) {
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

export default function AccountingOpsModulePage() {
  const [topic, setTopic] = useState("expense"); // expense | cashapp | payroll

  // -----------------------------
  // Expense Coding State
  // -----------------------------
  const [expAmount, setExpAmount] = useState(DEFAULT_EXPENSE.amount);
  const [expInvoiceDate, setExpInvoiceDate] = useState(DEFAULT_EXPENSE.invoiceDate);
  const [expServiceStart, setExpServiceStart] = useState(DEFAULT_EXPENSE.serviceStart);
  const [expServiceEnd, setExpServiceEnd] = useState(DEFAULT_EXPENSE.serviceEnd);
  const [expPayDate, setExpPayDate] = useState(DEFAULT_EXPENSE.payDate);
  const [expCategory, setExpCategory] = useState(DEFAULT_EXPENSE.category);
  const [expPolicy, setExpPolicy] = useState(DEFAULT_EXPENSE.prepaidPolicy);
  const [expResult, setExpResult] = useState(null);
  const [expError, setExpError] = useState("");

  const handleExpenseCalculate = () => {
    const result = createExpenseCodingModel({
      amount: Number(expAmount),
      invoiceDate: expInvoiceDate,
      serviceStart: expServiceStart,
      serviceEnd: expServiceEnd,
      payDate: expPayDate,
      category: expCategory,
      prepaidPolicy: expPolicy
    });

    if (result?.error) {
      setExpError(result.error);
      setExpResult(null);
      return;
    }
    setExpError("");
    setExpResult(result);
  };

  const expSchedule = expResult?.schedule ?? [];
  const expPreview = expSchedule.slice(0, 6);
  const expMetrics = expResult?.metrics ?? [];
  const expJournalsPreview = expPreview.length
    ? generateExpenseCodingJournals(expPreview, expResult?.assumptions ?? {})
    : [];
  const expJournalsFull = expSchedule.length
    ? generateExpenseCodingJournals(expSchedule, expResult?.assumptions ?? {})
    : [];

  // -----------------------------
  // Cash Application State
  // -----------------------------
  const [cashCustomer, setCashCustomer] = useState(DEFAULT_CASHAPP.customer);
  const [cashPaymentAmount, setCashPaymentAmount] = useState(DEFAULT_CASHAPP.paymentAmount);
  const [cashPaymentDate, setCashPaymentDate] = useState(DEFAULT_CASHAPP.paymentDate);
  const [cashOpenInvoices, setCashOpenInvoices] = useState(DEFAULT_CASHAPP.openInvoicesCsv);
  const [cashResult, setCashResult] = useState(null);
  const [cashError, setCashError] = useState("");

  const handleCashCalculate = () => {
    const invoices = parseCsvAmountPairs(cashOpenInvoices);
    if (!invoices.length) {
      setCashError("Enter at least one open invoice in the format: INV-1001: 6000, INV-1002: 4000");
      setCashResult(null);
      return;
    }

    const result = createCashApplicationModel({
      customer: cashCustomer,
      paymentAmount: Number(cashPaymentAmount),
      paymentDate: cashPaymentDate,
      openInvoices: invoices
    });

    if (result?.error) {
      setCashError(result.error);
      setCashResult(null);
      return;
    }

    setCashError("");
    setCashResult(result);
  };

  const cashApplications = cashResult?.applications ?? [];
  const cashMetrics = cashResult?.metrics ?? [];
  const cashJournals = cashApplications.length
    ? generateCashApplicationJournals(cashApplications, cashResult?.assumptions ?? {})
    : [];

  // -----------------------------
  // Payroll State
  // -----------------------------
  const [payEmployee, setPayEmployee] = useState(DEFAULT_PAYROLL.employeeName);
  const [payStart, setPayStart] = useState(DEFAULT_PAYROLL.periodStart);
  const [payEnd, setPayEnd] = useState(DEFAULT_PAYROLL.periodEnd);
  const [payDate, setPayDate] = useState(DEFAULT_PAYROLL.payDate);
  const [payGross, setPayGross] = useState(DEFAULT_PAYROLL.grossPay);

  const [dedFed, setDedFed] = useState(DEFAULT_PAYROLL.deductions.fed);
  const [dedSocialSecurity, setDedSocialSecurity] = useState(DEFAULT_PAYROLL.deductions.socialSecurity);
  const [dedMed, setDedMed] = useState(DEFAULT_PAYROLL.deductions.medicare);
  const [dedState, setDedState] = useState(DEFAULT_PAYROLL.deductions.state);
  const [ded401k, setDed401k] = useState(DEFAULT_PAYROLL.deductions.k401);

  const [empSocialSecurity, setEmpSocialSecurity] = useState(DEFAULT_PAYROLL.employerTaxes.socialSecurity);
  const [empMed, setEmpMed] = useState(DEFAULT_PAYROLL.employerTaxes.medicare);
  const [empFuta, setEmpFuta] = useState(DEFAULT_PAYROLL.employerTaxes.futa);
  const [empSuta, setEmpSuta] = useState(DEFAULT_PAYROLL.employerTaxes.suta);

  const [payResult, setPayResult] = useState(null);
  const [payError, setPayError] = useState("");

  const handlePayrollCalculate = () => {
    const result = createPayrollModel({
      employeeName: payEmployee,
      periodStart: payStart,
      periodEnd: payEnd,
      payDate,
      grossPay: Number(payGross),
      deductions: {
        fed: Number(dedFed),
        socialSecurity: Number(dedSocialSecurity),
        medicare: Number(dedMed),
        state: Number(dedState),
        k401: Number(ded401k)
      },
      employerTaxes: {
        socialSecurity: Number(empSocialSecurity),
        medicare: Number(empMed),
        futa: Number(empFuta),
        suta: Number(empSuta)
      }
    });

    if (result?.error) {
      setPayError(result.error);
      setPayResult(null);
      return;
    }

    setPayError("");
    setPayResult(result);
  };

  const payMetrics = payResult?.metrics ?? [];
  const payAccrualRows = payResult?.accrual ?? [];
  const payPaymentRows = payResult?.payment ?? [];
  const payJournals = payResult ? generatePayrollJournals(payResult) : [];


  const handleExpenseExport = () => {
    if (!expResult) return;
    buildWorkbook(
      [
        { name: "Summary", headers: ["Metric", "Value"], rows: expMetrics.map(([m, v]) => [m, v]) },
        {
          name: "Recognition Schedule",
          headers: ["Posting Date", "Expense", "Cumulative Expense", "Remaining Balance"],
          rows: expSchedule.map((row) => [
            row.Posting_Date,
            row.Expense,
            row.Cumulative_Expense,
            row.Remaining_Balance
          ])
        },
        {
          name: "Journal Entries",
          headers: ["Date", "JE Type", "Account", "Acct #", "Debit", "Credit", "Memo"],
          rows: expJournalsFull.map((row) => [
            row.Date,
            row.JE_Type,
            row.Account_Description,
            row.Account_Number,
            row.Debit,
            row.Credit,
            row.Memo ?? ""
          ])
        }
      ],
      "Accounting_Ops_Expense_Coding.xlsx"
    );
  };

  const handleCashExport = () => {
    if (!cashResult) return;
    buildWorkbook(
      [
        { name: "Summary", headers: ["Metric", "Value"], rows: cashMetrics.map(([m, v]) => [m, v]) },
        {
          name: "Applications",
          headers: ["Invoice", "Invoice Balance", "Applied", "Remaining After Apply"],
          rows: cashApplications.map((row) => [
            row.Invoice,
            row.Invoice_Balance,
            row.Applied,
            row.Remaining_After
          ])
        },
        {
          name: "Journal Entries",
          headers: ["Date", "JE Type", "Account", "Acct #", "Debit", "Credit", "Memo"],
          rows: cashJournals.map((row) => [
            row.Date,
            row.JE_Type,
            row.Account_Description,
            row.Account_Number,
            row.Debit,
            row.Credit,
            row.Memo ?? ""
          ])
        }
      ],
      "Accounting_Ops_Cash_Application.xlsx"
    );
  };

  const handlePayrollExport = () => {
    if (!payResult) return;
    buildWorkbook(
      [
        { name: "Summary", headers: ["Metric", "Value"], rows: payMetrics.map(([m, v]) => [m, v]) },
        {
          name: "Accrual Breakdown",
          headers: ["Line Item", "Amount"],
          rows: payAccrualRows.map((row) => [row.Label, row.Amount])
        },
        {
          name: "Settlement Breakdown",
          headers: ["Line Item", "Amount"],
          rows: payPaymentRows.map((row) => [row.Label, row.Amount])
        },
        {
          name: "Journal Entries",
          headers: ["Date", "JE Type", "Account", "Acct #", "Debit", "Credit", "Memo"],
          rows: payJournals.map((row) => [
            row.Date,
            row.JE_Type,
            row.Account_Description,
            row.Account_Number,
            row.Debit,
            row.Credit,
            row.Memo ?? ""
          ])
        }
      ],
      "Accounting_Ops_Payroll.xlsx"
    );
  };


  // Helpful “topic” copy
  const topicCopy = useMemo(() => {
    if (topic === "expense") {
      return {
        badge: "Module 2A",
        title: "Expense Coding",
        lead:
          "Decide prepaid vs expense, assign GL + cost center, and generate monthly recognition with clean journal entries."
      };
    }
    if (topic === "cashapp") {
      return {
        badge: "Module 2B",
        title: "Cash Application",
        lead:
          "Apply payments to open invoices, handle under/over-payments, and keep AR aging + cash postings accurate."
      };
    }
    if (topic === "payroll") {
      return {
        badge: "Module 2C",
        title: "Payroll Entries",
        lead:
          "Accrue payroll in the work period, split liabilities correctly, and book the cash settlement when paid."
      };
    }
    return {
      badge: "Module 2C",
      title: "Payroll Entries",
      lead:
        "Accrue payroll in the work period, split liabilities correctly, and book the cash settlement when paid."
    };
  }, [topic]);

  return (
    <>
      <section className="hero">
        <p className="badge">{topicCopy.badge}</p>
        <h1 className="hero__title">{MODULE_TITLE}</h1>
        <p className="hero__lead">{topicCopy.lead}</p>
      </section>

      <section className="grid grid--two">
        <div className="card">
          <h2 className="card__title">Why this matters</h2>
          <p className="card__subtitle">
            These workflows sit right in the month-end close critical path. The goal is simple:
            get the right amounts into the right accounts in the right period — and prove it.
          </p>
          <div className="card__note">
            Strong controls here reduce reclasses, aging issues, and “mystery balances” that
            create audit risk and slow close.
          </div>
        </div>
        <div className="card">
          <h2 className="card__title">Key accounting concepts</h2>
          <ul className="card__subtitle">
            <li>Cutoff: recognize expenses when incurred (service period), not when paid.</li>
            <li>Subledger vs GL: AP/AR/Payroll should reconcile to control accounts.</li>
            <li>Accruals: book liabilities for incurred but unpaid amounts.</li>
            <li>Reconciliations: document support + explain differences with recon items.</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Pick the workflow</h2>
        <p className="section-subtitle">
          Choose the workflow to generate schedules, journal mappings, and reconciliation outputs.
        </p>
        <div className="tab-row">
          <button className={`tab${topic === "expense" ? " active" : ""}`} type="button" onClick={() => setTopic("expense")}>
            Expense Coding
          </button>
          <button className={`tab${topic === "cashapp" ? " active" : ""}`} type="button" onClick={() => setTopic("cashapp")}>
            Cash Application
          </button>
          <button className={`tab${topic === "payroll" ? " active" : ""}`} type="button" onClick={() => setTopic("payroll")}>
            Payroll Entries
          </button>
        </div>
      </section>

      {topic === "expense" && (
        <section className="grid">
          <div className="card">
            <h3 className="card__title">Expense Coding Model</h3>
            <p className="card__subtitle">
              The model decides whether to treat the cost as prepaid or period expense based on the service window,
              then generates the recognition schedule + JEs.
            </p>

            <div className="controls">
              <div className="controls__row">
                <div>
                  <label htmlFor="exp-amount">Amount</label>
                  <input id="exp-amount" type="number" min={0} step={100} value={expAmount} onChange={(e) => setExpAmount(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="exp-category">Category</label>
                  <input id="exp-category" type="text" value={expCategory} onChange={(e) => setExpCategory(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="exp-policy">Policy</label>
                  <select id="exp-policy" value={expPolicy} onChange={(e) => setExpPolicy(e.target.value)}>
                    <option value="auto">Auto (based on dates)</option>
                    <option value="force_prepaid">Force Prepaid</option>
                    <option value="force_expense">Force Expense</option>
                  </select>
                </div>
              </div>

              <div className="controls__row">
                <div>
                  <label htmlFor="exp-inv">Invoice Date</label>
                  <input id="exp-inv" type="date" value={expInvoiceDate} onChange={(e) => setExpInvoiceDate(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="exp-start">Service Start</label>
                  <input id="exp-start" type="date" value={expServiceStart} onChange={(e) => setExpServiceStart(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="exp-end">Service End</label>
                  <input id="exp-end" type="date" value={expServiceEnd} onChange={(e) => setExpServiceEnd(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="exp-pay">Pay Date</label>
                  <input id="exp-pay" type="date" value={expPayDate} onChange={(e) => setExpPayDate(e.target.value)} />
                </div>
              </div>

              <button type="button" onClick={handleExpenseCalculate}>
                Calculate Schedule
              </button>
              {expError && <div className="notice">{expError}</div>}
            </div>
          </div>

          {expResult && (
            <>
              <div className="card">
                <h3 className="card__title">Summary Metrics</h3>
                <div className="metric-grid">
                  {expMetrics.map(([label, value]) => (
                    <MetricCard key={label} label={label} value={value} />
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="card__title">Recognition Schedule (First 6 Periods)</h3>
                <DataTable
                  columns={["Posting Date", "Expense", "Cumulative Expense", "Remaining Asset/Liability"]}
                  rows={expPreview.map((r) => [
                    r.Posting_Date,
                    formatScheduleCurrency(r.Expense),
                    formatScheduleCurrency(r.Cumulative_Expense),
                    formatScheduleCurrency(r.Remaining_Balance)
                  ])}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Journal Entry Mappings (Preview)</h3>
                <DataTable
                  columns={["Date", "JE Type", "Account", "Acct #", "Debit", "Credit", "Memo"]}
                  rows={formatJournalRows(expJournalsPreview)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Full Journal Entries</h3>
                <p className="card__subtitle">{expJournalsFull.length} rows generated for full term.</p>
                <DataTable
                  columns={["Date", "JE Type", "Account", "Acct #", "Debit", "Credit", "Memo"]}
                  rows={formatJournalRows(expJournalsFull)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Export</h3>
                <p className="card__subtitle">
                  Download a single Excel workbook with summary, schedule, and journal sheets.
                </p>
                <button type="button" onClick={handleExpenseExport}>
                  Download Excel Workbook
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {topic === "cashapp" && (
        <section className="grid">
          <div className="card">
            <h3 className="card__title">Cash Application Model</h3>
            <p className="card__subtitle">
              Apply a customer payment to open invoices (FIFO), then generate the cash receipt entry and any unapplied cash.
            </p>

            <div className="controls">
              <div className="controls__row">
                <div>
                  <label htmlFor="cash-cust">Customer</label>
                  <input id="cash-cust" type="text" value={cashCustomer} onChange={(e) => setCashCustomer(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="cash-amt">Payment Amount</label>
                  <input id="cash-amt" type="number" min={0} step={100} value={cashPaymentAmount} onChange={(e) => setCashPaymentAmount(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="cash-date">Payment Date</label>
                  <input id="cash-date" type="date" value={cashPaymentDate} onChange={(e) => setCashPaymentDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label htmlFor="cash-inv">Open Invoices (CSV)</label>
                <textarea id="cash-inv" value={cashOpenInvoices} onChange={(e) => setCashOpenInvoices(e.target.value)} />
                <div className="card__note">
                  Format: <strong>INV-1001: 6000, INV-1002: 4000</strong>
                </div>
              </div>

              <button type="button" onClick={handleCashCalculate}>
                Apply Payment
              </button>
              {cashError && <div className="notice">{cashError}</div>}
            </div>
          </div>

          {cashResult && (
            <>
              <div className="card">
                <h3 className="card__title">Summary Metrics</h3>
                <div className="metric-grid">
                  {cashMetrics.map(([label, value]) => (
                    <MetricCard key={label} label={label} value={value} />
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="card__title">Application Detail</h3>
                <DataTable
                  columns={["Invoice", "Invoice Balance", "Applied", "Remaining After Apply"]}
                  rows={cashApplications.map((r) => [
                    r.Invoice,
                    formatScheduleCurrency(r.Invoice_Balance),
                    formatScheduleCurrency(r.Applied),
                    formatScheduleCurrency(r.Remaining_After)
                  ])}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Journal Entry Mappings</h3>
                <DataTable
                  columns={["Date", "JE Type", "Account", "Acct #", "Debit", "Credit", "Memo"]}
                  rows={formatJournalRows(cashJournals)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Export</h3>
                <p className="card__subtitle">
                  Download a single Excel workbook with summary, applications, and journal sheets.
                </p>
                <button type="button" onClick={handleCashExport}>
                  Download Excel Workbook
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {topic === "payroll" && (
        <section className="grid">
          <div className="card">
            <h3 className="card__title">Payroll Accrual + Settlement</h3>
            <p className="card__subtitle">
              Accrue payroll in the work period, then clear liabilities when cash is paid.
            </p>

            <div className="controls">
              <div className="controls__row">
                <div>
                  <label htmlFor="pay-emp">Employee</label>
                  <input id="pay-emp" type="text" value={payEmployee} onChange={(e) => setPayEmployee(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="pay-gross">Gross Pay</label>
                  <input id="pay-gross" type="number" min={0} step={10} value={payGross} onChange={(e) => setPayGross(e.target.value)} />
                </div>
              </div>

              <div className="controls__row">
                <div>
                  <label htmlFor="pay-start">Period Start</label>
                  <input id="pay-start" type="date" value={payStart} onChange={(e) => setPayStart(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="pay-end">Period End</label>
                  <input id="pay-end" type="date" value={payEnd} onChange={(e) => setPayEnd(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="pay-date">Pay Date</label>
                  <input id="pay-date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                </div>
              </div>

              <div className="controls__row">
                <div>
                  <label>Employee Deductions</label>
                  <div className="card__note">
                    Fed:{" "}
                    <input type="number" value={dedFed} onChange={(e) => setDedFed(e.target.value)} />{" "}
                    Social Security:{" "}
                    <input
                      type="number"
                      value={dedSocialSecurity}
                      onChange={(e) => setDedSocialSecurity(e.target.value)}
                    />{" "}
                    Medicare:{" "}
                    <input type="number" value={dedMed} onChange={(e) => setDedMed(e.target.value)} />{" "}
                    State:{" "}
                    <input type="number" value={dedState} onChange={(e) => setDedState(e.target.value)} />{" "}
                    401(k):{" "}
                    <input type="number" value={ded401k} onChange={(e) => setDed401k(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="controls__row">
                <div>
                  <label>Employer Taxes</label>
                  <div className="card__note">
                    Social Security:{" "}
                    <input
                      type="number"
                      value={empSocialSecurity}
                      onChange={(e) => setEmpSocialSecurity(e.target.value)}
                    />{" "}
                    Medicare:{" "}
                    <input type="number" value={empMed} onChange={(e) => setEmpMed(e.target.value)} />{" "}
                    FUTA:{" "}
                    <input type="number" value={empFuta} onChange={(e) => setEmpFuta(e.target.value)} />{" "}
                    SUTA:{" "}
                    <input type="number" value={empSuta} onChange={(e) => setEmpSuta(e.target.value)} />
                  </div>
                </div>
              </div>

              <button type="button" onClick={handlePayrollCalculate}>
                Generate Payroll Entries
              </button>
              {payError && <div className="notice">{payError}</div>}
            </div>
          </div>

          {payResult && (
            <>
              <div className="card">
                <h3 className="card__title">Summary Metrics</h3>
                <div className="metric-grid">
                  {payMetrics.map(([label, value]) => (
                    <MetricCard key={label} label={label} value={value} />
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="card__title">Accrual Breakdown</h3>
                <DataTable
                  columns={["Line Item", "Amount"]}
                  rows={payAccrualRows.map((r) => [r.Label, formatScheduleCurrency(r.Amount)])}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Settlement Breakdown</h3>
                <DataTable
                  columns={["Line Item", "Amount"]}
                  rows={payPaymentRows.map((r) => [r.Label, formatScheduleCurrency(r.Amount)])}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Journal Entry Mappings</h3>
                <DataTable
                  columns={["Date", "JE Type", "Account", "Acct #", "Debit", "Credit", "Memo"]}
                  rows={formatJournalRows(payJournals)}
                />
              </div>

              <div className="card">
                <h3 className="card__title">Export</h3>
                <p className="card__subtitle">
                  Download a single Excel workbook with summary, accrual, settlement, and journal sheets.
                </p>
                <button type="button" onClick={handlePayrollExport}>
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
