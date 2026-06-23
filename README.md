# Switchlite Order Tracking — Setup

Two halves to this:

1. **Admin side** (already wired into your local agent app) — a new "Order Tracking" tab where you add/edit orders. It writes straight to a Google Sheet.
2. **Public side** (this folder) — a static page you publish on GitHub Pages and send to clients. It reads the same Google Sheet through a small Google Apps Script proxy, so each client only ever sees their own order, never the whole sheet.

## 1. Create the Google Sheet

1. Create a new Google Sheet, e.g. "Switchlite Order Tracking".
2. Rename the first tab to exactly `Orders` (the app creates the header row itself the first time it runs — no need to type column names manually).
3. Copy the sheet ID out of the URL: `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

## 2. Create a Google service account (for the admin side)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a project (or reuse one).
2. Enable the **Google Sheets API** for that project.
3. Go to "IAM & Admin" → "Service Accounts" → "Create Service Account". No special roles needed.
4. Open the new service account → "Keys" → "Add Key" → "Create new key" → JSON. This downloads a `.json` file.
5. Save that file as `switchlite-agent/google_service_account.json`.
6. Open the JSON file, copy the `client_email` value, and **share the Google Sheet with that email address** (Editor access) — same as sharing with a person.
7. In `switchlite-agent/config.yaml`, fill in:
   ```yaml
   google_sheets:
     sheet_id: "<the ID you copied above>"
     service_account_file: "google_service_account.json"
   ```
8. `pip install -r requirements.txt` (adds `gspread` + `google-auth`), then restart the agent. A new **Order Tracking** tab appears in the app — that's where you add/edit orders going forward.

## 3. Deploy the public lookup proxy (Apps Script)

This lets the public tracker page look up *one* order by tracking code + PIN, without exposing the rest of the sheet.

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Delete the placeholder code and paste in the contents of `apps_script.gs` from this folder.
3. **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click Deploy, authorise it, and copy the `/exec` URL it gives you.
5. Open `script.js` in this folder and replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.

## 4. Add your logo

Drop your logo file into this folder as `logo.png` (it's already referenced in `index.html`; if it's missing, the header just hides it gracefully).

## 5. Publish on GitHub Pages

1. Create a **new, separate, public** GitHub repo (don't reuse the private agent repo — that one has live Slack/Xero/HubSpot keys in `config.yaml` and must never go public).
2. Push the contents of this `public-tracker` folder to it.
3. In the repo's Settings → Pages, set the source to the `main` branch, root folder.
4. GitHub gives you a URL like `https://<your-username>.github.io/<repo-name>/`.

## 6. Sending tracking links to clients

Once an order is in the sheet (via the admin tab), you can send clients either:
- The bare link + their tracking code and PIN to type in, or
- A direct link that auto-fills and submits: `https://<your-pages-url>/?code=SL-1042&pin=1234`

## Columns reference

| Column | Meaning |
|---|---|
| `tracking_code` | Unique ID, e.g. `SL-1042` |
| `invoice_number` | Xero invoice number |
| `client_pin` | 4–6 digit PIN you give the client |
| `product` | Product/order description |
| `stage` | Order Confirmed → In Production → Quality Check → Shipped → Out for Delivery → Delivered |
| `progress` | 0–100, currently informational (timeline is driven by `stage`) |
| `eta` | Estimated delivery date |
| `shipping_status` | Free-text courier status |
| `courier_link` | Courier's own tracking URL |
| `notes` | Shown to the client |
| `install_required` | Yes/No — delivery only vs needs installation |
| `install_status` | Not Scheduled / Scheduled / Completed |
| `install_date` | Scheduled or completed install date |
| `install_notes` | Shown to the client |
