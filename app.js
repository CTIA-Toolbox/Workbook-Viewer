import { readCorrelationSheet } from './correlationReader.js';
import { buildCallKmlFromRows } from './kmlBuilder.js';
import { downloadTextFile } from './utils.js';

console.log("Workbook Viewer app.js loaded");


const fileInput = document.getElementById('fileInput');
const fileInputLabel = document.getElementById('fileInputLabel');
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');
const filterContainer = document.getElementById('filterContainer');

fileInput.addEventListener('change', async () => {
	if (!fileInput.files || fileInput.files.length === 0) {
		fileInputLabel.textContent = 'No file chosen';
		return;
	}

	fileInputLabel.textContent = fileInput.files[0].name;
	statusEl.textContent = 'Reading workbook…';

	const result = await readCorrelationSheet(fileInput.files[0]);
	if (!result.ok) {
		statusEl.textContent = 'Error: ' + result.error;
		return;
	}

	const rows = result.rows;
	if (!rows.length) {
		statusEl.textContent = 'No data rows found.';
		return;
	}

	// Store rows globally for export
	window._wv_rows = rows;

	// Build filters immediately
	buildFilters(rows);

	statusEl.textContent = 'Filters ready.';
});

function buildFilters(rows) {
	filterContainer.innerHTML = '';
	// Map of internal key to actual column name
	const keyToLabel = {
		stage: 'Stage',
		building: 'Building ID',
		path: 'Path ID',
		point: 'Point ID',
		completed: 'Completed Call',
		correlated: 'Correlated Call',
		participant: 'Participant',
		os: 'Handset OS',
		source: 'Location Source',
		phone: 'Location Phone Number',
		lat: 'Location Latitude',
		lon: 'Location Longitude',
		alt: 'Location Altitude',
		validH: 'Valid Horizontal Location',
		validV: 'Valid Vertical Location',
		chosen: 'Chosen Location'
	};
	const filterableKeys = [
		'path', 'point', 'completed', 'correlated', 'participant',
		'os', 'source', 'phone',
		'validH', 'validV', 'chosen'
	];
	for (const key of filterableKeys) {
		const values = [...new Set(rows.map(r => r[key]).filter(v => v !== null && v !== undefined))];
		if (values.length <= 1) continue;
		const row = document.createElement('div');
		row.className = 'filter-row';
		const label = document.createElement('label');
		label.textContent = keyToLabel[key] || key;
		const select = document.createElement('select');
		select.dataset.key = key;
		const optAll = document.createElement('option');
		optAll.value = '';
		optAll.textContent = '(All)';
		select.appendChild(optAll);
		for (const v of values) {
			const opt = document.createElement('option');
			opt.value = v;
			opt.textContent = v;
			select.appendChild(opt);
		}
		row.appendChild(label);
		row.appendChild(select);
		filterContainer.appendChild(row);
	}
}

async function handleExport() {
	statusEl.textContent = '';

	const rows = window._wv_rows;
	if (!rows || !rows.length) {
		statusEl.textContent = 'Please select a workbook first.';
		return;
	}

	const stage = rows[0].stage;
	const building = rows[0].building;
	const selects = filterContainer.querySelectorAll('select');
	const filtered = rows.filter(r => {
		if (r.stage !== stage || r.building !== building) return false;
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

exportBtn.addEventListener('click', handleExport);


