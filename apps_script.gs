/**
 * Switchlite order-tracking proxy.
 *
 * Paste this into the Apps Script project bound to the "Orders" Google Sheet
 * (Extensions → Apps Script), then deploy as a Web App:
 *   Deploy → New deployment → type: Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the resulting /exec URL into public-tracker/script.js (API_URL).
 *
 * This script only ever returns the single row matching a correct
 * tracking_code + client_pin pair — never the whole sheet — and it never
 * echoes the pin back, so client data isn't exposed to other visitors.
 */

const SHEET_TAB_NAME = 'Orders';

function doGet(e) {
  const code = (e.parameter.code || '').trim();
  const pin = (e.parameter.pin || '').trim();

  if (!code || !pin) {
    return _json({ found: false, error: 'Missing tracking code or PIN' });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME);
  const rows = sheet.getDataRange().getValues();
  const header = rows[0];

  for (let i = 1; i < rows.length; i++) {
    const row = _rowToObject(header, rows[i]);
    if (String(row.tracking_code) === code && String(row.client_pin) === pin) {
      delete row.client_pin; // never echo the pin back
      return _json({ found: true, order: row });
    }
  }

  return _json({ found: false, error: 'No order found for that tracking code and PIN' });
}

function _rowToObject(header, row) {
  const obj = {};
  header.forEach((key, i) => { obj[key] = row[i]; });
  return obj;
}

function _json(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
