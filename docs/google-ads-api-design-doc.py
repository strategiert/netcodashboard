from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, "NetCo Group - Google Ads API Tool Design Document", align="R")
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(0, 51, 102)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(50, 50, 50)
        self.set_x(self.l_margin)
        self.multi_cell(0, 8, title)
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5.5, "  - " + text)

    def table_row(self, cols, widths, bold=False, bg=False):
        style = "B" if bold else ""
        if bg:
            self.set_fill_color(240, 244, 248)
        self.set_font("Helvetica", style, 9)
        self.set_text_color(30, 30, 30)
        h = 7
        for i, (col, w) in enumerate(zip(cols, widths)):
            self.cell(w, h, col, border=1, fill=bg)
        self.ln(h)

pdf = PDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# Title page
pdf.ln(30)
pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(0, 51, 102)
pdf.cell(0, 15, "Google Ads API", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 15, "Tool Design Document", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(10)
pdf.set_font("Helvetica", "", 14)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 10, "NetCo Group - Internal Marketing Dashboard", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(5)
pdf.set_font("Helvetica", "", 11)
pdf.cell(0, 8, "MCC Account ID: 134-864-7021", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 8, "Date: March 2026", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 8, "Version: 1.0", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 8, "Contact: presse@netco.de", align="C", new_x="LMARGIN", new_y="NEXT")

pdf.ln(20)
pdf.set_draw_color(0, 51, 102)
pdf.line(60, pdf.get_y(), pdf.w - 60, pdf.get_y())
pdf.ln(10)

pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 7, "Prepared by: NetCo Group (netco.de)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, "Brands: NetCo Body-Cam | BauTV+ | Microvista", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 7, "Document Classification: Confidential - Internal Use", align="C", new_x="LMARGIN", new_y="NEXT")

# Page 2 - TOC + Overview
pdf.add_page()

pdf.section_title("Table of Contents")
toc = [
    ("1.", "Company Overview"),
    ("2.", "Tool Overview"),
    ("3.", "Architecture & Data Flow"),
    ("4.", "Google Ads API Usage"),
    ("5.", "Supported Campaign Types"),
    ("6.", "Authentication & Security"),
    ("7.", "Rate Limiting & Compliance"),
    ("8.", "User Interface"),
    ("9.", "Data Storage & Retention"),
    ("10.", "Terms of Service Compliance"),
]
for num, title in toc:
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(12, 7, num)
    pdf.cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
pdf.ln(6)

pdf.section_title("1. Company Overview")
pdf.body_text(
    "NetCo Group is an association of three companies based in Germany:\n\n"
    "- NetCo Body-Cam: Sales and rental of professional bodycam systems for security personnel, police, and private companies.\n"
    "- BauTV+: Sales and rental of camera and monitoring systems for construction sites, including time-lapse documentation.\n"
    "- Microvista: Industrial computed tomography (CT) services for non-destructive testing and quality assurance.\n\n"
    "All three brands use Google Ads for lead generation across Search, Display, Video, and Performance Max campaigns. "
    "The company operates from Germany and serves customers across the DACH region and the EU."
)

pdf.section_title("2. Tool Overview")
pdf.sub_title("2.1 Purpose")
pdf.body_text(
    "We are building an internal marketing dashboard that consolidates performance data from multiple sources "
    "(Google Ads, Google Search Console, social media) into a single unified view. The Google Ads API integration "
    "is specifically used for READ-ONLY reporting purposes - importing campaign, ad group, and keyword performance "
    "metrics for visualization and analysis."
)
pdf.sub_title("2.2 Tool Name")
pdf.body_text("NetCo Marketing Dashboard")
pdf.sub_title("2.3 Access")
pdf.body_text(
    "The tool is strictly internal. Only employees of the NetCo Group have access to the dashboard. "
    "There are no external users, no client-facing features, and no plans to commercialize or distribute the tool. "
    "Access is controlled via authentication (Vercel deployment with restricted access)."
)
pdf.sub_title("2.4 Technology Stack")
pdf.bullet("Frontend: Next.js 14 (React) with shadcn/ui components")
pdf.bullet("Backend: Convex (real-time database and serverless functions)")
pdf.bullet("Hosting: Vercel (frontend), Convex Cloud (backend)")
pdf.bullet("Language: TypeScript")
pdf.ln(2)

pdf.section_title("3. Architecture & Data Flow")
pdf.sub_title("3.1 System Architecture")
pdf.body_text(
    "The dashboard follows a simple three-tier architecture:\n\n"
    "1. Data Ingestion Layer: Scheduled Convex actions (cron jobs) that call the Google Ads API daily "
    "to fetch the latest performance data.\n\n"
    "2. Data Storage Layer: Convex database stores normalized campaign, ad group, and keyword data "
    "with upsert logic to prevent duplicates.\n\n"
    "3. Presentation Layer: Next.js frontend renders charts, tables, and KPI cards from the stored data "
    "using Recharts for visualization."
)

pdf.sub_title("3.2 Data Flow Diagram")
pdf.set_font("Courier", "", 9)
pdf.set_text_color(30, 30, 30)
flow = (
    "+---------------------+      +---------------------+      +------------------+\n"
    "|  Google Ads API     | ---> |  Convex Backend     | ---> |  Next.js UI      |\n"
    "|  (REST/gRPC)        |      |  (Serverless Fn)    |      |  (Dashboard)     |\n"
    "+---------------------+      +---------------------+      +------------------+\n"
    "                                      |\n"
    "                              +-------v--------+\n"
    "                              | Convex Database |\n"
    "                              | (Persistent)    |\n"
    "                              +----------------+\n"
)
for line in flow.split("\n"):
    pdf.cell(0, 4.5, line, new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)

pdf.sub_title("3.3 Data Flow Steps")
pdf.set_font("Helvetica", "", 10)
pdf.bullet("Step 1: A daily cron job (06:00 UTC) triggers the syncGoogleAds Convex action.")
pdf.bullet("Step 2: The action authenticates via OAuth 2.0 using a service account or refresh token.")
pdf.bullet("Step 3: The action calls the Google Ads API (GoogleAdsService.SearchStream) to fetch metrics.")
pdf.bullet("Step 4: Results are normalized and upserted into the Convex database (campaigns, ad groups, keywords).")
pdf.bullet("Step 5: The Next.js frontend queries the Convex database in real-time and renders dashboards.")
pdf.ln(2)

pdf.section_title("4. Google Ads API Usage")
pdf.sub_title("4.1 API Methods Used")
pdf.body_text("The tool uses exclusively READ-ONLY operations. No campaigns, ads, or settings are created or modified through the API.")
pdf.ln(1)

w = [55, 55, 70]
pdf.table_row(["API Service", "Method", "Purpose"], w, bold=True, bg=True)
pdf.table_row(["GoogleAdsService", "SearchStream", "Fetch campaign metrics"], w)
pdf.table_row(["GoogleAdsService", "SearchStream", "Fetch ad group metrics"], w)
pdf.table_row(["GoogleAdsService", "SearchStream", "Fetch keyword metrics"], w)
pdf.table_row(["CustomerService", "ListAccessible", "List managed accounts"], w)
pdf.ln(3)

pdf.sub_title("4.2 GAQL Queries")
pdf.body_text("Example query for campaign performance data:")
pdf.set_font("Courier", "", 8)
pdf.set_fill_color(245, 245, 245)
gaql = (
    'SELECT campaign.name, campaign.status,\n'
    '       campaign.advertising_channel_type,\n'
    '       campaign_budget.amount_micros,\n'
    '       metrics.clicks, metrics.impressions,\n'
    '       metrics.cost_micros, metrics.conversions\n'
    'FROM campaign\n'
    'WHERE segments.date DURING LAST_30_DAYS\n'
    '  AND campaign.status != "REMOVED"'
)
for line in gaql.split("\n"):
    pdf.cell(0, 4.5, "  " + line, new_x="LMARGIN", new_y="NEXT", fill=True)
pdf.ln(4)

pdf.set_font("Helvetica", "", 10)
pdf.body_text("Example query for keyword performance data:")
pdf.set_font("Courier", "", 8)
gaql2 = (
    'SELECT ad_group.name, ad_group_criterion.keyword.text,\n'
    '       ad_group_criterion.keyword.match_type,\n'
    '       ad_group_criterion.quality_info.quality_score,\n'
    '       metrics.clicks, metrics.impressions,\n'
    '       metrics.cost_micros, metrics.conversions,\n'
    '       metrics.average_cpc\n'
    'FROM keyword_view\n'
    'WHERE segments.date DURING LAST_30_DAYS'
)
for line in gaql2.split("\n"):
    pdf.cell(0, 4.5, "  " + line, new_x="LMARGIN", new_y="NEXT", fill=True)
pdf.ln(4)

pdf.section_title("5. Supported Campaign Types")
pdf.body_text("The dashboard imports and displays data from the following Google Ads campaign types:")
pdf.ln(1)

w2 = [50, 50, 80]
pdf.table_row(["Campaign Type", "API Enum", "Usage"], w2, bold=True, bg=True)
pdf.table_row(["Search", "SEARCH", "Lead generation (primary)"], w2)
pdf.table_row(["Performance Max", "PERFORMANCE_MAX", "Automated lead gen"], w2)
pdf.table_row(["Display", "DISPLAY", "Brand awareness"], w2)
pdf.table_row(["Video", "VIDEO", "YouTube campaigns"], w2)
pdf.ln(4)

pdf.section_title("6. Authentication & Security")
pdf.sub_title("6.1 OAuth 2.0 Authentication")
pdf.body_text(
    "The tool authenticates with the Google Ads API using OAuth 2.0 with a refresh token. "
    "The authentication flow is:\n\n"
    "1. A one-time OAuth consent flow is completed by an administrator to obtain a refresh token.\n"
    "2. The refresh token is stored as an encrypted environment variable in the Convex deployment.\n"
    "3. At runtime, the Convex action uses the refresh token to obtain short-lived access tokens.\n"
    "4. Access tokens are used for API calls and are never stored persistently."
)

pdf.sub_title("6.2 Credential Storage")
pdf.bullet("Developer token: Stored as encrypted environment variable (GOOGLE_ADS_DEVELOPER_TOKEN)")
pdf.bullet("Client ID/Secret: Stored as encrypted environment variables")
pdf.bullet("Refresh token: Stored as encrypted environment variable (GOOGLE_ADS_REFRESH_TOKEN)")
pdf.bullet("No credentials are hardcoded in source code")
pdf.bullet("No credentials are logged or exposed to the frontend")
pdf.ln(2)

pdf.sub_title("6.3 Access Control")
pdf.bullet("Dashboard access is restricted to authenticated NetCo employees only")
pdf.bullet("API credentials are accessible only to the backend (Convex serverless functions)")
pdf.bullet("The frontend never has direct access to API tokens or credentials")
pdf.ln(2)

pdf.section_title("7. Rate Limiting & Compliance")
pdf.sub_title("7.1 API Call Volume")
pdf.body_text(
    "The tool makes minimal API calls:\n\n"
    "- Daily sync: ~3-5 API calls per brand (3 brands = ~9-15 calls/day)\n"
    "- No real-time API calls from the user interface\n"
    "- All data is cached in the Convex database after import\n"
    "- Estimated monthly volume: < 500 API calls total"
)

pdf.sub_title("7.2 Rate Limiting Implementation")
pdf.bullet("Sequential processing: API calls are made one brand at a time, never in parallel")
pdf.bullet("Daily schedule: Sync runs once per day at 06:00 UTC via cron job")
pdf.bullet("Error handling: Failed calls are logged and retried on the next daily cycle")
pdf.bullet("No retry loops or aggressive polling")
pdf.ln(2)

pdf.section_title("8. User Interface")
pdf.body_text(
    "The dashboard presents Google Ads data in a structured, read-only interface organized into sections:"
)
pdf.ln(1)

pdf.sub_title("8.1 Campaign Overview")
pdf.bullet("KPI cards showing total spend, clicks, impressions, and conversions")
pdf.bullet("Campaign table with budget, spend, CTR, and cost per conversion")
pdf.bullet("Sortable by performance metrics")

pdf.sub_title("8.2 Ad Group Analysis")
pdf.bullet("Performance table grouped by campaign")
pdf.bullet("Filterable by active/paused status")
pdf.bullet("CTR and conversion metrics per ad group")

pdf.sub_title("8.3 Keyword Intelligence")
pdf.bullet("Top keywords ranked by conversions and clicks")
pdf.bullet("Quality Score distribution chart (1-10)")
pdf.bullet("Average Quality Score KPI card")
pdf.bullet("Match type badges (Broad, Phrase, Exact)")
pdf.ln(2)

pdf.sub_title("8.4 Global Filters")
pdf.body_text(
    "The dashboard provides global filter controls in the header bar that apply across all pages and tabs:\n\n"
    "- Date range picker with presets (Last 7/14/30/90 days, current year, previous years, all time)\n"
    "- Granularity toggle (Daily / Weekly / Monthly)\n"
    "- Brand selector for switching between NetCo Body-Cam, BauTV+, and Microvista\n\n"
    "Filters persist across page navigation via URL parameters."
)

pdf.section_title("9. Data Storage & Retention")
pdf.sub_title("9.1 Database Schema")
pdf.body_text("Google Ads data is stored in three Convex database tables:")
pdf.ln(1)

w3 = [40, 70, 70]
pdf.table_row(["Table", "Key Fields", "Description"], w3, bold=True, bg=True)
pdf.table_row(["gadsCampaigns", "brandId, period, campaign", "Campaign-level metrics"], w3)
pdf.table_row(["gadsAdGroups", "brandId, period, adGroup", "Ad group-level metrics"], w3)
pdf.table_row(["gadsKeywords", "brandId, period, keyword", "Keyword-level metrics"], w3)
pdf.ln(3)

pdf.sub_title("9.2 Data Retention")
pdf.bullet("Data is retained indefinitely for historical trend analysis")
pdf.bullet("Upsert logic prevents duplicate entries (same brand + period + entity = update)")
pdf.bullet("No personally identifiable information (PII) is stored")
pdf.bullet("No user-level or click-level data is stored - only aggregated metrics")
pdf.ln(2)

pdf.section_title("10. Terms of Service Compliance")
pdf.bullet("READ-ONLY access: The tool only reads performance data. No campaigns, ads, keywords, or settings are created, modified, or deleted via the API.")
pdf.bullet("No data reselling: All data is used exclusively for internal business analysis.")
pdf.bullet("No PII collection: The tool does not access or store any end-user data, search queries, or click-level information.")
pdf.bullet("Minimal API usage: Daily sync with < 500 calls/month, well within rate limits.")
pdf.bullet("Secure credential storage: All API credentials are stored as encrypted environment variables.")
pdf.bullet("Single MCC account: The tool only accesses accounts under MCC 134-864-7021.")
pdf.bullet("Compliance monitoring: The development team monitors API deprecation notices and updates accordingly.")

out = r"C:\Users\karent\Documents\Software\netco\_shared\dashboard\docs\NetCo-Google-Ads-API-Design-Document.pdf"
pdf.output(out)
print(f"PDF saved to: {out}")
