// correlationReader.js

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

    // UPDATED: Added HAE and Geoid headers to support your "Gold Standard" KML math
    const requiredHeaders = [
      ['Stage', 'stage'],
      ['Building ID', 'building'],
      ['Path ID', 'path'],
      ['Point ID', 'point'],
      ['Participant', 'participant'],
      ['Location Latitude', 'lat'],
      ['Location Longitude', 'lon'],
      ['Location Altitude', 'alt'], // Default/MSL
      ['Location Altitude (HAE)', 'altHae'], // Needed for the delta math
      ['Location Altitude (Geoid)', 'altGeoid'], // Needed for the delta math
      ['Location Source', 'source']
    ];
    
    // Optional fields for pass/fail logic (won't cause error if missing)
    const optionalHeaders = [
      ['Completed Call', 'completed'],
      ['Correlated Call', 'correlated'],
      ['Valid Horizontal Location', 'validH'],
      ['Valid Vertical Location', 'validV'],
      ['Chosen Location', 'chosen'],
      ['Handset OS', 'os'],
      ['Location Phone Number', 'phone']
    ];

    const colIndexes = {};
    const missing = [];
    
    for (const [header, key] of requiredHeaders) {
      const idx = headerRow.indexOf(header);
      if (idx === -1) {
        // We'll treat altitude subtypes as optional so the script doesn't crash 
        // if the specific workbook doesn't have HAE columns.
        if (key !== 'altHae' && key !== 'altGeoid') {
          missing.push(header);
        }
      } else {
        colIndexes[key] = idx;
      }
    }
    
    // Now check for optional headers (won't error if missing)
    for (const [header, key] of optionalHeaders) {
      const idx = headerRow.indexOf(header);
      if (idx !== -1) {
        colIndexes[key] = idx;
      }
    }

    if (missing.length) {
      return { ok: false, error: 'Missing required headers: ' + missing.join(', ') };
    }

    const outRows = [];
    for (let i = 3; i < rows.length; ++i) {
      const row = rows[i];
      if (!Array.isArray(row) || row.length === 0) continue;
      
      const obj = {};
      // Map all headers (required + optional)
      const allHeaders = [...requiredHeaders, ...optionalHeaders];
      for (const [header, key] of allHeaders) {
        const idx = colIndexes[key];
        // Only map if the index was found
        if (idx !== undefined) {
          obj[key] = row[idx];
        } else {
          obj[key] = null;
        }
      }
      outRows.push(obj);
    }

    // Log sample point IDs from the correlation sheet
    const samplePoints = outRows.slice(0, 10).map(r => r.point).filter(p => p != null);
    console.log(`Loaded ${outRows.length} rows from Correlation sheet.`);
    console.log("Sample Point IDs from workbook:", samplePoints);

    return { ok: true, rows: outRows };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
