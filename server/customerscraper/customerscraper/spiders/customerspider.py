import scrapy
import gspread
import pandas as pd
from oauth2client.service_account import ServiceAccountCredentials
from utils.fetch_google_sheets import fetch_google_sheet  # ✅ Fixed import path

class CustomerScraperSpider(scrapy.Spider):
    name = "customerscraper"
    allowed_domains = ["customerservicescoreboard.com"]
    start_urls = ["https://www.customerservicescoreboard.com/"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)  # ✅ Properly initialize Scrapy Spider
        self.sheet_data = fetch_google_sheet()  # ✅ Fetch data using the external function
        
        if self.sheet_data is None or self.sheet_data.empty:
            self.sheet_data = None
            print("❌ Google Sheets data is empty or not loaded.")
        else:
            self.sheet_data["Company"] = self.sheet_data["Company"].str.strip()  # ✅ Normalize company names
            print(f"✅ Google Sheets data loaded with {len(self.sheet_data)} companies.")

    def parse(self, response):
        """Extract company names and follow their links."""
        for row in response.css("table tr"):
            company = row.css('td[data-th="company"] a::text').get()
            company_link = row.css('td[data-th="company"] a::attr(href)').get()

            if company and company_link:
                yield response.follow(company_link, self.parse_company, meta={"company": company.strip()})  # ✅ Stripped whitespace

    def parse_company(self, response):
        """Extract company ratings from Google Sheets and customer review from website."""
        company = response.meta["company"]
        
        # ✅ Ensure Google Sheets data is not empty
        sheet_row = self.sheet_data[self.sheet_data["Company"] == company] if self.sheet_data is not None else None
        customer_rating = sheet_row["Customer Rating"].values[0] if sheet_row is not None and not sheet_row.empty else "N/A"
        employee_rating = sheet_row["Employee Rating"].values[0] if sheet_row is not None and not sheet_row.empty else "N/A"

        # ✅ Fixed review extraction (updated selector)
        description = response.css("p.description.item::text").get() or "No review available"

        yield {
            "Company": company,
            "Customer Rating (Google Sheets)": customer_rating,
            "Employee Rating (Google Sheets)": employee_rating,
            "Review (Scraped)": description
        }
