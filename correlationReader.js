// correlationReader.js
// Reads and cleans the 'Correlation' sheet from an uploaded Excel workbook using XLSX

/**
 * Reads the 'Correlation' sheet from an Excel workbook and extracts required columns.
 * @param {ArrayBuffer|File} file - The uploaded Excel file (ArrayBuffer or File)
 * @returns {Promise<{ok: true, rows: Array<Object>} | {ok: false, error: string}>}
 */
export async function readCorrelationSheet(file) {
  try {
    let data;
    if (file instanceof ArrayBuffer) {
      data = file;
    } else if (file instanceof File) {
      data = await file.arrayBuffer();
    } else {
      return { ok: false, error: 'Input must be an ArrayBuffer or File.' };
    }

    // XLSX must be loaded globally (from CDN)
    const XLSX = window.XLSX;
    if (!XLSX) return { ok: false, error: 'XLSX library not loaded.' };

    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets['Correlation'];
    if (!sheet) {
      return { ok: false, error: 'Sheet named "Correlation" not found.' };
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!Array.isArray(rows) || rows.length < 3) {
      return { ok: false, error: 'Sheet does not contain enough rows.' };
    }

    // Header row is at index 2 (Excel row 3)
    const headerRow = rows[2];
    if (!Array.isArray(headerRow)) {
      return { ok: false, error: 'Header row (index 2) is missing or invalid.' };
    }

    // Required headers and their output keys
    const requiredHeaders = [
      ['Stage', 'stage'],
      ['Building ID', 'building'],
      ['Path ID', 'path'],
      ['Point ID', 'point'],
      ['Completed Call', 'completed'],
      ['Correlated Call', 'correlated'],
      ['Participant', 'participant'],
      ['Handset OS', 'os'],
      ['Location Source', 'source'],
      ['Location Phone Number', 'phone'],
      ['Location Latitude', 'lat'],
      ['Location Longitude', 'lon'],
      ['Location Altitude', 'alt'],
      ['Valid Horizontal Location', 'validH'],
      ['Valid Vertical Location', 'validV'],
      ['Chosen Location', 'chosen']
    ];

    // Map header names to column indexes
    const colIndexes = {};
    const missing = [];
    for (const [header, key] of requiredHeaders) {
      const idx = headerRow.indexOf(header);
      if (idx === -1) {
        missing.push(header);
      } else {
        colIndexes[key] = idx;
      }
    }
    if (missing.length) {
      return { ok: false, error: 'Missing required headers: ' + missing.join(', ') };
    }

    // Extract data rows (starting at index 3)
    const outRows = [];
    for (let i = 3; i < rows.length; ++i) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;
      const obj = {};
      for (const [header, key] of requiredHeaders) {
        obj[key] = row[colIndexes[key]];
      }
      outRows.push(obj);
    }

    return { ok: true, rows: outRows };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}
