import streamlit as st
import pandas as pd
from dateutil.relativedelta import relativedelta
import io
import datetime

st.set_page_config(
    page_title="Interactive Technical Accounting Guide",
    page_icon="📚",
    layout="wide"
)

# --- CONFIGURATION (You can adjust these defaults) ---
DEFAULT_COST = 200_000_000.00
DEFAULT_START_DATE = datetime.date(2020, 12, 1)
DEFAULT_END_DATE = datetime.date(2023, 12, 31)
LICENSE_NAME = "Content Licensing Agreement"
MG_DEFAULT = 500_000.00
RATE_DEFAULT = 0.005 # $0.005 per stream


# ==============================================================================
# GLOBAL STYLE (STREAMLIT THEME)
# ==============================================================================

def apply_global_styles():
    """Injects custom CSS to improve Streamlit layout and typography."""
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Space+Grotesk:wght@400;500;600&display=swap');

    :root {
        --ink: #1a1a1a;
        --subtle: #4a4a4a;
        --accent: #0d6b5f;
        --accent-2: #f08a5b;
        --accent-3: #1f4e5f;
        --panel: #ffffff;
        --soft: #f2efe9;
        --border: #e5dfd6;
        --shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    }

    html, body, [class*="stApp"] {
        font-family: "Space Grotesk", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
            radial-gradient(circle at 10% 10%, rgba(208, 226, 220, 0.55), transparent 40%),
            radial-gradient(circle at 90% 5%, rgba(248, 226, 207, 0.6), transparent 35%),
            linear-gradient(135deg, #f6f3ee 0%, #eef5f3 100%);
    }

    [data-testid="stAppViewContainer"] {
        background: transparent;
    }

    [data-testid="stHeader"] {
        background: transparent;
    }

    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0e1411 0%, #0b1b17 100%);
        border-right: 1px solid #1a2a24;
    }

    [data-testid="stSidebar"] * {
        color: #f4f1ea;
    }

    h1, h2, h3 {
        font-family: "Fraunces", "Times New Roman", serif;
        letter-spacing: 0.2px;
    }

    h1 {
        font-weight: 700;
    }

    h2, h3 {
        font-weight: 600;
    }

    p, li, .stMarkdown {
        color: var(--subtle);
    }

    .block-container {
        padding-top: 2.5rem;
        padding-bottom: 2.5rem;
        max-width: 1200px;
    }

    .stInfo, .stSuccess, .stWarning, .stError {
        border-radius: 14px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
    }

    .app-hero {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 24px;
        border: 1px solid var(--border);
        padding: 2.5rem 2.8rem;
        box-shadow: var(--shadow);
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
        animation: rise 0.6s ease both;
    }

    .app-hero::after {
        content: "";
        position: absolute;
        top: -80px;
        right: -80px;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(15, 107, 95, 0.18), transparent 60%);
        border-radius: 50%;
    }

    .hero-kicker {
        text-transform: uppercase;
        letter-spacing: 2.5px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--accent-3);
        margin-bottom: 0.6rem;
    }

    .hero-title {
        font-family: "Fraunces", "Times New Roman", serif;
        font-size: clamp(2.2rem, 2.6vw, 3rem);
        font-weight: 700;
        margin-bottom: 0.75rem;
    }

    .hero-subtitle {
        font-size: 1.05rem;
        max-width: 720px;
        color: var(--subtle);
        margin-bottom: 1.6rem;
    }

    .app-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
    }

    .app-badge {
        background: rgba(13, 107, 95, 0.12);
        border: 1px solid rgba(13, 107, 95, 0.25);
        color: var(--accent);
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .app-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.2rem;
        margin-bottom: 2rem;
    }

    .app-card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.4rem;
        box-shadow: var(--shadow);
        min-height: 160px;
        animation: rise 0.8s ease both;
    }

    .app-card h4 {
        font-family: "Fraunces", "Times New Roman", serif;
        margin-bottom: 0.4rem;
    }

    .app-card p {
        margin-bottom: 0.2rem;
    }

    .sidebar-card {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 0.85rem 0.95rem;
        margin-top: 0.6rem;
        font-size: 0.85rem;
    }

    .stDataFrame, [data-testid="stTable"] {
        background: var(--panel);
        border-radius: 14px;
        box-shadow: var(--shadow);
        padding: 0.5rem;
    }

    [data-testid="stFileDownloadButton"] button,
    .stButton>button {
        background: var(--accent);
        color: #ffffff;
        border: none;
        border-radius: 999px;
        padding: 0.6rem 1.4rem;
        font-weight: 600;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
        box-shadow: 0 8px 18px rgba(13, 107, 95, 0.25);
    }

    [data-testid="stFileDownloadButton"] button:hover,
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px rgba(13, 107, 95, 0.35);
    }

    .stTextInput input, .stNumberInput input, .stDateInput input, .stTextArea textarea, .stSelectbox div {
        border-radius: 10px;
        border: 1px solid var(--border);
    }

    hr {
        border: none;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--border), transparent);
    }

    @keyframes rise {
        from {
            opacity: 0;
            transform: translateY(12px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    </style>
    """, unsafe_allow_html=True)


# ==============================================================================
# A. CORE AMORTIZATION CALCULATION FUNCTIONS (Fixed Fee Model)
# ==============================================================================

def create_amortization_schedule(cost, start_date_str, end_date_str):
    """Calculates the Straight-Line Amortization Schedule and NBV."""
    try:
        start_date = pd.to_datetime(start_date_str)
        end_date = pd.to_datetime(end_date_str)
    except ValueError:
        return 0, 0, pd.DataFrame(), "Invalid Date Format. Use YYYY-MM-DD."

    diff = relativedelta(end_date, start_date)
    total_months = diff.years * 12 + diff.months + 1 
    if total_months <= 0:
        return 0, 0, pd.DataFrame(), "End date must be after start date."
        
    monthly_expense = cost / total_months
    
    posting_dates = []
    current_date = start_date
    while current_date <= end_date:
        posting_dates.append(current_date + pd.offsets.MonthEnd(0))
        current_date += relativedelta(months=1)
        
    schedule_data = []
    accumulated_amortization = 0.00
    
    for month_num, posting_date in enumerate(posting_dates):
        expense_to_recognize = monthly_expense
        
        # Final month adjustment
        if month_num == total_months - 1:
            remaining_nbv = cost - accumulated_amortization
            expense_to_recognize = remaining_nbv 

        accumulated_amortization += expense_to_recognize
        net_book_value = cost - accumulated_amortization
        
        schedule_data.append({
            'Posting_Date': posting_date.strftime('%Y-%m-%d'),
            'Amortization_Expense': round(expense_to_recognize, 2),
            'Accumulated_Amortization': round(accumulated_amortization, 2),
            'Net_Book_Value_NBV': round(net_book_value, 2)
        })
        
    return monthly_expense, total_months, pd.DataFrame(schedule_data), None

# Helper function for the Amortization tool output
def create_amortization_summary_df(cost, term, rate):
    """Creates the summary table for display, using comma formatting."""
    summary_data = [
        ("Total License Fee", f"${cost:,.2f}"),
        ("Total Term (Months)", term),
        ("Monthly Expense Recognition", f"${rate:,.2f}"),
        ("Annual Expense Recognition", f"${rate*12:,.2f}")
    ]
    return pd.DataFrame(summary_data, columns=['Metric', 'Value'])

# --- Journal Entry Generation (Shared Logic) ---
def generate_amortization_journals(schedule_df, license_name, total_cost):
    """Generates the initial prepaid JE and monthly expense JEs based on the input schedule_df size."""
    all_entries = []
    
    if schedule_df.empty:
        return pd.DataFrame()

    formatted_total_cost = total_cost
    initial_date = schedule_df['Posting_Date'].iloc[0]
    
    # 1. INITIAL PREPAID ENTRY 
    all_entries.append({
        'Date': initial_date, 'JE_Type': 'PREPAID', 'License': license_name,
        'Account_Description': 'Prepaid Content Licensing', 'Account_Number': 14001, 'Debit': formatted_total_cost, 'Credit': 0.00
    })
    all_entries.append({
        'Date': initial_date, 'JE_Type': 'PREPAID', 'License': license_name,
        'Account_Description': 'Accounts Payable (Vendor Invoice)', 'Account_Number': 22611, 'Debit': 0.00, 'Credit': formatted_total_cost
    })
    
    # 2. MONTHLY EXPENSE RECOGNITION ENTRIES 
    for index, row in schedule_df.iterrows():
        expense = row['Amortization_Expense']
        date = row['Posting_Date']
        
        all_entries.append({
            'Date': date, 'JE_Type': 'EXPENSE', 'License': license_name,
            'Account_Description': 'Content Expense', 'Account_Number': 50011, 'Debit': expense, 'Credit': 0.00
        })
        all_entries.append({
            'Date': date, 'JE_Type': 'EXPENSE', 'License': license_name,
            'Account_Description': 'Prepaid Content Licensing', 'Account_Number': 14001, 'Debit': 0.00, 'Credit': expense
        })
        
    return pd.DataFrame(all_entries)

# --- NEW FUNCTION: Quarterly Payment Journal Generation ---
def generate_quarterly_payment_journals(total_cost, start_date_str):
    """Generates the quarterly JE for cash payment against the initial liability."""
    
    start_date = pd.to_datetime(start_date_str)
    
    end_date = pd.to_datetime(DEFAULT_END_DATE.strftime('%Y-%m-%d'))
    diff = relativedelta(end_date, start_date)
    total_months = diff.years * 12 + diff.months + 1 
    
    num_quarters = (total_months + 2) // 3
    quarterly_payment_amount = total_cost / num_quarters
    
    payment_entries = []
    
    current_date = start_date
    for i in range(num_quarters):
        # Find the quarter-end date
        accrual_date = start_date + relativedelta(months=(i + 1) * 3) + pd.offsets.MonthEnd(0)
        
        # Payment is Net 30 days after the accrual/quarter-end date
        payment_date = accrual_date + relativedelta(days=30)
        
        payment = quarterly_payment_amount
        
        # Final adjustment to ensure full liability is cleared
        if i == num_quarters - 1:
            payment = total_cost - (quarterly_payment_amount * (num_quarters - 1))
        
        # 1. Debit Accounts Payable (Liability decreases)
        payment_entries.append({
            'Date': payment_date.strftime('%Y-%m-%d'), 'JE_Type': 'PAYMENT', 'License': LICENSE_NAME,
            'Account_Description': 'Accounts Payable (Vendor Invoice)', 'Account_Number': 22611, 'Debit': payment, 'Credit': 0.00
        })
        
        # 2. Credit Cash (Asset decreases)
        payment_entries.append({
            'Date': payment_date.strftime('%Y-%m-%d'), 'JE_Type': 'PAYMENT', 'License': LICENSE_NAME,
            'Account_Description': 'Cash', 'Account_Number': 10000, 'Debit': 0.00, 'Credit': payment
        })
        
    return pd.DataFrame(payment_entries)


def parse_streams_input(streams_text):
    """Parses a comma or newline separated list of stream counts."""
    if not streams_text.strip():
        return []
    cleaned = streams_text.replace("\n", ",")
    values = [v.strip() for v in cleaned.split(",") if v.strip()]
    streams = []
    for value in values:
        if not value.replace("_", "").isdigit():
            return []
        streams.append(int(value.replace("_", "")))
    return streams


def create_variable_royalty_schedule(streams, rate, start_date_str):
    """Creates a monthly schedule for variable royalty usage."""
    if not streams:
        return pd.DataFrame(), "Enter at least one monthly stream value."

    start_date = pd.to_datetime(start_date_str)
    schedule_data = []
    accrued_total = 0.00

    for month_index, stream_count in enumerate(streams):
        posting_date = start_date + relativedelta(months=month_index) + pd.offsets.MonthEnd(0)
        expense = stream_count * rate
        accrued_total += expense
        schedule_data.append({
            'Posting_Date': posting_date.strftime('%Y-%m-%d'),
            'Streams': stream_count,
            'Royalty_Expense': round(expense, 2),
            'Accrued_Payable': round(accrued_total, 2)
        })

    return pd.DataFrame(schedule_data), None


def generate_variable_royalty_journals(schedule_df, license_name):
    """Generates monthly accrual entries for variable royalties."""
    if schedule_df.empty:
        return pd.DataFrame()

    entries = []
    for _, row in schedule_df.iterrows():
        expense = row['Royalty_Expense']
        date = row['Posting_Date']
        entries.append({
            'Date': date, 'JE_Type': 'ROYALTY', 'License': license_name,
            'Account_Description': 'Content Expense', 'Account_Number': 50011, 'Debit': expense, 'Credit': 0.00
        })
        entries.append({
            'Date': date, 'JE_Type': 'ROYALTY', 'License': license_name,
            'Account_Description': 'Accounts Payable (Royalty)', 'Account_Number': 22611, 'Debit': 0.00, 'Credit': expense
        })

    return pd.DataFrame(entries)


def create_mg_hybrid_schedule(streams, rate, mg_amount, start_date_str):
    """Creates a hybrid MG usage schedule with prepaid drawdown and overage."""
    if not streams:
        return pd.DataFrame(), "Enter at least one monthly stream value."
    if mg_amount <= 0:
        return pd.DataFrame(), "Minimum guarantee must be greater than zero."

    start_date = pd.to_datetime(start_date_str)
    schedule_data = []
    remaining_prepaid = mg_amount
    accrued_overage_total = 0.00

    for month_index, stream_count in enumerate(streams):
        posting_date = start_date + relativedelta(months=month_index) + pd.offsets.MonthEnd(0)
        usage_expense = stream_count * rate
        prepaid_applied = min(remaining_prepaid, usage_expense)
        overage_expense = usage_expense - prepaid_applied
        remaining_prepaid -= prepaid_applied
        accrued_overage_total += overage_expense

        schedule_data.append({
            'Posting_Date': posting_date.strftime('%Y-%m-%d'),
            'Streams': stream_count,
            'Usage_Expense': round(usage_expense, 2),
            'Prepaid_Amortization': round(prepaid_applied, 2),
            'Overage_Expense': round(overage_expense, 2),
            'Ending_Prepaid': round(remaining_prepaid, 2),
            'Accrued_Overage': round(accrued_overage_total, 2)
        })

    return pd.DataFrame(schedule_data), None


def generate_mg_hybrid_journals(schedule_df, license_name, mg_amount, start_date_str):
    """Generates MG upfront entry and monthly expense/overage accruals."""
    if schedule_df.empty:
        return pd.DataFrame()

    entries = []
    initial_date = pd.to_datetime(start_date_str).strftime('%Y-%m-%d')

    entries.append({
        'Date': initial_date, 'JE_Type': 'MG_PREPAY', 'License': license_name,
        'Account_Description': 'Prepaid Content (MG)', 'Account_Number': 14001, 'Debit': mg_amount, 'Credit': 0.00
    })
    entries.append({
        'Date': initial_date, 'JE_Type': 'MG_PREPAY', 'License': license_name,
        'Account_Description': 'Cash', 'Account_Number': 10000, 'Debit': 0.00, 'Credit': mg_amount
    })

    for _, row in schedule_df.iterrows():
        date = row['Posting_Date']
        prepaid_applied = row['Prepaid_Amortization']
        overage_expense = row['Overage_Expense']

        if prepaid_applied > 0:
            entries.append({
                'Date': date, 'JE_Type': 'MG_USAGE', 'License': license_name,
                'Account_Description': 'Content Expense', 'Account_Number': 50011, 'Debit': prepaid_applied, 'Credit': 0.00
            })
            entries.append({
                'Date': date, 'JE_Type': 'MG_USAGE', 'License': license_name,
                'Account_Description': 'Prepaid Content (MG)', 'Account_Number': 14001, 'Debit': 0.00, 'Credit': prepaid_applied
            })

        if overage_expense > 0:
            entries.append({
                'Date': date, 'JE_Type': 'MG_OVERAGE', 'License': license_name,
                'Account_Description': 'Content Expense', 'Account_Number': 50011, 'Debit': overage_expense, 'Credit': 0.00
            })
            entries.append({
                'Date': date, 'JE_Type': 'MG_OVERAGE', 'License': license_name,
                'Account_Description': 'Accounts Payable (Royalty)', 'Account_Number': 22611, 'Debit': 0.00, 'Credit': overage_expense
            })

    return pd.DataFrame(entries)


def create_excel_report(summary_df, schedule_df, journal_df, payment_df, periods):
    """Creates a multi-sheet Excel file in memory with formatted columns."""
    
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        
        def auto_fit_columns(df, sheet_name):
            number_format = writer.book.add_format({'num_format': '#,##0.00'})
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            worksheet = writer.sheets[sheet_name]
            
            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).str.len().max(), len(col)) + 1
                width = min(max(max_len, 12), 40)
                worksheet.set_column(i, i, width)
                
                financial_cols = ['Amortization_Expense', 'Accumulated_Amortization', 'Net_Book_Value_NBV', 'Debit', 'Credit']
                if col in financial_cols:
                    worksheet.set_column(i, i, width, number_format)
                elif sheet_name == '1. Deal Summary' and col == 'Value':
                     if isinstance(df[col].iloc[0], str) and '$' in df[col].iloc[0]:
                        worksheet.set_column(i, i, width, number_format) 

        auto_fit_columns(summary_df, '1. Deal Summary')
        auto_fit_columns(schedule_df, '2. Amortization Schedule')
        auto_fit_columns(journal_df, '3. Monthly Accrual Entries')
        auto_fit_columns(payment_df, '4. Quarterly Payment Schedule')
        
    output.seek(0)
    
    return output, f"Amortization_Report_{periods}M.xlsx"


def create_basic_excel_report(summary_df, schedule_df, journal_df, report_name):
    """Creates a multi-sheet Excel file in memory for non-amortization modules."""
    output = io.BytesIO()

    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:

        def auto_fit_columns(df, sheet_name):
            number_format = writer.book.add_format({'num_format': '#,##0.00'})
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            worksheet = writer.sheets[sheet_name]

            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).str.len().max(), len(col)) + 1
                width = min(max(max_len, 12), 40)
                worksheet.set_column(i, i, width)

                if col in ['Royalty_Expense', 'Accrued_Payable', 'Usage_Expense', 'Prepaid_Amortization',
                           'Overage_Expense', 'Ending_Prepaid', 'Accrued_Overage', 'Debit', 'Credit']:
                    worksheet.set_column(i, i, width, number_format)

        if not summary_df.empty:
            auto_fit_columns(summary_df, '1. Summary')
        if not schedule_df.empty:
            auto_fit_columns(schedule_df, '2. Schedule')
        if not journal_df.empty:
            auto_fit_columns(journal_df, '3. Journal Entries')

    output.seek(0)

    safe_name = report_name.replace(" ", "_")
    return output, f"{safe_name}_Report.xlsx"


# ==============================================================================
# B. PAGE DEFINITIONS
# ==============================================================================

def home_page():
    """Defines the content for the Home Page."""
    st.markdown("""
    <div class="app-hero">
        <div class="hero-kicker">Interactive Accounting Lab</div>
        <div class="hero-title">Turn technical policy into working financial models.</div>
        <div class="hero-subtitle">
            This project converts theoretical accounting guidance into auditable, calculation-ready outputs.
            Pick a module to generate schedules, journal entries, and decision frameworks in minutes.
        </div>
        <div class="app-badges">
            <span class="app-badge">Live Schedules</span>
            <span class="app-badge">Journal Entry Mapping</span>
            <span class="app-badge">Audit-Ready Exports</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="app-card-grid">
        <div class="app-card">
            <h4>Content Licensing</h4>
            <p>Model fixed, variable, or hybrid licensing deals with amortization logic.</p>
            <p>Export schedules, accruals, and payment timing in one report.</p>
        </div>
        <div class="app-card">
            <h4>Opex vs Capex</h4>
            <p>Apply consistent judgment rules for capitalization decisions.</p>
            <p>Use policy cues and documentation prompts to stay audit-ready.</p>
        </div>
        <div class="app-card">
            <h4>Process Control</h4>
            <p>Built for UAT walkthroughs, variance checks, and repeatable sign-off.</p>
            <p>Designed to mirror how controllership teams work.</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.info("Tip: Start with Module 1 to build amortization schedules and test your journal entry mappings.")
    


def content_license_module():
    """Defines the Content License Accounting Module."""
    st.title("🎬 Module 1: Content License Accounting")
    st.header("Prepaid Content Licensing (Data & Content Deals)")
    st.markdown("---")

    st.subheader("1. Overview and Key Justification")
    st.markdown("""
    For many content and data licensing arrangements (e.g., **Yelp** reviews data or **AccuWeather** forecasting data),
    the upfront fee is commonly treated as a **Prepaid Expense** and recognized over the access period.
    The expense is recognized ratably or based on usage, depending on the contract terms.
    """)
    
    st.markdown("### Why Prepaid Rather Than Capitalized Intangible?")
    st.markdown("""
    Many licensing deals provide **time-based access** to content or data without transferring control of a separable asset.
    In those cases, the cost is often recorded as a **Prepaid Expense** and expensed as the service is consumed.
    """)
    
    st.subheader("2. Key Accounting Concepts")
    st.markdown("""
    * **Prepaid Expense:** The upfront payment recorded on the Balance Sheet (Debit **Prepaid Content Licensing**).
    * **Expense Recognition:** The portion recognized on the Income Statement each period (Debit **Content Expense**).
    * **Prepaid Balance:** The remaining prepaid amount on the Balance Sheet (Original cost minus cumulative expense).
    """)
    

    st.subheader("3. Select Amortization Method")
    method_selection = st.selectbox(
        "Which contract structure applies?",
        options=["Fixed Fee (Straight-Line)", 
                 "Variable Royalty (Pure Usage)", 
                 "Minimum Guarantee (Hybrid/Usage)"],
        key="amortization_method_select" # Unique key for stability
    )
    
    st.markdown("---")
    
    # --- Live Input Controls ---
    # Initialize variables for the calculator section
    schedule_df = pd.DataFrame()
    journal_df_preview = pd.DataFrame()
    journal_df_full = pd.DataFrame()
    payment_df = pd.DataFrame()
    cost_input = 0
    periods = 0
    rate = 0
    
    # ======================================================================
    # FIXED FEE PATHWAY
    # ======================================================================
    if method_selection == "Fixed Fee (Straight-Line)":
        
        st.subheader("3.1 Fixed Fee (Straight-Line) Model")
        st.info("🎯 **Justification:** Used when the entire cost is paid upfront for a defined term, and the consumption benefit is assumed to be **uniform** over time.")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            cost_input = st.number_input(
                "Total License Cost ($)",
                min_value=1000.00,
                value=DEFAULT_COST,
                step=100000.00,
                format="%.2f",
                key="fixed_cost_input" 
            )
        with col2:
            start_date_input = st.date_input(
                "Start Date", 
                value=DEFAULT_START_DATE,
                key="fixed_start_date_key" 
            )
        with col3:
            end_date_input = st.date_input(
                "End Date", 
                value=DEFAULT_END_DATE,
                key="fixed_end_date_key" 
            )
            
        start_date_str = start_date_input.strftime('%Y-%m-%d')
        end_date_str = end_date_input.strftime('%Y-%m-%d')
        
        if st.button("Calculate Schedule", key="calculate_fixed_button"):
            # Run the core calculation logic
            rate, periods, schedule_df, error_msg = create_amortization_schedule(
                cost_input, start_date_str, end_date_str
            )
            
            if error_msg:
                st.error(error_msg)
            elif periods > 0:
                st.success(f"Calculation Complete: {periods} periods found.")
                
                # Generate JEs
                journal_df_preview = generate_amortization_journals(schedule_df.head(5), LICENSE_NAME, cost_input)
                journal_df_full = generate_amortization_journals(schedule_df, LICENSE_NAME, cost_input)
                payment_df = generate_quarterly_payment_journals(cost_input, start_date_str)
                
                # Display Results
                st.markdown("### Summary Metrics")
                summary_df = create_amortization_summary_df(cost_input, periods, rate)
                st.dataframe(summary_df)

                st.markdown("### Expense Recognition Schedule Preview (First 5 Months)")
                schedule_display_df = schedule_df.head(5).copy()
                for col in ['Amortization_Expense', 'Accumulated_Amortization', 'Net_Book_Value_NBV']:
                    schedule_display_df[col] = schedule_display_df[col].map('{:,.2f}'.format)
                schedule_display_df = schedule_display_df.rename(columns={
                    'Posting_Date': 'Posting Date',
                    'Amortization_Expense': 'Expense Recognized',
                    'Accumulated_Amortization': 'Cumulative Expense',
                    'Net_Book_Value_NBV': 'Remaining Prepaid'
                })
                st.dataframe(schedule_display_df)
                
                # 4. Journal Entry Mappings Section
                st.subheader("4. Journal Entry Mappings (The GL Output)")
                st.markdown("This shows the required double-entry journal entries for the initial prepaid setup and the first five months of expense recognition.")
                
                journal_display_df = journal_df_preview.copy()
                journal_display_df['Debit'] = journal_display_df['Debit'].map('{:,.2f}'.format)
                journal_display_df['Credit'] = journal_display_df['Credit'].map('{:,.2f}'.format)
                st.dataframe(journal_display_df)
                
                # 5. Quarterly Payment Schedule Section
                st.subheader("5. Quarterly Payment Schedule")
                st.markdown("This models the **cash outflow** used to settle the liability created by the initial prepaid entry (representing payment of vendor invoices).")
                st.markdown(f"The total liability of **${cost_input:,.2f}** is scheduled for payment over **{len(payment_df) // 2} quarters** (Net 30 days after quarter end).")
                
                payment_display_df = payment_df.copy()
                payment_display_df['Debit'] = payment_display_df['Debit'].map('{:,.2f}'.format)
                payment_display_df['Credit'] = payment_display_df['Credit'].map('{:,.2f}'.format)
                st.dataframe(payment_display_df) # Use display_df here
                
                # --- Download Full Report ---
                excel_data, file_name = create_excel_report(summary_df, schedule_df, journal_df_full, payment_df, periods)

                st.download_button(
                    "Download Full Report (Excel - Schedule, Accrual & Payment JEs)",
                    excel_data,
                    file_name,
                    "application/vnd.ms-excel",
                    key='download-excel'
                )

    # ======================================================================
    # VARIABLE ROYALTY PATHWAY (Placeholder)
    # ======================================================================
    elif method_selection == "Variable Royalty (Pure Usage)":
        
        st.subheader("3.2 Variable Royalty (Pure Usage) Model")
        st.warning("⚠️ **Justification:** Used when **no** cost is capitalized upfront. Payments are direct expenses (Cost of Revenue) based on stream volume, making it the simplest matching method.")
        
        st.subheader("Usage Inputs")
        col1, col2 = st.columns(2)
        with col1:
            royalty_rate = st.number_input(
                "Royalty Rate ($ per stream)",
                min_value=0.0001,
                value=RATE_DEFAULT,
                step=0.0001,
                format="%.4f",
                key="variable_rate_input"
            )
        with col2:
            usage_start_date = st.date_input(
                "Start Date",
                value=DEFAULT_START_DATE,
                key="variable_start_date_key"
            )

        streams_text = st.text_area(
            "Monthly Streams (comma or newline separated)",
            value="1000000, 1200000, 950000, 1100000",
            help="Example: 1000000, 1200000, 950000"
        )

        if st.button("Calculate Usage Expense", key="calculate_variable_button"):
            streams = parse_streams_input(streams_text)
            schedule_df, error_msg = create_variable_royalty_schedule(
                streams, royalty_rate, usage_start_date.strftime('%Y-%m-%d')
            )

            if error_msg:
                st.error(error_msg)
            else:
                st.success(f"Calculation Complete: {len(schedule_df)} periods found.")

                st.markdown("### Usage Expense Schedule")
                schedule_display_df = schedule_df.copy()
                schedule_display_df['Streams'] = schedule_display_df['Streams'].map('{:,}'.format)
                schedule_display_df['Royalty_Expense'] = schedule_display_df['Royalty_Expense'].map('{:,.2f}'.format)
                schedule_display_df['Accrued_Payable'] = schedule_display_df['Accrued_Payable'].map('{:,.2f}'.format)
                st.dataframe(schedule_display_df)

                st.subheader("Journal Entry Mappings (Accrual)")
                journal_df = generate_variable_royalty_journals(schedule_df, LICENSE_NAME)
                journal_display_df = journal_df.copy()
                journal_display_df['Debit'] = journal_display_df['Debit'].map('{:,.2f}'.format)
                journal_display_df['Credit'] = journal_display_df['Credit'].map('{:,.2f}'.format)
                st.dataframe(journal_display_df)

                summary_df = pd.DataFrame([
                    ("Royalty Rate ($/stream)", f"${royalty_rate:,.4f}"),
                    ("Total Streams", f"{schedule_df['Streams'].sum():,}"),
                    ("Total Royalty Expense", f"${schedule_df['Royalty_Expense'].sum():,.2f}")
                ], columns=["Metric", "Value"])

                excel_data, file_name = create_basic_excel_report(
                    summary_df, schedule_df, journal_df, "Variable_Royalty"
                )
                st.download_button(
                    "Download Report (Excel - Schedule & JEs)",
                    excel_data,
                    file_name,
                    "application/vnd.ms-excel",
                    key='download-variable-excel'
                )

    # ======================================================================
    # HYBRID PATHWAY (Placeholder)
    # ======================================================================
    elif method_selection == "Minimum Guarantee (Hybrid/Usage)":
        
        st.subheader("3.3 Minimum Guarantee (Hybrid/Usage) Model")
        st.warning("🔥 **Justification:** This is the most complex. The upfront MG acts as a **prepayment** that must be reduced (amortized) by actual usage until the 'break-even point' is reached.")
        
        st.subheader("Usage Inputs")
        col1, col2, col3 = st.columns(3)
        with col1:
            mg_amount = st.number_input(
                "Minimum Guarantee ($)",
                min_value=1000.00,
                value=MG_DEFAULT,
                step=10000.00,
                format="%.2f",
                key="mg_amount_input"
            )
        with col2:
            mg_rate = st.number_input(
                "Royalty Rate ($ per stream)",
                min_value=0.0001,
                value=RATE_DEFAULT,
                step=0.0001,
                format="%.4f",
                key="mg_rate_input"
            )
        with col3:
            mg_start_date = st.date_input(
                "Start Date",
                value=DEFAULT_START_DATE,
                key="mg_start_date_key"
            )

        mg_streams_text = st.text_area(
            "Monthly Streams (comma or newline separated)",
            value="1000000, 1200000, 950000, 1100000",
            help="Example: 1000000, 1200000, 950000"
        )

        if st.button("Calculate MG Usage", key="calculate_mg_button"):
            streams = parse_streams_input(mg_streams_text)
            schedule_df, error_msg = create_mg_hybrid_schedule(
                streams, mg_rate, mg_amount, mg_start_date.strftime('%Y-%m-%d')
            )

            if error_msg:
                st.error(error_msg)
            else:
                st.success(f"Calculation Complete: {len(schedule_df)} periods found.")

                total_usage = schedule_df['Usage_Expense'].sum()
                total_overage = schedule_df['Overage_Expense'].sum()

                st.markdown("### Summary Metrics")
                summary_df = pd.DataFrame([
                    ("Minimum Guarantee", f"${mg_amount:,.2f}"),
                    ("Total Usage Expense", f"${total_usage:,.2f}"),
                    ("Total Overage Expense", f"${total_overage:,.2f}"),
                    ("Ending Prepaid Balance", f"${schedule_df['Ending_Prepaid'].iloc[-1]:,.2f}")
                ], columns=["Metric", "Value"])
                st.dataframe(summary_df)

                st.markdown("### MG Usage Schedule")
                schedule_display_df = schedule_df.copy()
                schedule_display_df['Streams'] = schedule_display_df['Streams'].map('{:,}'.format)
                for col in ['Usage_Expense', 'Prepaid_Amortization', 'Overage_Expense', 'Ending_Prepaid', 'Accrued_Overage']:
                    schedule_display_df[col] = schedule_display_df[col].map('{:,.2f}'.format)
                st.dataframe(schedule_display_df)

                st.subheader("Journal Entry Mappings")
                journal_df = generate_mg_hybrid_journals(
                    schedule_df, LICENSE_NAME, mg_amount, mg_start_date.strftime('%Y-%m-%d')
                )
                journal_display_df = journal_df.copy()
                journal_display_df['Debit'] = journal_display_df['Debit'].map('{:,.2f}'.format)
                journal_display_df['Credit'] = journal_display_df['Credit'].map('{:,.2f}'.format)
                st.dataframe(journal_display_df)

                excel_data, file_name = create_basic_excel_report(
                    summary_df, schedule_df, journal_df, "MG_Hybrid"
                )
                st.download_button(
                    "Download Report (Excel - Schedule & JEs)",
                    excel_data,
                    file_name,
                    "application/vnd.ms-excel",
                    key='download-mg-excel'
                )


# ==============================================================================
# D. OPEX VS CAPEX MODULE
# ==============================================================================

def opex_vs_capex_module():
    """Defines the Opex vs Capex judgment module."""
    st.title("🏗️ Module 2: Opex vs Capex Judgments")
    st.header("When to Expense vs Capitalize")
    st.markdown("---")

    st.subheader("1. Core Principle")
    st.markdown("""
    The key judgment is whether a cost creates **future economic benefit** beyond the current period.
    If it does, it is typically **capitalized** and expensed over time. If it does not, it is **expensed** immediately.
    """)

    st.subheader("2. Practical Decision Checklist")
    st.markdown("""
    **Capitalize** when the spend:
    * Creates a **new asset** or **significantly improves** an existing one
    * **Extends useful life** or **increases capacity/output**
    * Produces benefits that **extend beyond the current period**

    **Expense** when the spend:
    * Is **routine maintenance** or minor repair
    * Only **maintains** current condition without improving it
    * Provides **short-term** benefit limited to the current period
    """)

    st.subheader("3. Common Judgment Areas")
    st.markdown("""
    * **Facilities:** Roof replacement (capex) vs patching leaks (opex)
    * **Equipment:** New production line (capex) vs tune-up (opex)
    * **Software:** Development after feasibility (capex) vs research/support (opex)
    * **Leases/TI:** Long-lived tenant improvements (capex) vs repainting (opex)
    """)

    st.subheader("4. Policy Factors")
    st.markdown("""
    * **Materiality thresholds:** Company-specific de minimis policy
    * **Consistency:** Apply the same policy across periods
    * **Documentation:** Note the rationale for significant judgments
    """)

    st.info("Tip: If a cost simply keeps the asset running at its current level, it is usually Opex. If it makes the asset better, bigger, or longer-lived, it is usually Capex.")


# ==============================================================================
# C. STREAMLIT APPLICATION ROUTING
# ==============================================================================

# Create a dictionary to map page names to functions
PAGES = {
    "Home: Guide Overview": home_page,
    "Module 1: Content Licensing": content_license_module,
    "Module 2: Opex vs Capex": opex_vs_capex_module,
}

# Streamlit App Execution
apply_global_styles()
st.sidebar.title("Navigation")
st.sidebar.markdown(
    "<div class='sidebar-card'>Choose a module to explore accounting treatments, "
    "generate schedules, and export reports.</div>",
    unsafe_allow_html=True
)
# FIX: Adding unique key to the sidebar radio button to prevent the DuplicateElementId error
selection = st.sidebar.radio("Go to:", list(PAGES.keys()), key="navigation_radio")

# Execute the selected page function
PAGES[selection]()
