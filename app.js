// app.js - Insights Logic
import { loadBuildingData } from './testPointLoader.js';
import { processCorrelationData } from './correlationReader.js';

let groundTruth = null;
let allProcessedData = []; // Store globally for filtering

async function init() {
    const data = await loadBuildingData();
    if (data) {
        groundTruth = data.testPoints;
        // Debug check for the Baro issue
        console.log("Sheet Check:", { 
            hasTrends: data.trends.length > 0, 
            hasLogs: data.logs.length > 0 
        });
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
    const container = document.getElementById('insights-results');

    processedRows.forEach(row => {
        if (!deviceStats[row.device]) {
            deviceStats[row.device] = { count: 0, totalH: 0, totalV: 0, failures: 0 };
        }
        const stats = deviceStats[row.device];
        stats.count++;
        stats.totalH += row.horizontalError || 0;
        stats.totalV += Math.abs(row.verticalError || 0);
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
    if (processedRows.length === 0) {
        document.getElementById('metric-avg-h').textContent = '--';
        document.getElementById('metric-avg-v').textContent = '--';
        document.getElementById('metric-yield').textContent = '--';
        return;
    }

    let totalH = 0, totalV = 0, withinSpec = 0;
    processedRows.forEach(row => {
        totalH += row.horizontalError || 0;
        totalV += Math.abs(row.verticalError || 0);
        // Industry Standard: "Yield" usually refers to Floor-level accuracy (< 3m)
        if (Math.abs(row.verticalError) <= 3) withinSpec++;
    });

    document.getElementById('metric-avg-h').textContent = `${(totalH / processedRows.length).toFixed(2)}m`;
    document.getElementById('metric-avg-v').textContent = `${(totalV / processedRows.length).toFixed(2)}m`;
    document.getElementById('metric-yield').textContent = `${((withinSpec / processedRows.length) * 100).toFixed(1)}%`;
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
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupEventHandlers();
    await init();
});
