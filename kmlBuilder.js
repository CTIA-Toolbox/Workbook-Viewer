// kmlBuilder.js
export function buildCallKmlFromRows({ rows, testPoints, docName, groupByParticipant = true }) {
  if (!rows || !rows.length || !testPoints) return null;

  const pieces = [];
  pieces.push('<?xml version="1.0" encoding="UTF-8"?>');
  pieces.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
  pieces.push('<Document>');
  pieces.push(`<name>${xmlEscape(docName)}</name>`);

  // Define Styles: Green for Pass, Red for Fail
  pieces.push('<Style id="lineOk"><LineStyle><color>ff00ff00</color><width>2</width></LineStyle></Style>');
  pieces.push('<Style id="lineBad"><LineStyle><color>ff0000ff</color><width>2</width></LineStyle></Style>');

  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const cVal = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * cVal;
  };

  // Grouping logic for the Folder structure
  const groups = {};

  for (const r of rows) {
    const pointId = String(r.point || "").trim();
    const orig = testPoints[pointId];
    
    // Skip if we don't have a ground truth point to draw a vector FROM
    if (!orig) continue;

    // 1. Origin Coordinates (from TestPoints.xlsx)
    const lat1 = Number(orig.lat);
    const lon1 = Number(orig.lon);
    const alt1 = Number(orig.alt) || 0;

    // 2. Reported Coordinates (from uploaded Workbook)
    const lat2 = Number(r.lat);
    const lon2 = Number(r.lon);
    const alt2 = Number(r.alt) || alt1; // Fallback to origin alt if missing

    // 3. Vector Math
    const horizM = haversineMeters(lat1, lon1, lat2, lon2);
    const vertM = Math.abs(alt2 - alt1);
    const isOk = (horizM < 50) && (vertM < 5); // 50m Horiz / 5m Vert thresholds
    const styleUrl = isOk ? '#lineOk' : '#lineBad';

    // 4. Grouping
    const folderName = groupByParticipant ? (r.participant || "Unknown") : "Vectors";
    if (!groups[folderName]) groups[folderName] = [];

    const desc = [
      `<b>Point ID:</b> ${pointId}`,
      `<b>Participant:</b> ${r.participant || 'N/A'}`,
      `<b>Path:</b> ${r.path || 'N/A'}`,
      `<hr>`,
      `<b>Horizontal Shift:</b> ${horizM.toFixed(2)}m`,
      `<b>Vertical Shift:</b> ${vertM.toFixed(2)}m`,
      `<b>Status:</b> ${isOk ? 'PASS' : 'FAIL'}`
    ].join('<br/>');

    const pm = `
    <Placemark>
      <name>${xmlEscape(pointId)} Vector</name>
      <styleUrl>${styleUrl}</styleUrl>
      <description><![CDATA[${desc}]]></description>
      <LineString>
        <altitudeMode>absolute</altitudeMode>
        <coordinates>${lon1},${lat1},${alt1} ${lon2},${lat2},${alt2}</coordinates>
      </LineString>
    </Placemark>`;

    groups[folderName].push(pm);
  }

  // Generate Folders
  for (const [folderName, placemarks] of Object.entries(groups)) {
    pieces.push('  <Folder>');
    pieces.push(`    <name>${xmlEscape(folderName)} (${placemarks.length})</name>`);
    pieces.push(...placemarks);
    pieces.push('  </Folder>');
  }

  pieces.push('</Document>');
  pieces.push('</kml>');

  return pieces.join('\n');
}

function xmlEscape(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}