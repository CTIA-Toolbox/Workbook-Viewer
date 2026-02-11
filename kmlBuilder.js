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
    const alt1 = Number(orig.alt) || 0;

    const lat2 = Number(r.lat);
    const lon2 = Number(r.lon);
    const alt2 = Number(r.alt) || 0;

    // Safety check for valid coordinates
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) continue;

    const folderName = groupByParticipant ? String(r.participant || "Unknown").trim() : "Vectors";
    if (!groups[folderName]) groups[folderName] = [];

    // Determine pass/fail - a point fails if validH or validV is explicitly "No" or false
    const validH = String(r.validH || "").toLowerCase();
    const validV = String(r.validV || "").toLowerCase();
    const isPassing = validH !== "no" && validH !== "false" && validV !== "no" && validV !== "false";
    const styleUrl = isPassing ? "#lineOk" : "#lineBad";
    
    if (isPassing) passCount++;
    else failCount++;

    // Build the Placemark as a single clean string
    const pm = [
      '    <Placemark>',
      `      <name>${xmlEscape("Pt " + pointId)}</name>`,
      `      <styleUrl>${styleUrl}</styleUrl>`,
      '      <LineString>',
      '        <tessellate>1</tessellate>',
      '        <altitudeMode>relativeToGround</altitudeMode>',
      `        <coordinates>${lon1},${lat1},${alt1} ${lon2},${lat2},${alt2}</coordinates>`,
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