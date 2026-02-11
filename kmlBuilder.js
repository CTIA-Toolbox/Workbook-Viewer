// kmlBuilder.js
export function buildCallKmlFromRows({ rows, testPoints, docName, groupByParticipant = true }) {
  if (!rows || !rows.length) return null;

  // Constants from your logic
  const STYLE_OK = 'lineOk';
  const STYLE_BAD = 'lineBad';
  const OK_VERT_M = 5;
  const OK_HORIZ_M = 50;

  // Haversine Math (Stolen from your provided logic)
  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const cVal = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * cVal;
  };

  const pieces = [];
  pieces.push('<?xml version="1.0" encoding="UTF-8"?>');
  pieces.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
  pieces.push('<Document>');
  pieces.push(`<name>${xmlEscape(docName)}</name>`);

  // Styles (ABGR format)
  pieces.push('<Style id="lineOk"><LineStyle><color>ff00ff00</color><width>2</width></LineStyle></Style>');
  pieces.push('<Style id="lineBad"><LineStyle><color>ff0000ff</color><width>2</width></LineStyle></Style>');

  // Grouping Logic (Simplified for your new tool's structure)
  let groups = {};
  for (const r of rows) {
    const key = groupByParticipant ? (r.participant || "Unknown") : "All Vectors";
    if (!groups[key]) groups[key] = [];
    
    // --- DATA MAPPING ---
    const id = String(r.point || "");
    const orig = testPoints[id];
    
    if (!orig) continue; // Skip if no origin found in lookup

    const actualLat = Number(orig.lat);
    const actualLon = Number(orig.lon);
    const actualAlt = Number(orig.alt) || 0;

    const locLat = Number(r.lat);
    const locLon = Number(r.lon);
    const locAlt = Number(r.alt) || actualAlt; // Fallback to origin altitude

    // Math
    const delta = locAlt - actualAlt;
    const horizM = haversineMeters(actualLat, actualLon, locLat, locLon);
    const vertM = Math.abs(delta);
    const isOk = (vertM < OK_VERT_M) && (horizM < OK_HORIZ_M);
    const styleUrl = isOk ? `#${STYLE_OK}` : `#${STYLE_BAD}`;

    const placemarkName = `${id} • ${r.participant || 'User'}`;
    
    const desc = [
      `Point ID: ${id}`,
      `Participant: ${r.participant || 'N/A'}`,
      `Horizontal Distance: ${horizM.toFixed(2)}m`,
      `Vertical Distance: ${vertM.toFixed(2)}m`,
      `Result: ${isOk ? 'PASS' : 'FAIL'}`
    ].join('<br/>');

    const pm = `
    <Placemark>
      <name>${xmlEscape(placemarkName)}</name>
      <styleUrl>${styleUrl}</styleUrl>
      <description><![CDATA[${desc}]]></description>
      <LineString>
        <tessellate>1</tessellate>
        <altitudeMode>absolute</altitudeMode>
        <coordinates>${actualLon},${actualLat},${actualAlt} ${locLon},${locLat},${locAlt}</coordinates>
      </LineString>
    </Placemark>`;
    
    groups[key].push(pm);
  }

  // Build Folder Structure
  for (const [groupName, placemarks] of Object.entries(groups)) {
    pieces.push('<Folder>');
    pieces.push(`<name>${xmlEscape(groupName)} (${placemarks.length})</name>`);
    pieces.push(...placemarks);
    pieces.push('</Folder>');
  }

  pieces.push('</Document></kml>');
  return pieces.join('\n');
}

function xmlEscape(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}