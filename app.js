// app.js - Insights Logic
import { loadBuildingData } from './testPointLoader.js';
import { processCorrelationData } from './correlationReader.js';

let groundTruth = null;

async function init() {
  const data = await loadBuildingData();
  if (data) groundTruth = data.testPoints;
}

function generateInsights(processedRows) {
  // 1. Grouping data by Handset Model
  const deviceStats = {};

  processedRows.forEach(row => {
    if (!deviceStats[row.device]) {
      deviceStats[row.device] = { count: 0, totalH: 0, totalV: 0, failures: 0 };
    }
    
    const stats = deviceStats[row.device];
    stats.count++;
    stats.totalH += row.horizontalError || 0;
    stats.totalV += Math.abs(row.verticalError || 0);
    
    // A "Failure" is typically defined as > 50m error or wrong floor
    if (row.horizontalError > 50) stats.failures++;
  });

  renderInsightsTable(deviceStats);
}

function renderInsightsTable(stats) {
  const container = document.getElementById('insights-results');
  let html = `
    <table class="insight-table">
      <thead>
        <tr>
          <th>Device</th>
          <th>Avg Horiz Error</th>
          <th>Avg Vert Error</th>
          <th>Reliability (within 50m)</th>
        </tr>
      </thead>
      <tbody>`;

  for (const [device, data] of Object.entries(stats)) {
    const reliability = ((1 - data.failures / data.count) * 100).toFixed(1);
    html += `
      <tr>
        <td>${device}</td>
        <td>${(data.totalH / data.count).toFixed(2)}m</td>
        <td>${(data.totalV / data.count).toFixed(2)}m</td>
        <td class="${reliability < 90 ? 'text-danger' : 'text-success'}">${reliability}%</td>
      </tr>`;
  }

  html += `</tbody></table>`;
  container.innerHTML = html;
}


