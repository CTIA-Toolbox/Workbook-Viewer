// kmlBuilder.js
export function buildCallKmlFromRows({ rows, testPoints, docName, groupByParticipant = true }) {
  if (!rows || !rows.length || !testPoints) {
    console.error("KML Builder: Missing rows or testPoint lookup.");
    return null;
  }

  const pieces = [];
  pieces.push('<?xml version="1.0" encoding="UTF-8"?>');
  pieces.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
  pieces.push('<Document>');
  pieces.push(`<name>${xmlEscape(docName)}</name>`);

  pieces.push('<Style id="lineOk"><LineStyle><color>ff00ff00</color><width>2</width></LineStyle></Style>');
  pieces.push('<Style id="lineBad"><LineStyle><color>ff0000ff</color><width>2</width></LineStyle></Style>');

  const groups = {};
  let processedCount = 0;
  let missingPointCount = 0;

  for (const r of rows) {
    // FORCE STRING MATCHING: trim and stringify both sides
    const pointId = r.point ? String(r.point).trim() : "";
    const orig = testPoints[pointId];
    
    if (!orig) {
      missingPointCount++;
      continue; 
    }

    const lat1 = Number(orig.lat);
    const lon1 = Number(orig.lon);
    const alt1 = Number(orig.alt) || 0;

    const lat2 = Number(r.lat);
    const lon2 = Number(r.lon);
    const alt2 = Number(r.alt) || alt1;

    // Check for valid numbers before writing to KML
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) continue;

    const folderName = groupByParticipant ? (r.participant || "Unknown") : "Vectors";
    if (!groups[folderName]) groups[folderName] = [];

    const pm = `
    <Placemark>
      <name>${xmlEscape(pointId)} Vector</name>
      <styleUrl>#lineOk</styleUrl>
      <LineString>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${lon1},${lat1},${alt1} ${lon2},${lat2},${alt2}</coordinates>
      </LineString>
    </Placemark>`;

    groups[folderName].push(pm);
    processedCount++;
  }

  console.log(`KML Stats: Processed ${processedCount}, Missing in Lookup: ${missingPointCount}`);

  for (const [folderName, placemarks] of Object.entries(groups)) {
    pieces.push('  <Folder>');
    pieces.push(`    <name>${xmlEscape(folderName)}</name>`);
    pieces.push(...placemarks);
    pieces.push('  </Folder>');
  }

  pieces.push('</Document></kml>');
  return pieces.join('\n');
}

function xmlEscape(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}