import { readCorrelationSheet } from './correlationReader.js';
import { buildCallKmlFromRows } from './kmlBuilder.js';
import { downloadTextFile } from './utils.js';
import { loadTestPoints } from './testPointLoader.js';

console.log("Workbook Viewer app.js loaded");

const fileInput = document.getElementById('fileInput');
const fileInputLabel = document.getElementById('fileInputLabel'); // Added reference
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');
const filterContainer = document.getElementById('filterContainer');

exportBtn.disabled = true;

fileInput.addEventListener('change', async () => {
    if (!fileInput.files || fileInput.files.length === 0) {
        if (fileInputLabel) fileInputLabel.textContent = 'No file chosen';
        return;
    }

    const file = fileInput.files[0];
    if (fileInputLabel) fileInputLabel.textContent = file.name;
    
    statusEl.textContent = 'Reading workbook…';
    exportBtn.disabled = true;

    try {
        const result = await readCorrelationSheet(file);
        if (!result.ok) {
            statusEl.textContent = 'Error: ' + result.error;
            return;
        }

        const rows = result.rows;
        if (!rows.length) {
            statusEl.textContent = 'No data rows found.';
            return;
        }

        const testPoints = await loadTestPoints();

        window._wv_rows = rows;
        window._wv_testpoints = testPoints;

        buildFilters(rows);

        statusEl.textContent = `Ready: ${rows.length} rows loaded.`;
        exportBtn.disabled = false;
    } catch (err) {
        console.error(err);
        statusEl.textContent = 'Processing failed: ' + err.message;
    }
});

function buildFilters(rows) {
    filterContainer.innerHTML = '';
    
    const keyToLabel = {
        path: 'Path ID',
        point: 'Point ID',
        completed: 'Completed Call',
        correlated: 'Correlated Call',
        participant: 'Participant',
        os: 'Handset OS',
        source: 'Location Source',
        phone: 'Location Phone Number',
        validH: 'Valid Horizontal Location',
        validV: 'Valid Vertical Location',
        chosen: 'Chosen Location'
    };

    Object.keys(keyToLabel).forEach(key => {
        const values = [...new Set(rows.map(r => r[key]).filter(v => v !== null && v !== undefined))].sort();
        
        if (values.length <= 1) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'filter-row';
        wrapper.style.marginBottom = "8px";

        const label = document.createElement('label');
        label.textContent = keyToLabel[key];
        label.className = "label small muted";
        label.style.display = "block";

        const select = document.createElement('select');
        select.dataset.key = key;
        select.className = "filter-select";

        const optAll = document.createElement('option');
        optAll.value = '';
        optAll.textContent = `(All ${values.length})`;
        select.appendChild(optAll);

        values.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            select.appendChild(opt);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        filterContainer.appendChild(wrapper);
    });
}

async function handleExport() {
    try {
        const rows = window._wv_rows;
        const testPoints = window._wv_testpoints;

        if (!rows || !rows.length) {
            statusEl.textContent = 'Please select a workbook first.';
            return;
        }

        statusEl.textContent = 'Generating KML...';
        await new Promise(r => setTimeout(r, 50));

        const building = rows[0].building || 'Unknown_Building';
        const selects = filterContainer.querySelectorAll('select');
        
        const filtered = rows.filter(r => {
            for (const sel of selects) {
                const key = sel.dataset.key;
                const val = sel.value;
                if (val && String(r[key]) !== val) return false;
            }
            return true;
        });

        if (!filtered.length) {
            statusEl.textContent = 'No matching rows after filtering.';
            return;
        }

        const kml = buildCallKmlFromRows({
            rows: filtered,
            testPoints,
            docName: `Vector Plot — ${building}`,
            groupByParticipant: true
        });

        if (!kml) throw new Error('KML builder returned empty content.');

        const filename = `VectorPlot_${building}_${filtered.length}pts.kml`;
        downloadTextFile({
            filename,
            text: kml,
            mime: 'application/vnd.google-earth.kml+xml;charset=utf-8'
        });

        statusEl.textContent = `Exported: ${filename}`;
    } catch (err) {
        console.error(err);
        statusEl.textContent = 'Export failed: ' + err.message;
    }
}

exportBtn.addEventListener('click', handleExport);


