// kmlBuilder.js

export function buildCallKmlFromRows({ rows, testPoints, docName, groupByParticipant = true }) {
  if (!rows || !rows.length || !testPoints) return null;

  const pieces = [];
  pieces.push('<?xml version="1.0" encoding="UTF-8"?>');
  pieces.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
  pieces.push('<Document>');
  pieces.push(`  <name>${xmlEscape(docName)}</name>`);

  // Explicit Styles
  pieces.push(`  <Style id="lineOk"><LineStyle><color>ff00ff00</color><width>3</width></LineStyle></Style>`);
  pieces.push(`  <Style id="lineBad"><LineStyle><color>ff0000ff</color><width>3</width></LineStyle></Style>`);

  const groups = {};
  let skippedCount = 0;
  let matchedCount = 0;
  let passCount = 0;
  let failCount = 0;
  const missingPoints = new Set();

  for (const r of rows) {
    const pointId = r.point ? String(r.point).trim() : "Unknown";
    const orig = testPoints[pointId];
    if (!orig) {
      skippedCount++;
      missingPoints.add(pointId);
      continue;
    }
    matchedCount++;

    const lat1 = Number(orig.lat);
    const lon1 = Number(orig.lon);
    const alt1Hae = Number(orig.alt) || 0; // Test point uses HAE/ellipsoid

    const lat2 = Number(r.lat);
    const lon2 = Number(r.lon);
    
    // Calculate geoid separation from available data (HAE - Geoid)
    const alt2Hae = Number(r.altHae) || Number(r.alt) || 0;
    const alt2Geoid = Number(r.altGeoid) || null;
    const geoidSep = (alt2Hae && alt2Geoid !== null) ? (alt2Hae - alt2Geoid) : null;
    
    // For Google Earth display: prefer Geoid altitude, otherwise convert HAE using separation
    const alt1Display = geoidSep !== null ? (alt1Hae - geoidSep) : alt1Hae;
    const alt2Display = alt2Geoid !== null ? alt2Geoid : (geoidSep !== null ? (alt2Hae - geoidSep) : alt2Hae);

    // Safety check for valid coordinates
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) continue;

    // Calculate horizontal distance in meters using Haversine formula
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const horizontalError = R * c;
    
    // Calculate vertical error in meters (ellipsoid to ellipsoid comparison for accuracy)
    const verticalError = Math.abs(alt2Hae - alt1Hae);
    
    // Determine pass/fail based on thresholds
    const isPassing = horizontalError <= 50 && verticalError <= 5;
    const styleUrl = isPassing ? "#lineOk" : "#lineBad";
    
    if (isPassing) passCount++;
    else failCount++;

    const folderName = groupByParticipant ? String(r.participant || "Unknown").trim() : "Vectors";
    if (!groups[folderName]) groups[folderName] = [];

    // Build enhanced label with point ID, timestamp, and error values
    const timestamp = r.timestamp ? String(r.timestamp).trim() : "";
    const timestampStr = timestamp ? ` | ${timestamp}` : "";
    const errorStr = `H:${horizontalError.toFixed(1)}m V:${verticalError.toFixed(1)}m`;
    const labelName = `Pt ${pointId}${timestampStr} | ${errorStr}`;

    // Build the Placemark as a single clean string
    const pm = [
      '    <Placemark>',
      `      <name>${xmlEscape(labelName)}</name>`,
      `      <styleUrl>${styleUrl}</styleUrl>`,
      '      <LineString>',
      '        <tessellate>1</tessellate>',
      '        <altitudeMode>absolute</altitudeMode>',
      `        <coordinates>${lon1},${lat1},${alt1Display} ${lon2},${lat2},${alt2Display}</coordinates>`,
      '      </LineString>',
      '    </Placemark>'
    ].join('\n');

    groups[folderName].push(pm);
  }

  // Generate Folders properly
  for (const [folderName, placemarks] of Object.entries(groups)) {
    pieces.push('  <Folder>');
    pieces.push(`    <name>${xmlEscape(folderName)}</name>`);
    pieces.push(placemarks.join('\n'));
    pieces.push('  </Folder>');
  }

  pieces.push('</Document>');
  pieces.push('</kml>');

  const finalKml = pieces.join('\n');
  console.log("=== KML GENERATION SUMMARY ===");
  console.log(`Passing (green): ${passCount}`);
  console.log(`Failing (red): ${failCount}`);
  console.log(`Total rows processed: ${rows.length}`);
  console.log(`Matched test points: ${matchedCount}`);
  console.log(`Skipped (no match): ${skippedCount}`);
  console.log(`Folders created: ${Object.keys(groups).length}`);
  if (missingPoints.size > 0) {
    console.log(`Missing point IDs (first 10):`, [...missingPoints].slice(0, 10));
    console.log(`Available test point IDs (first 10):`, Object.keys(testPoints).slice(0, 10));
  }
  console.log("Final KML Sample (First 500 chars):", finalKml.substring(0, 500));
  return finalKml;
}

function xmlEscape(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}