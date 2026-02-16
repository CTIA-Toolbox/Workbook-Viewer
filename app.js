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

// Populate all filter dropdowns
function populateFilters(data) {
    // Helper to populate a dropdown
    const populateDropdown = (id, fieldName, labelPrefix = '', defaultValue = null) => {
        const select = document.getElementById(id);
        if (!select) return;
        
        const values = [...new Set(data.map(d => d[fieldName]).filter(v => v !== undefined && v !== null && v !== ''))];
        select.innerHTML = '<option value="all">All</option>';
        
        values.sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') return a - b;
            return String(a).localeCompare(String(b));
        });
        
        values.forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = labelPrefix ? `${labelPrefix} ${val}` : val;
            select.appendChild(opt);
        });
        
        // Set default value if specified
        if (defaultValue !== null) {
            // Try to find exact match (TRUE or true)
            const matchingValue = values.find(v => String(v).toLowerCase() === String(defaultValue).toLowerCase());
            if (matchingValue) {
                select.value = matchingValue;
            }
        }
    };

    // Populate all filters (with defaults for boolean fields)
    populateDropdown('filter-floor', 'floor', 'Floor');
    populateDropdown('filter-completed-call', 'completedCall', '', 'TRUE');
    populateDropdown('filter-correlated-call', 'correlatedCall', '', 'TRUE');
    populateDropdown('filter-participant', 'participant');
    populateDropdown('filter-carrier', 'carrier');
    populateDropdown('filter-location-source', 'locationSource');
    populateDropdown('filter-summary-pool-tech', 'summaryPoolTech');
    populateDropdown('filter-location-tech-string', 'tech');
    populateDropdown('filter-valid-horizontal', 'validHorizontal', '', 'TRUE');
    populateDropdown('filter-valid-vertical', 'validVertical', '', 'TRUE');
}

// Apply all active filters
function applyFilters() {
    const filters = {
        floor: document.getElementById('filter-floor').value,
        completedCall: document.getElementById('filter-completed-call').value,
        correlatedCall: document.getElementById('filter-correlated-call').value,
        participant: document.getElementById('filter-participant').value,
        carrier: document.getElementById('filter-carrier').value,
        locationSource: document.getElementById('filter-location-source').value,
        summaryPoolTech: document.getElementById('filter-summary-pool-tech').value,
        locationTechString: document.getElementById('filter-location-tech-string').value,
        validHorizontal: document.getElementById('filter-valid-horizontal').value,
        validVertical: document.getElementById('filter-valid-vertical').value
    };

    const filtered = allProcessedData.filter(d => {
        if (filters.floor !== 'all' && String(d.floor) !== filters.floor) return false;
        if (filters.completedCall !== 'all' && String(d.completedCall) !== filters.completedCall) return false;
        if (filters.correlatedCall !== 'all' && String(d.correlatedCall) !== filters.correlatedCall) return false;
        if (filters.participant !== 'all' && String(d.participant) !== filters.participant) return false;
        if (filters.carrier !== 'all' && String(d.carrier) !== filters.carrier) return false;
        if (filters.locationSource !== 'all' && String(d.locationSource) !== filters.locationSource) return false;
        if (filters.summaryPoolTech !== 'all' && String(d.summaryPoolTech) !== filters.summaryPoolTech) return false;
        if (filters.locationTechString !== 'all' && String(d.tech) !== filters.locationTechString) return false;
        if (filters.validHorizontal !== 'all' && String(d.validHorizontal) !== filters.validHorizontal) return false;
        if (filters.validVertical !== 'all' && String(d.validVertical) !== filters.validVertical) return false;
        return true;
    });

    updateKPIs(filtered);
    generateInsights(filtered);
    renderHorizontalFailures(filtered);
    renderVerticalFailures(filtered);
    
    // Update status to show filter results
    if (filtered.length < allProcessedData.length) {
        updateStatus(`✓ Showing ${filtered.length} of ${allProcessedData.length} entries (filtered)`);
    } else {
        updateStatus(`✓ Loaded ${allProcessedData.length} entries`);
    }
}

function generateInsights(processedRows) {
  const deviceStats = {};

  processedRows.forEach(row => {
    if (!deviceStats[row.device]) {
      deviceStats[row.device] = { 
        count: 0, 
        hErrors: [], 
        vErrors: [], 
        techMap: {}, 
        sourceErrorsMap: {},
        techStringErrorsMap: {}
      };
    }
    const stats = deviceStats[row.device];
    stats.count++;
    stats.hErrors.push(row.horizontalError || 0);
    stats.vErrors.push(Math.abs(row.verticalError || 0));

    // Track which Tech is being used
    const tech = row.tech || "Unknown";
    stats.techMap[tech] = (stats.techMap[tech] || 0) + 1;
    
    // Track errors by Location Source
    const source = row.locationSource || "Unknown";
    if (!stats.sourceErrorsMap[source]) {
      stats.sourceErrorsMap[source] = { hErrors: [], vErrors: [] };
    }
    stats.sourceErrorsMap[source].hErrors.push(row.horizontalError || 0);
    stats.sourceErrorsMap[source].vErrors.push(Math.abs(row.verticalError || 0));
    
    // Track errors by Location Technology String
    const techString = row.tech || "Unknown";
    if (!stats.techStringErrorsMap[techString]) {
      stats.techStringErrorsMap[techString] = { hErrors: [], vErrors: [] };
    }
    stats.techStringErrorsMap[techString].hErrors.push(row.horizontalError || 0);
    stats.techStringErrorsMap[techString].vErrors.push(Math.abs(row.verticalError || 0));
  });

  renderFailTable(deviceStats);
}

function renderFailTable(stats) {
    const container = document.getElementById('insights-results');
    
    // Sort devices by P80 horizontal error (worst to best)
    const sortedDevices = Object.entries(stats).sort((a, b) => {
        const p80A = getPercentile(a[1].hErrors, 80);
        const p80B = getPercentile(b[1].hErrors, 80);
        return p80B - p80A; // Descending order (worst first)
    });
    
    let html = `
    <table class="insight-table">
      <thead>
        <tr>
          <th>Device</th>
          <th>H 80%</th>
          <th>V 80%</th>
          <th>Technology Usage</th>
          <th>Location Source P80</th>
          <th>Location Tech String P80</th>
        </tr>
      </thead>
      <tbody>`;

    for (const [device, data] of sortedDevices) {
        const p80H = getPercentile(data.hErrors, 80);
        const p80V = getPercentile(data.vErrors, 80);
        
        // Calculate percentage for each technology
        const techBreakdown = Object.entries(data.techMap)
            .map(([tech, count]) => {
                const percentage = ((count / data.count) * 100).toFixed(0);
                return `<span class="badge">${tech}: ${percentage}%</span>`;
            })
            .join(' ');
        
        // Calculate P80 values for each Location Source
        const sourceBreakdown = Object.entries(data.sourceErrorsMap)
            .map(([source, errors]) => {
                const p80H = getPercentile(errors.hErrors, 80);
                const p80V = getPercentile(errors.vErrors, 80);
                return `<span class="badge">${source}: H${p80H.toFixed(1)}m V${p80V.toFixed(1)}m</span>`;
            })
            .join(' ');
        
        // Calculate P80 values for each Location Technology String
        const techStringBreakdown = Object.entries(data.techStringErrorsMap)
            .map(([techStr, errors]) => {
                const p80H = getPercentile(errors.hErrors, 80);
                const p80V = getPercentile(errors.vErrors, 80);
                return `<span class="badge">${techStr}: H${p80H.toFixed(1)}m V${p80V.toFixed(1)}m</span>`;
            })
            .join(' ');
        
        html += `
        <tr>
          <td>${device}</td>
          <td class="${p80H > 50 ? 'text-danger fw-bold' : ''}">${p80H.toFixed(1)}m</td>
          <td class="${p80V > 5 ? 'text-danger fw-bold' : ''}">${p80V.toFixed(1)}m</td>
          <td style="display: flex; flex-wrap: wrap; gap: 4px;">${techBreakdown}</td>
          <td style="display: flex; flex-wrap: wrap; gap: 4px;">${sourceBreakdown}</td>
          <td style="display: flex; flex-wrap: wrap; gap: 4px;">${techStringBreakdown}</td>
        </tr>`;
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function renderHorizontalFailures(data) {
  const container = document.getElementById('h-failing-points-list');
  
  // Filter for horizontal failures (H > 50m)
  const failures = data.filter(d => d.horizontalError > 50);
  
  if (failures.length === 0) {
    container.innerHTML = '<div class="placeholder success">✅ No horizontal failures detected.</div>';
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
    html += `
      <tr>
        <td>${f.pointId}</td>
        <td>${f.floor}</td>
        <td class="text-danger fw-bold">${f.horizontalError.toFixed(1)}m</td>
        <td>${Math.abs(f.verticalError).toFixed(1)}m</td>
        <td><span class="badge">${f.tech}</span></td>
      </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function renderVerticalFailures(data) {
  const container = document.getElementById('v-failing-points-list');
  
  // Filter for vertical failures (V > 5m)
  const failures = data.filter(d => Math.abs(d.verticalError) > 5);
  
  if (failures.length === 0) {
    container.innerHTML = '<div class="placeholder success">✅ No vertical failures detected.</div>';
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
    html += `
      <tr>
        <td>${f.pointId}</td>
        <td>${f.floor}</td>
        <td>${f.horizontalError.toFixed(1)}m</td>
        <td class="text-danger fw-bold">${Math.abs(f.verticalError).toFixed(1)}m</td>
        <td><span class="badge">${f.tech}</span></td>
      </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// Helper: Calculate Percentile (Excel-compatible with linear interpolation)
function getPercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function updateKPIs(processedRows) {
  if (processedRows.length === 0) {
    document.getElementById('metric-avg-h').textContent = '--';
    document.getElementById('metric-avg-v').textContent = '--';
    return;
  }

  const hErrors = processedRows.map(d => d.horizontalError || 0);
  const vErrors = processedRows.map(d => Math.abs(d.verticalError || 0));

  // P80 Calculation
  const p80H = getPercentile(hErrors, 80);
  const p80V = getPercentile(vErrors, 80);

  // Update UI
  document.getElementById('metric-avg-h').innerHTML = `${p80H.toFixed(1)}m <small>80%</small>`;
  document.getElementById('metric-avg-v').innerHTML = `${p80V.toFixed(1)}m <small>80%</small>`;
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
                // Populate filters with defaults and apply them
                populateFilters(allProcessedData);
                applyFilters(); // This will update KPIs, insights, failing points, and status
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

    // Filter change handlers - attach to all filter dropdowns
    const filterIds = [
        'filter-floor',
        'filter-completed-call',
        'filter-correlated-call',
        'filter-participant',
        'filter-carrier',
        'filter-location-source',
        'filter-summary-pool-tech',
        'filter-valid-horizontal',
        'filter-valid-vertical'
    ];

    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
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
