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

function updateKPIs(processedRows) {
  if (processedRows.length === 0) return;

  // Calculate averages
  let totalH = 0, totalV = 0, withinSpec = 0;
  processedRows.forEach(row => {
    totalH += row.horizontalError || 0;
    totalV += Math.abs(row.verticalError || 0);
    if (row.horizontalError <= 50) withinSpec++;
  });

  const avgH = (totalH / processedRows.length).toFixed(2);
  const avgV = (totalV / processedRows.length).toFixed(2);
  const floorYield = ((withinSpec / processedRows.length) * 100).toFixed(1);

  document.getElementById('metric-avg-h').textContent = `${avgH}m`;
  document.getElementById('metric-avg-v').textContent = `${avgV}m`;
  document.getElementById('metric-yield').textContent = `${floorYield}%`;
}

function updateStatus(message) {
  const statusEl = document.getElementById('status-message');
  if (statusEl) statusEl.textContent = message;
}

function setupEventHandlers() {
  // File input handler
  document.getElementById('file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    updateStatus('Processing workbook...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
      
      const processedData = processCorrelationData(workbook, groundTruth);
      
      if (processedData && processedData.length > 0) {
        updateKPIs(processedData);
        generateInsights(processedData);
        updateStatus(`✓ Loaded ${processedData.length} correlation entries`);
        
        // Enable export buttons
        document.getElementById('btn-export-kml').disabled = false;
        document.getElementById('btn-export-csv').disabled = false;
      } else {
        updateStatus('⚠ No data found in Correlation sheet');
      }
    } catch (err) {
      console.error('Error processing file:', err);
      updateStatus('⚠ Error processing file: ' + err.message);
    }
  });

  // Export handlers (placeholders for now)
  document.getElementById('btn-export-kml').addEventListener('click', () => {
    updateStatus('KML export feature coming soon...');
  });

  document.getElementById('btn-export-csv').addEventListener('click', () => {
    updateStatus('CSV export feature coming soon...');
  });
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('App initializing...');
  
  setupEventHandlers();
  
  await init();
  
  if (groundTruth && Object.keys(groundTruth).length > 0) {
    updateStatus(`✓ Ground truth loaded. Upload a correlation workbook to begin.`);
  } else {
    updateStatus('⚠ No ground truth data. Upload correlation workbook to view basic stats.');
  }
});
