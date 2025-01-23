import gspread
import pandas as pd
from oauth2client.service_account import ServiceAccountCredentials

def fetch_google_sheet():
    """Fetch data from Google Sheets and return as a Pandas DataFrame."""
    try:
        # Authenticate with Google Sheets
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
        client = gspread.authorize(creds)

        # Open the Google Sheet
        sheet = client.open_by_url("https://docs.google.com/spreadsheets/d/1GGeM-lU_3qvwUhVL4CJiFFog9V94KQGd/edit#gid=1599458649").sheet1
        data = sheet.get_all_records()

        # Convert to DataFrame
        df = pd.DataFrame(data)

        # ✅ Ensure 'Company' column exists
        if "Company" not in df.columns:
            raise ValueError("The Google Sheet must contain a 'Company' column.")

        # ✅ Normalize company names (remove leading/trailing spaces)
        df["Company"] = df["Company"].str.strip()

        return df

    except Exception as e:
        print(f"❌ Error fetching Google Sheets data: {e}")
        return None

# Test fetching data
if __name__ == "__main__":
    sheet_data = fetch_google_sheet()
    if sheet_data is not None:
        print(sheet_data.head())
    else:
        print("❌ Failed to fetch Google Sheets data.")
