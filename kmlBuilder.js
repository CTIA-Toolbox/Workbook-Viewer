// kmlBuilder.js
export function buildCallKmlFromRows({ rows, testPoints, docName, groupByParticipant = true }) {
  if (!rows || !rows.length) return null;

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

  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>${escapeXml(docName)}</name>
  
  <Style id="vectorLine">
    <LineStyle>
      <color>ff00ffff</color> <width>2</width>
    </LineStyle>
  </Style>
`;

  for (const [groupName, pts] of Object.entries(groups)) {
    kml += `  <Folder>
    <name>${escapeXml(groupName)}</name>\n`;

    for (const p of pts) {
      const id = p.point;
      const orig = testPoints[id];

      if (!orig) {
        console.warn("Missing original test point for ID:", id);
        continue;
      }

      // Ensure all values are valid numbers
      const lat1 = Number(orig.lat);
      const lon1 = Number(orig.lon);
      const alt1 = Number(orig.alt) || 0;

      const lat2 = Number(p.lat);
      const lon2 = Number(p.lon);
      const alt2 = Number(p.alt) || 0;

      if (isNaN(lat2) || isNaN(lon2)) continue;

      const label = `Point ${id} Vector`;

      kml += `    <Placemark>
      <name>${escapeXml(label)}</name>
      <styleUrl>#vectorLine</styleUrl>
      <description><![CDATA[
        <b>Participant:</b> ${p.participant || "N/A"}<br>
        <b>Path ID:</b> ${p.path || "N/A"}<br>
        <b>Point ID:</b> ${p.point || "N/A"}<br>
        <hr>
        <b>Origin:</b> ${lat1}, ${lon1}<br>
        <b>Correlated:</b> ${lat2}, ${lon2}
      ]]></description>
      <LineString>
        <tessellate>1</tessellate>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${lon1},${lat1},${alt1} ${lon2},${lat2},${alt2}</coordinates>
      </LineString>
    </Placemark>\n`;
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
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}