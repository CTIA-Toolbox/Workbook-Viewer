// app.js
import { loadTestPoints } from './testPointLoader.js'; // Changed from loadBuildingData
import { processCorrelationData } from './correlationReader.js';

let groundTruth = null;
let allProcessedData = []; // Store globally for filtering

async function init() {
  updateStatus('Loading Ground Truth coordinates...');
  
  // Call the new function name
  const data = await loadTestPoints(); 
  
  if (data) {
    groundTruth = data; // 'data' is now the lookup table itself
    updateStatus(`✓ Ground truth loaded (${Object.keys(groundTruth).length} points). Ready for Audit file.`);
  } else {
    updateStatus('⚠ Warning: Could not load TestPoints.xlsx.');
  }
}

// 1. New: Populate Floor Filter Dropdown
function populateFilters(data) {
    const floorSelect = document.getElementById('filter-floor');
    if (!floorSelect) return;

    // Reset except for "All Floors"
    floorSelect.innerHTML = '<option value="all">All Floors</option>';
    
    const floors = [...new Set(data.map(d => d.floor))].sort((a, b) => a - b);
    floors.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = `Floor ${f}`;
        floorSelect.appendChild(opt);
    });
}

function generateInsights(processedRows) {
  const deviceStats = {};

  processedRows.forEach(row => {
    if (!deviceStats[row.device]) {
      deviceStats[row.device] = { count: 0, hFails: 0, vFails: 0, techMap: {} };
    }
    const stats = deviceStats[row.device];
    stats.count++;
    if (row.horizontalError > 50) stats.hFails++;
    if (Math.abs(row.verticalError) > 5) stats.vFails++;

    // Track which Tech is being used
    const tech = row.tech || "Unknown";
    stats.techMap[tech] = (stats.techMap[tech] || 0) + 1;
  });

  renderFailTable(deviceStats);
}

function renderFailTable(stats) {
    const container = document.getElementById('insights-results');
    
    // Sort devices by average horizontal error (worst to best)
    const sortedDevices = Object.entries(stats).sort((a, b) => {
        const avgErrorA = a[1].totalH / a[1].count;
        const avgErrorB = b[1].totalH / b[1].count;
        return avgErrorB - avgErrorA; // Descending order (worst first)
    });
    
    let html = `
    <table class="insight-table">
      <thead>
        <tr>
          <th>Device</th>
          <th>Avg Horiz Error</th>
          <th>Avg Vert Error</th>
        </tr>
      </thead>
      <tbody>`;

    for (const [device, data] of sortedDevices) {
        html += `
        <tr>
          <td>${device}</td>
          <td>${(data.totalH / data.count).toFixed(2)}m</td>
          <td>${(data.totalV / data.count).toFixed(2)}m</td>
        </tr>`;
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function renderFailingPoints(data) {
  const container = document.getElementById('failing-points-list');
  
  // Filter for ANY failure (H > 50m OR V > 5m)
  const failures = data.filter(d => d.horizontalError > 50 || Math.abs(d.verticalError) > 5);
  
  if (failures.length === 0) {
    container.innerHTML = '<div class="placeholder success">✅ No points exceeding failure thresholds.</div>';
    return;
  }

  let html = `
    <table class="insight-table">
      <thead>
        <tr>
          <th>Point ID</th>
          <th>Floor</th>
          <th>H-Error</th>
          <th>V-Error</th>
          <th>Tech used</th>
        </tr>
      </thead>
      <tbody>`;

  failures.forEach(f => {
    const hClass = f.horizontalError > 50 ? 'text-danger fw-bold' : '';
    const vClass = Math.abs(f.verticalError) > 5 ? 'text-danger fw-bold' : '';
    
    html += `
      <tr>
        <td>${f.pointId}</td>
        <td>${f.floor}</td>
        <td class="${hClass}">${f.horizontalError.toFixed(1)}m</td>
        <td class="${vClass}">${f.verticalError.toFixed(1)}m</td>
        <td><span class="badge">${f.tech}</span></td>
      </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// Helper: Calculate Percentile
function getPercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function updateKPIs(processedRows) {
  if (processedRows.length === 0) {
    document.getElementById('metric-avg-h').textContent = '--';
    document.getElementById('metric-avg-v').textContent = '--';
    document.getElementById('metric-yield').textContent = '--';
    return;
  }

  const hErrors = processedRows.map(d => d.horizontalError || 0);
  const vErrors = processedRows.map(d => Math.abs(d.verticalError || 0));

  // P80 Calculation
  const p80H = getPercentile(hErrors, 80);
  const p80V = getPercentile(vErrors, 80);

  // Failure Rates
  const failsH = processedRows.filter(d => (d.horizontalError || 0) > 50).length;
  const failsV = processedRows.filter(d => Math.abs(d.verticalError || 0) > 5).length;
  
  const failRateH = ((failsH / processedRows.length) * 100).toFixed(1);
  const failRateV = ((failsV / processedRows.length) * 100).toFixed(1);

  // Update UI
  document.getElementById('metric-avg-h').innerHTML = `${p80H.toFixed(1)}m <small>(P80)</small>`;
  document.getElementById('metric-avg-v').innerHTML = `${p80V.toFixed(1)}m <small>(P80)</small>`;
  document.getElementById('metric-yield').innerHTML = `${failRateH}% <small>H-Fail</small>`;
}

function updateStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) statusEl.textContent = message;
}

function setupEventHandlers() {
    document.getElementById('file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        updateStatus('Processing workbook...');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
            
            // 1. Extract Baro Data from the UPLOADED workbook
            const trendSheet = workbook.Sheets["Baro Trend"];
            const baroTrends = trendSheet ? window.XLSX.utils.sheet_to_json(trendSheet) : [];
            
            const baroLogSheet = workbook.Sheets["Barometric"];
            const baroLogs = baroLogSheet ? window.XLSX.utils.sheet_to_json(baroLogSheet) : [];

            console.log(`Uploaded File Contents: ${baroTrends.length} Baro Trends, ${baroLogs.length} Baro Logs`);

            // 2. Process Correlation (using the static groundTruth loaded during init)
            allProcessedData = processCorrelationData(workbook, groundTruth);
            
            if (allProcessedData.length > 0) {
                // You now have access to both the specific test data AND the baro reference!
                populateFilters(allProcessedData);
                updateKPIs(allProcessedData);
                generateInsights(allProcessedData);
                renderFailingPoints(allProcessedData);
                updateStatus(`✓ Loaded ${allProcessedData.length} entries`);
                document.getElementById('btn-export-kml').disabled = false;
                document.getElementById('btn-export-csv').disabled = false;
            } else {
                updateStatus('⚠ No data found in Correlation sheet');
            }
        } catch (err) {
            console.error('Error processing file:', err);
            updateStatus('⚠ Error: ' + err.message);
        }
    });

    // Floor Filter Handler
    document.getElementById('filter-floor').addEventListener('change', (e) => {
        const val = e.target.value;
        const filtered = val === 'all' 
            ? allProcessedData 
            : allProcessedData.filter(d => String(d.floor) === val);
        
        updateKPIs(filtered);
        generateInsights(filtered);
        renderFailingPoints(filtered);
    });

    // CSV Export Handler
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        if (!allProcessedData || allProcessedData.length === 0) return;

        // 1. Calculate Summary Stats for the CSV Header
        const hErrors = allProcessedData.map(d => d.horizontalError || 0);
        const vErrors = allProcessedData.map(d => Math.abs(d.verticalError || 0));
        const p80H = getPercentile(hErrors, 80);
        const p80V = getPercentile(vErrors, 80);

        // 2. Build the CSV Content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Header Section: Building Performance Summary
        csvContent += "BUILDING AUDIT SUMMARY\n";
        csvContent += `P80 Horizontal Error,${p80H.toFixed(2)}m (Threshold: 50m)\n`;
        csvContent += `P80 Vertical Error,${p80V.toFixed(2)}m (Threshold: 5m)\n`;
        csvContent += `Total Test Points,${allProcessedData.length}\n\n`;

        // Data Section: The "Repair List" (Failing Points First)
        csvContent += "POINT FAILURE LOG\n";
        csvContent += "Point ID,Floor,Horizontal Error (m),Vertical Error (m),Technology,Status\n";

        allProcessedData.forEach(row => {
            const isHFail = row.horizontalError > 50;
            const isVFail = Math.abs(row.verticalError) > 5;
            const status = (isHFail || isVFail) ? "FAIL" : "PASS";

            // Only export failures to keep the CSV focused (optional: export all)
            if (status === "FAIL") {
                csvContent += `${row.pointId},${row.floor},${row.horizontalError.toFixed(2)},${row.verticalError.toFixed(2)},${row.tech},${status}\n`;
            }
        });

        // 3. Trigger Download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Audit_Failures_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupEventHandlers();
    await init();
});
