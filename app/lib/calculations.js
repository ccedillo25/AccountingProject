const DEFAULT_END_DATE = "2023-12-31";

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const parseDateInput = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(Date.UTC(year, month - 1, day));
};

const formatDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addMonths = (date, months) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));

const addDays = (date, days) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

const monthEnd = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const monthsBetweenInclusive = (startDate, endDate) => {
  const startYear = startDate.getUTCFullYear();
  const startMonth = startDate.getUTCMonth();
  const endYear = endDate.getUTCFullYear();
  const endMonth = endDate.getUTCMonth();
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
};

const formatCurrency = (value) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatNumber = (value) => value.toLocaleString("en-US");

const formatSignedCurrency = (value) => {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${formatCurrency(Math.abs(value))}`;
};

export const createAmortizationSchedule = (cost, startDateStr, endDateStr) => {
  const startDate = parseDateInput(startDateStr);
  const endDate = parseDateInput(endDateStr);
  if (!startDate || !endDate) {
    return { error: "Invalid date format. Use YYYY-MM-DD." };
  }
  if (endDate < startDate) {
    return { error: "End date must be after start date." };
  }

  const totalMonths = monthsBetweenInclusive(startDate, endDate);
  if (totalMonths <= 0) {
    return { error: "End date must be after start date." };
  }

  const monthlyExpense = cost / totalMonths;
  const schedule = [];
  let accumulated = 0;

  for (let i = 0; i < totalMonths; i += 1) {
    const postingDate = monthEnd(addMonths(startDate, i));
    let expenseToRecognize = monthlyExpense;

    if (i === totalMonths - 1) {
      expenseToRecognize = cost - accumulated;
    }

    accumulated += expenseToRecognize;
    const nbv = cost - accumulated;

    schedule.push({
      Posting_Date: formatDate(postingDate),
      Amortization_Expense: round2(expenseToRecognize),
      Accumulated_Amortization: round2(accumulated),
      Net_Book_Value_NBV: round2(nbv)
    });
  }

  return {
    monthlyExpense: round2(monthlyExpense),
    totalMonths,
    schedule
  };
};

export const createAmortizationSummary = (cost, term, rate) => [
  ["Total License Fee", `$${formatCurrency(cost)}`],
  ["Total Term (Months)", term],
  ["Monthly Expense Recognition", `$${formatCurrency(rate)}`],
  ["Annual Expense Recognition", `$${formatCurrency(rate * 12)}`]
];

export const generateAmortizationJournals = (schedule, licenseName, totalCost) => {
  if (!schedule.length) return [];
  const entries = [];
  const initialDate = schedule[0].Posting_Date;

  entries.push({
    Date: initialDate,
    JE_Type: "PREPAID",
    License: licenseName,
    Account_Description: "Prepaid Content Licensing",
    Account_Number: 14001,
    Debit: totalCost,
    Credit: 0
  });
  entries.push({
    Date: initialDate,
    JE_Type: "PREPAID",
    License: licenseName,
    Account_Description: "Cash",
    Account_Number: 10000,
    Debit: 0,
    Credit: totalCost
  });

  schedule.forEach((row) => {
    entries.push({
      Date: row.Posting_Date,
      JE_Type: "EXPENSE",
      License: licenseName,
      Account_Description: "Content Expense",
      Account_Number: 50011,
      Debit: row.Amortization_Expense,
      Credit: 0
    });
    entries.push({
      Date: row.Posting_Date,
      JE_Type: "EXPENSE",
      License: licenseName,
      Account_Description: "Prepaid Content Licensing",
      Account_Number: 14001,
      Debit: 0,
      Credit: row.Amortization_Expense
    });
  });

  return entries;
};

export const generateQuarterlyPaymentJournals = (totalCost, startDateStr, licenseName) => {
  const startDate = parseDateInput(startDateStr);
  if (!startDate) return [];

  const endDate = parseDateInput(DEFAULT_END_DATE);
  const totalMonths = monthsBetweenInclusive(startDate, endDate);
  const numQuarters = Math.floor((totalMonths + 2) / 3);
  const quarterlyPayment = totalCost / numQuarters;

  const entries = [];
  for (let i = 0; i < numQuarters; i += 1) {
    const accrualDate = monthEnd(addMonths(startDate, (i + 1) * 3));
    const paymentDate = addDays(accrualDate, 30);
    const payment = i === numQuarters - 1
      ? totalCost - quarterlyPayment * (numQuarters - 1)
      : quarterlyPayment;

    entries.push({
      Date: formatDate(paymentDate),
      JE_Type: "PAYMENT",
      License: licenseName,
      Account_Description: "Accounts Payable (Vendor Invoice)",
      Account_Number: 22611,
      Debit: round2(payment),
      Credit: 0
    });
    entries.push({
      Date: formatDate(paymentDate),
      JE_Type: "PAYMENT",
      License: licenseName,
      Account_Description: "Cash",
      Account_Number: 10000,
      Debit: 0,
      Credit: round2(payment)
    });
  }

  return entries;
};

export const parseStreamsInput = (text) => {
  if (!text || !text.trim()) return [];
  const cleaned = text.replace(/\n/g, ",");
  const values = cleaned.split(",").map((value) => value.trim()).filter(Boolean);
  const streams = [];

  for (const value of values) {
    const normalized = value.replace(/_/g, "");
    if (!/^\d+$/.test(normalized)) {
      return [];
    }
    streams.push(Number(normalized));
  }

  return streams;
};

export const createVariableRoyaltySchedule = (streams, rate, startDateStr) => {
  if (!streams.length) {
    return { error: "Enter at least one monthly stream value." };
  }

  const startDate = parseDateInput(startDateStr);
  if (!startDate) {
    return { error: "Invalid date format. Use YYYY-MM-DD." };
  }

  const schedule = [];
  let accrued = 0;

  streams.forEach((streamCount, index) => {
    const postingDate = monthEnd(addMonths(startDate, index));
    const expense = streamCount * rate;
    accrued += expense;
    schedule.push({
      Posting_Date: formatDate(postingDate),
      Streams: streamCount,
      Royalty_Expense: round2(expense),
      Accrued_Payable: round2(accrued)
    });
  });

  return { schedule };
};

export const generateVariableRoyaltyJournals = (schedule, licenseName) => {
  if (!schedule.length) return [];
  const entries = [];

  schedule.forEach((row) => {
    entries.push({
      Date: row.Posting_Date,
      JE_Type: "ROYALTY",
      License: licenseName,
      Account_Description: "Content Expense",
      Account_Number: 50011,
      Debit: row.Royalty_Expense,
      Credit: 0
    });
    entries.push({
      Date: row.Posting_Date,
      JE_Type: "ROYALTY",
      License: licenseName,
      Account_Description: "Accounts Payable (Royalty)",
      Account_Number: 22611,
      Debit: 0,
      Credit: row.Royalty_Expense
    });
  });

  return entries;
};

export const generateVariableRoyaltyPayments = (schedule, licenseName) => {
  if (!schedule.length) return [];
  const entries = [];
  let quarterTotal = 0;
  let quarterEndDate = schedule[0].Posting_Date;

  schedule.forEach((row, index) => {
    quarterTotal += row.Royalty_Expense;
    quarterEndDate = row.Posting_Date;

    const isQuarterEnd = (index + 1) % 3 === 0 || index === schedule.length - 1;
    if (isQuarterEnd) {
      entries.push({
        Date: quarterEndDate,
        JE_Type: "PAYMENT",
        License: licenseName,
        Account_Description: "Accounts Payable (Royalty)",
        Account_Number: 22611,
        Debit: round2(quarterTotal),
        Credit: 0
      });
      entries.push({
        Date: quarterEndDate,
        JE_Type: "PAYMENT",
        License: licenseName,
        Account_Description: "Cash",
        Account_Number: 10000,
        Debit: 0,
        Credit: round2(quarterTotal)
      });
      quarterTotal = 0;
    }
  });

  return entries;
};

export const createMgHybridSchedule = (streams, rate, mgAmount, startDateStr) => {
  if (!streams.length) {
    return { error: "Enter at least one monthly stream value." };
  }
  if (mgAmount <= 0) {
    return { error: "Minimum guarantee must be greater than zero." };
  }

  const startDate = parseDateInput(startDateStr);
  if (!startDate) {
    return { error: "Invalid date format. Use YYYY-MM-DD." };
  }

  const schedule = [];
  let remainingPrepaid = mgAmount;
  let accruedOverage = 0;

  streams.forEach((streamCount, index) => {
    const postingDate = monthEnd(addMonths(startDate, index));
    const usageExpense = streamCount * rate;
    const prepaidApplied = Math.min(remainingPrepaid, usageExpense);
    const overageExpense = usageExpense - prepaidApplied;

    remainingPrepaid -= prepaidApplied;
    accruedOverage += overageExpense;

    schedule.push({
      Posting_Date: formatDate(postingDate),
      Streams: streamCount,
      Usage_Expense: round2(usageExpense),
      Prepaid_Amortization: round2(prepaidApplied),
      Overage_Expense: round2(overageExpense),
      Ending_Prepaid: round2(remainingPrepaid),
      Accrued_Overage: round2(accruedOverage)
    });
  });

  return { schedule };
};

export const generateMgHybridJournals = (schedule, licenseName, mgAmount, startDateStr) => {
  if (!schedule.length) return [];
  const entries = [];
  const initialDate = startDateStr;

  entries.push({
    Date: initialDate,
    JE_Type: "MG_PREPAY",
    License: licenseName,
    Account_Description: "Prepaid Content (MG)",
    Account_Number: 14001,
    Debit: mgAmount,
    Credit: 0
  });
  entries.push({
    Date: initialDate,
    JE_Type: "MG_PREPAY",
    License: licenseName,
    Account_Description: "Cash",
    Account_Number: 10000,
    Debit: 0,
    Credit: mgAmount
  });

  schedule.forEach((row) => {
    if (row.Prepaid_Amortization > 0) {
      entries.push({
        Date: row.Posting_Date,
        JE_Type: "MG_USAGE",
        License: licenseName,
        Account_Description: "Content Expense",
        Account_Number: 50011,
        Debit: row.Prepaid_Amortization,
        Credit: 0
      });
      entries.push({
        Date: row.Posting_Date,
        JE_Type: "MG_USAGE",
        License: licenseName,
        Account_Description: "Prepaid Content (MG)",
        Account_Number: 14001,
        Debit: 0,
        Credit: row.Prepaid_Amortization
      });
    }

    if (row.Overage_Expense > 0) {
      entries.push({
        Date: row.Posting_Date,
        JE_Type: "MG_OVERAGE",
        License: licenseName,
        Account_Description: "Content Expense",
        Account_Number: 50011,
        Debit: row.Overage_Expense,
        Credit: 0
      });
      entries.push({
        Date: row.Posting_Date,
        JE_Type: "MG_OVERAGE",
        License: licenseName,
        Account_Description: "Accounts Payable (Royalty)",
        Account_Number: 22611,
        Debit: 0,
        Credit: row.Overage_Expense
      });
    }
  });

  return entries;
};

export const parseCsvAmountPairs = (text) => {
  if (!text || !text.trim()) return [];
  const cleaned = text.replace(/\n/g, ",");
  const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  const items = [];

  for (const part of parts) {
    const [labelRaw, amountRaw] = part.split(":").map((segment) => segment.trim());
    if (!labelRaw || !amountRaw) {
      return [];
    }
    const normalized = amountRaw.replace(/\$/g, "").replace(/,/g, "");
    const amount = Number(normalized);
    if (Number.isNaN(amount)) {
      return [];
    }
    items.push({ label: labelRaw, amount });
  }

  return items;
};

export const createExpenseCodingModel = ({
  amount,
  invoiceDate,
  serviceStart,
  serviceEnd,
  payDate,
  category,
  prepaidPolicy
}) => {
  if (!amount || amount <= 0) {
    return { error: "Amount must be greater than zero." };
  }

  const invoice = parseDateInput(invoiceDate);
  const start = parseDateInput(serviceStart);
  const end = parseDateInput(serviceEnd);
  const pay = parseDateInput(payDate);

  if (!invoice || !start || !end) {
    return { error: "Enter valid invoice and service dates (YYYY-MM-DD)." };
  }
  if (end < start) {
    return { error: "Service end date must be after service start date." };
  }

  const serviceMonths = monthsBetweenInclusive(start, end);
  const isMultiMonth = serviceMonths > 1;
  let method = "expense";

  if (prepaidPolicy === "force_prepaid") {
    method = "prepaid";
  } else if (prepaidPolicy === "force_expense") {
    method = "expense";
  } else {
    method = isMultiMonth ? "prepaid" : "expense";
  }

  const schedule = [];
  let cumulative = 0;

  if (method === "prepaid") {
    const monthlyExpense = amount / serviceMonths;
    for (let i = 0; i < serviceMonths; i += 1) {
      const postingDate = monthEnd(addMonths(start, i));
      let expense = monthlyExpense;
      if (i === serviceMonths - 1) {
        expense = amount - cumulative;
      }
      cumulative += expense;
      schedule.push({
        Posting_Date: formatDate(postingDate),
        Expense: round2(expense),
        Cumulative_Expense: round2(cumulative),
        Remaining_Balance: round2(amount - cumulative)
      });
    }
  } else {
    const postingDate = monthEnd(invoice);
    cumulative = amount;
    schedule.push({
      Posting_Date: formatDate(postingDate),
      Expense: round2(amount),
      Cumulative_Expense: round2(cumulative),
      Remaining_Balance: 0
    });
  }

  const metrics = [
    ["Amount", `$${formatCurrency(amount)}`],
    ["Service Months", serviceMonths],
    ["Recognition Method", method === "prepaid" ? "Prepaid + Amortize" : "Expense Immediately"]
  ];

  if (method === "prepaid") {
    metrics.push(["Monthly Expense", `$${formatCurrency(amount / serviceMonths)}`]);
  } else {
    metrics.push(["Expense Month", formatDate(monthEnd(invoice))]);
  }

  return {
    schedule,
    metrics,
    assumptions: {
      method,
      amount,
      invoiceDate: formatDate(invoice),
      payDate: pay ? formatDate(pay) : "",
      category: category || "General"
    }
  };
};

export const generateExpenseCodingJournals = (schedule, assumptions) => {
  if (!schedule.length) return [];
  const entries = [];
  const {
    method,
    amount,
    invoiceDate,
    payDate,
    category
  } = assumptions;

  const expenseAccount = `Expense - ${category}`;

  if (method === "prepaid") {
    entries.push({
      Date: invoiceDate,
      JE_Type: "INVOICE",
      Account_Description: "Prepaid Expenses",
      Account_Number: 14010,
      Debit: amount,
      Credit: 0,
      Memo: "Record prepaid invoice"
    });
    entries.push({
      Date: invoiceDate,
      JE_Type: "INVOICE",
      Account_Description: "Accounts Payable",
      Account_Number: 21100,
      Debit: 0,
      Credit: amount,
      Memo: "Record vendor liability"
    });

    schedule.forEach((row) => {
      entries.push({
        Date: row.Posting_Date,
        JE_Type: "AMORT",
        Account_Description: expenseAccount,
        Account_Number: 61000,
        Debit: row.Expense,
        Credit: 0,
        Memo: "Monthly recognition"
      });
      entries.push({
        Date: row.Posting_Date,
        JE_Type: "AMORT",
        Account_Description: "Prepaid Expenses",
        Account_Number: 14010,
        Debit: 0,
        Credit: row.Expense,
        Memo: "Reduce prepaid balance"
      });
    });
  } else {
    entries.push({
      Date: invoiceDate,
      JE_Type: "INVOICE",
      Account_Description: expenseAccount,
      Account_Number: 61000,
      Debit: amount,
      Credit: 0,
      Memo: "Expense immediately"
    });
    entries.push({
      Date: invoiceDate,
      JE_Type: "INVOICE",
      Account_Description: "Accounts Payable",
      Account_Number: 21100,
      Debit: 0,
      Credit: amount,
      Memo: "Record vendor liability"
    });
  }

  if (payDate) {
    entries.push({
      Date: payDate,
      JE_Type: "PAYMENT",
      Account_Description: "Accounts Payable",
      Account_Number: 21100,
      Debit: amount,
      Credit: 0,
      Memo: "Clear AP on payment"
    });
    entries.push({
      Date: payDate,
      JE_Type: "PAYMENT",
      Account_Description: "Cash",
      Account_Number: 10000,
      Debit: 0,
      Credit: amount,
      Memo: "Cash settlement"
    });
  }

  return entries;
};

export const createCashApplicationModel = ({
  customer,
  paymentAmount,
  paymentDate,
  openInvoices
}) => {
  if (!paymentAmount || paymentAmount <= 0) {
    return { error: "Payment amount must be greater than zero." };
  }
  if (!openInvoices.length) {
    return { error: "Enter at least one open invoice." };
  }

  let remainingPayment = paymentAmount;
  let totalApplied = 0;

  const applications = openInvoices.map((invoice) => {
    const applied = Math.min(remainingPayment, invoice.amount);
    remainingPayment -= applied;
    totalApplied += applied;
    return {
      Invoice: invoice.label,
      Invoice_Balance: invoice.amount,
      Applied: round2(applied),
      Remaining_After: round2(invoice.amount - applied)
    };
  });

  const unapplied = round2(paymentAmount - totalApplied);
  const remainingAr = round2(openInvoices.reduce((sum, row) => sum + row.amount, 0) - totalApplied);

  return {
    applications,
    metrics: [
      ["Customer", customer || "Customer"],
      ["Payment Amount", `$${formatCurrency(paymentAmount)}`],
      ["Total Applied", `$${formatCurrency(totalApplied)}`],
      ["Unapplied Cash", `$${formatCurrency(unapplied)}`],
      ["Remaining AR", `$${formatCurrency(remainingAr)}`]
    ],
    assumptions: {
      customer: customer || "Customer",
      paymentAmount,
      paymentDate
    }
  };
};

export const generateCashApplicationJournals = (applications, assumptions) => {
  if (!applications.length) return [];
  const paymentAmount = assumptions.paymentAmount;
  const paymentDate = assumptions.paymentDate || applications[0].Posting_Date;
  const totalApplied = applications.reduce((sum, row) => sum + row.Applied, 0);
  const unapplied = round2(paymentAmount - totalApplied);

  const entries = [
    {
      Date: paymentDate,
      JE_Type: "RECEIPT",
      Account_Description: "Cash",
      Account_Number: 10000,
      Debit: paymentAmount,
      Credit: 0,
      Memo: `Payment received - ${assumptions.customer}`
    },
    {
      Date: paymentDate,
      JE_Type: "RECEIPT",
      Account_Description: "Accounts Receivable",
      Account_Number: 12000,
      Debit: 0,
      Credit: totalApplied,
      Memo: "Apply payment to AR"
    }
  ];

  if (unapplied > 0) {
    entries.push({
      Date: paymentDate,
      JE_Type: "RECEIPT",
      Account_Description: "Customer Deposits (Unapplied Cash)",
      Account_Number: 23000,
      Debit: 0,
      Credit: unapplied,
      Memo: "Record unapplied cash"
    });
  }

  return entries;
};

export const createPayrollModel = ({
  employeeName,
  periodStart,
  periodEnd,
  payDate,
  grossPay,
  deductions,
  employerTaxes
}) => {
  if (!grossPay || grossPay <= 0) {
    return { error: "Gross pay must be greater than zero." };
  }

  const start = parseDateInput(periodStart);
  const end = parseDateInput(periodEnd);
  const pay = parseDateInput(payDate);

  if (!start || !end || !pay) {
    return { error: "Enter valid payroll dates (YYYY-MM-DD)." };
  }

  const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + Number(value || 0), 0);
  const totalEmployerTaxes = Object.values(employerTaxes).reduce((sum, value) => sum + Number(value || 0), 0);
  const netPay = round2(grossPay - totalDeductions);

  if (netPay < 0) {
    return { error: "Deductions exceed gross pay." };
  }

  const totalCashOut = round2(netPay + totalDeductions + totalEmployerTaxes);

  return {
    metrics: [
      ["Employee", employeeName],
      ["Gross Pay", `$${formatCurrency(grossPay)}`],
      ["Net Pay", `$${formatCurrency(netPay)}`],
      ["Total Deductions", `$${formatCurrency(totalDeductions)}`],
      ["Employer Taxes", `$${formatCurrency(totalEmployerTaxes)}`],
      ["Total Cash Out", `$${formatCurrency(totalCashOut)}`]
    ],
    accrual: [
      { Label: "Gross Wages", Amount: round2(grossPay) },
      { Label: "Employer Taxes", Amount: round2(totalEmployerTaxes) },
      { Label: "Employee Withholdings", Amount: round2(totalDeductions) },
      { Label: "Net Pay Liability", Amount: round2(netPay) }
    ],
    payment: [
      { Label: "Net Pay", Amount: round2(netPay) },
      { Label: "Tax + Withholding Remit", Amount: round2(totalDeductions + totalEmployerTaxes) },
      { Label: "Total Cash Paid", Amount: round2(totalCashOut) }
    ],
    details: {
      grossPay: round2(grossPay),
      netPay,
      deductions: {
        fed: Number(deductions.fed || 0),
        socialSecurity: Number(deductions.socialSecurity || 0),
        medicare: Number(deductions.medicare || 0),
        state: Number(deductions.state || 0),
        k401: Number(deductions.k401 || 0)
      },
      employerTaxes: {
        socialSecurity: Number(employerTaxes.socialSecurity || 0),
        medicare: Number(employerTaxes.medicare || 0),
        futa: Number(employerTaxes.futa || 0),
        suta: Number(employerTaxes.suta || 0)
      },
      totals: {
        deductions: round2(totalDeductions),
        employerTaxes: round2(totalEmployerTaxes),
        cashOut: round2(totalCashOut)
      }
    },
    assumptions: {
      employeeName,
      periodStart: formatDate(start),
      periodEnd: formatDate(end),
      payDate: formatDate(pay)
    }
  };
};

export const generatePayrollJournals = (payResult) => {
  if (!payResult) return [];
  const { details, assumptions } = payResult;
  const accrualDate = assumptions.periodEnd;
  const paymentDate = assumptions.payDate;

  const entries = [
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "Wages Expense",
      Account_Number: 60000,
      Debit: details.grossPay,
      Credit: 0,
      Memo: "Accrue gross wages"
    },
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "Payroll Tax Expense",
      Account_Number: 61010,
      Debit: details.totals.employerTaxes,
      Credit: 0,
      Memo: "Accrue employer taxes"
    },
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "Payroll Payable (Net Pay)",
      Account_Number: 21010,
      Debit: 0,
      Credit: details.netPay,
      Memo: "Record net pay liability"
    },
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "Payroll Taxes Payable",
      Account_Number: 21020,
      Debit: 0,
      Credit: details.deductions.fed,
      Memo: "Federal withholding"
    },
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "Payroll Taxes Payable",
      Account_Number: 21021,
      Debit: 0,
      Credit: details.deductions.socialSecurity,
      Memo: "Social Security withholding"
    },
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "Payroll Taxes Payable",
      Account_Number: 21022,
      Debit: 0,
      Credit: details.deductions.medicare,
      Memo: "Medicare withholding"
    },
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "Payroll Taxes Payable",
      Account_Number: 21023,
      Debit: 0,
      Credit: details.deductions.state,
      Memo: "State withholding"
    },
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "401(k) Payable",
      Account_Number: 21024,
      Debit: 0,
      Credit: details.deductions.k401,
      Memo: "401(k) deferral"
    },
    {
      Date: accrualDate,
      JE_Type: "ACCRUAL",
      Account_Description: "Employer Taxes Payable",
      Account_Number: 21025,
      Debit: 0,
      Credit: details.totals.employerTaxes,
      Memo: "Employer tax liability"
    },
    {
      Date: paymentDate,
      JE_Type: "PAYMENT",
      Account_Description: "Payroll Payable (Net Pay)",
      Account_Number: 21010,
      Debit: details.netPay,
      Credit: 0,
      Memo: "Pay employees"
    },
    {
      Date: paymentDate,
      JE_Type: "PAYMENT",
      Account_Description: "Payroll Taxes Payable",
      Account_Number: 21020,
      Debit: details.deductions.fed,
      Credit: 0,
      Memo: "Remit federal withholding"
    },
    {
      Date: paymentDate,
      JE_Type: "PAYMENT",
      Account_Description: "Payroll Taxes Payable",
      Account_Number: 21021,
      Debit: details.deductions.socialSecurity,
      Credit: 0,
      Memo: "Remit Social Security withholding"
    },
    {
      Date: paymentDate,
      JE_Type: "PAYMENT",
      Account_Description: "Payroll Taxes Payable",
      Account_Number: 21022,
      Debit: details.deductions.medicare,
      Credit: 0,
      Memo: "Remit Medicare withholding"
    },
    {
      Date: paymentDate,
      JE_Type: "PAYMENT",
      Account_Description: "Payroll Taxes Payable",
      Account_Number: 21023,
      Debit: details.deductions.state,
      Credit: 0,
      Memo: "Remit state withholding"
    },
    {
      Date: paymentDate,
      JE_Type: "PAYMENT",
      Account_Description: "401(k) Payable",
      Account_Number: 21024,
      Debit: details.deductions.k401,
      Credit: 0,
      Memo: "Remit 401(k) deferral"
    },
    {
      Date: paymentDate,
      JE_Type: "PAYMENT",
      Account_Description: "Employer Taxes Payable",
      Account_Number: 21025,
      Debit: details.totals.employerTaxes,
      Credit: 0,
      Memo: "Remit employer taxes"
    },
    {
      Date: paymentDate,
      JE_Type: "PAYMENT",
      Account_Description: "Cash",
      Account_Number: 10000,
      Debit: 0,
      Credit: details.totals.cashOut,
      Memo: "Total payroll cash out"
    }
  ];

  return entries;
};

export const createReconciliationModel = ({ account, glBalance, subledgerBalance, reconItems }) => {
  const items = reconItems ?? [];
  const reconTotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const explained = subledgerBalance + reconTotal;
  const difference = glBalance - explained;

  const table = items.map((item, index) => ({
    Row: index + 1,
    Description: item.label,
    Amount: Number(item.amount || 0)
  }));

  return {
    metrics: [
      ["Account", account || "Account"],
      ["GL Balance", formatSignedCurrency(glBalance)],
      ["Support Balance", formatSignedCurrency(subledgerBalance)],
      ["Recon Items Total", formatSignedCurrency(reconTotal)],
      ["Explained Balance", formatSignedCurrency(explained)],
      ["Difference", formatSignedCurrency(difference)]
    ],
    table
  };
};

export const formatScheduleCurrency = (value) => `$${formatCurrency(value)}`;
export const formatScheduleNumber = (value) => formatNumber(value);
