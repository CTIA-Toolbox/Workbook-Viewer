// kmlBuilder.js
// Minimal KML builder for Workbook Viewer

export function buildCallKmlFromRows({ rows, docName, groupByParticipant = true }) {
  if (!rows || !rows.length) return null;

  // Group rows by participant if enabled
  let groups = {};
  if (groupByParticipant) {
    for (const r of rows) {
      const key = r.participant || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
  } else {
    groups["All Points"] = rows;
  }

  // Build KML
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>${escapeXml(docName)}</name>
`;

  for (const [groupName, pts] of Object.entries(groups)) {
    kml += `  <Folder>
    <name>${escapeXml(groupName)}</name>
`;

    for (const p of pts) {
      const lat = Number(p.lat);
      const lon = Number(p.lon);
      const alt = Number(p.alt) || 0;

      if (isNaN(lat) || isNaN(lon)) continue;

      const label = `${p.path || ""} / ${p.point || ""}`;

      kml += `    <Placemark>
      <name>${escapeXml(label)}</name>
      <description><![CDATA[
        Participant: ${p.participant || ""}
        <br>Completed: ${p.completed}
        <br>Correlated: ${p.correlated}
      ]]></description>
      <Point>
        <coordinates>${lon},${lat},${alt}</coordinates>
      </Point>
    </Placemark>
`;
    }

    kml += `  </Folder>\n`;
  }

  kml += `</Document>\n</kml>`;
  return kml;
}

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}