import { readCorrelationSheet } from './correlationReader.js';
// Assume buildCallKmlFromRows and downloadTextFile are globally available or imported elsewhere

const fileInput = document.getElementById('fileInput');
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');

exportBtn.addEventListener('click', handleExport);

async function handleExport() {
  statusEl.textContent = '';

  const file = fileInput.files[0];
  if (!file) {
    statusEl.textContent = 'Please select an Excel workbook.';
    return;
  }

  const result = await readCorrelationSheet(file);
  if (!result.ok) {
    statusEl.textContent = 'Error: ' + result.error;
    return;
  }

  const rows = result.rows;
  if (!rows.length) {
    statusEl.textContent = 'No data rows found in Correlation sheet.';
    return;
  }

  const stage = rows[0].stage;
  const building = rows[0].building;
  const filtered = rows.filter(r => r.stage === stage && r.building === building);

  if (!filtered.length) {
    statusEl.textContent = 'No matching rows for Stage/Building.';
    return;
  }

  const kml = buildCallKmlFromRows({
    rows: filtered,
    docName: `Correlation KML — ${building} (${filtered.length} points)`,
    groupByParticipant: true
  });

  if (!kml) {
    statusEl.textContent = 'KML generation failed.';
    return;
  }

  const filename = `Correlation_${building}.kml`;
  downloadTextFile({
    filename,
    text: kml,
    mime: 'application/vnd.google-earth.kml+xml;charset=utf-8'
  });

  statusEl.textContent = `Exported: ${filename}`;
}
