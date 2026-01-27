
import { readCorrelationSheet } from './correlationReader.js';
import { buildCallKmlFromRows } from './kmlBuilder.js';
import { downloadTextFile } from './utils.js';

const fileInput = document.getElementById('fileInput');
const fileInputLabel = document.getElementById('fileInputLabel');
const exportBtn = document.getElementById('exportBtn');
const statusEl = document.getElementById('status');
const filterContainer = document.getElementById('filterContainer');


async function handleExport() {
  statusEl.textContent = '';
  if (!fileInput.files || fileInput.files.length === 0) {
    statusEl.textContent = 'Please select an Excel workbook.';
    return;
  }
  const file = fileInput.files[0];
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
  buildFilters(rows);
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

exportBtn.addEventListener('click', handleExport);

// Update file label on file selection
fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files.length > 0) {
    fileInputLabel.textContent = fileInput.files[0].name;
  } else {
    fileInputLabel.textContent = 'No file chosen';
  }
});

function buildFilters(rows) {
  filterContainer.innerHTML = '';
  const filterableKeys = [
    'path', 'point', 'completed', 'correlated', 'participant',
    'os', 'source', 'phone', 'lat', 'lon', 'alt',
    'validH', 'validV', 'chosen'
  ];
  for (const key of filterableKeys) {
    const values = [...new Set(rows.map(r => r[key]).filter(v => v !== null && v !== undefined))];
    if (values.length <= 1) continue;
    const row = document.createElement('div');
    row.className = 'filter-row';
    const label = document.createElement('label');
    label.textContent = key;
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
  if (!fileInput.files || fileInput.files.length === 0) {
    statusEl.textContent = 'Please select an Excel workbook.';
    return;
  }
  const file = fileInput.files[0];
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
  buildFilters(rows);
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

exportBtn.addEventListener('click', handleExport);
// --- Style Definitions (global) ---
const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: 'FF000000' } },
  bottom: { style: 'thin', color: { rgb: 'FF000000' } },
  left: { style: 'thin', color: { rgb: 'FF000000' } },
  right: { style: 'thin', color: { rgb: 'FF000000' } },
};
// Style for left (gray+green) header
const STYLE_HEADER_LEFT = {
  font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: GREEN } },
  fill: { patternType: 'solid', fgColor: { rgb: GRAY } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_THIN,
};
// Style for stage (orange) header
const STYLE_HEADER_STAGE = {
  font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FF000000' } },
  fill: { patternType: 'solid', fgColor: { rgb: ORANGE } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_THIN,
};
// Style for subheader (bold black)
const STYLE_HEADER_SUB = {
  font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FF000000' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_THIN,
};
// ...all other style definitions removed...
// Ensure all imports use correct relative paths
window.addEventListener('error', function(event) {
  console.error('[GLOBAL ERROR HANDLER]', event.message, event.filename, event.lineno, event.colno, event.error);
});
window.addEventListener('unhandledrejection', function(event) {
  console.error('[GLOBAL PROMISE REJECTION]', event.reason);
});
console.log('REACHED 1: TOP OF FILE');
// ...existing code...
console.log('REACHED 2: AFTER IMPORTS');
// --- Egnyte Modal Integration ---
const egnyteLinks = [
  { Link: 'https://furtherllc.egnyte.com/fl/xBTGxYRC8MMK', Stage: '24A', Participant: 'AT&T' },
  { Link: 'https://furtherllc.egnyte.com/fl/3pFVcB6Tb9YJ', Stage: '24A', Participant: 'Verizon' },
  { Link: 'https://furtherllc.egnyte.com/fl/WPvfdQY7hDPd', Stage: '24A', Participant: 'T-Mobile' },
  { Link: 'https://furtherllc.egnyte.com/fl/vKWqgrm3RbYw', Stage: '25A', Participant: 'Google' },
  { Link: 'https://furtherllc.egnyte.com/fl/d3BHPrQcf4G9', Stage: '25A', Participant: 'Verizon' },
  { Link: 'https://furtherllc.egnyte.com/fl/QDm7bk7JdFYT', Stage: '25A', Participant: 'AT&T' },
  { Link: 'https://furtherllc.egnyte.com/fl/C7bQvhTxvQ9Y', Stage: '25A', Participant: 'T-Mobile' },
  { Link: 'https://furtherllc.egnyte.com/fl/Bh8frw6CrWXD', Stage: '25B', Participant: 'T-Mobile' },
  { Link: 'https://furtherllc.egnyte.com/fl/hGwPyf3HMxwX', Stage: '25B', Participant: 'Google' },
  { Link: 'https://furtherllc.egnyte.com/fl/Rx7xhfYMB6g4', Stage: '25B', Participant: 'AT&T' },
  { Link: 'https://furtherllc.egnyte.com/fl/KX66cCybRxCH', Stage: '25B', Participant: 'Verizon' },
  { Link: 'https://furtherllc.egnyte.com/fl/k6Jv73VkMxpQ', Stage: '25C', Participant: 'Google' },
  { Link: 'https://furtherllc.egnyte.com/fl/3DBJhqfQg7Jy', Stage: '25C', Participant: 'Verizon' },
  { Link: 'https://furtherllc.egnyte.com/fl/X663ktMHp3WM', Stage: '25C', Participant: 'T-Mobile' },
  { Link: 'https://furtherllc.egnyte.com/fl/Kwq76f6tGxQX', Stage: '25C', Participant: 'AT&T' },
  { Link: 'https://furtherllc.egnyte.com/fl/8XPV9d8dfCM4', Stage: '1c', Participant: 'Sprint' },
  { Link: 'https://furtherllc.egnyte.com/fl/qqdXygMQw7KG', Stage: '1c', Participant: 'T-Mobile' },
  { Link: 'https://furtherllc.egnyte.com/fl/KQm86wRFDQvg', Stage: '1c', Participant: 'Verizon' },
  { Link: 'https://furtherllc.egnyte.com/fl/pctdbjQQbp7F', Stage: '1d', Participant: 'T-Mobile' },
  { Link: 'https://furtherllc.egnyte.com/fl/QXwGtFDpMcBG', Stage: '1d', Participant: 'Sprint' },
  { Link: 'https://furtherllc.egnyte.com/fl/FPgqrddmPprc', Stage: '1d', Participant: 'AT&T' },
  { Link: 'https://furtherllc.egnyte.com/fl/7wTFGpxGG8yh', Stage: '1e', Participant: 'AT&T' },
  { Link: 'https://furtherllc.egnyte.com/fl/CyR8tGJfqpCP', Stage: '1e', Participant: 'T-Mobile' },
  { Link: 'https://furtherllc.egnyte.com/fl/fCTQRV3DdrPj', Stage: '1e', Participant: 'Verizon' },
  { Link: 'https://furtherllc.egnyte.com/fl/bK4BVCHpkTKw', Stage: 'Zb', Participant: 'Apple' },
  { Link: 'https://furtherllc.egnyte.com/fl/GwrjwcgcVdf8', Stage: 'Zb', Participant: 'Google' },
  { Link: 'https://furtherllc.egnyte.com/fl/KKrm4hbcg4pP', Stage: 'Za', Participant: 'Google' },
];

function getSelectedEgnyteLinks() {
  // Get selected stage(s) and participant(s) from state.filters
  const stages = Array.from(state.filters.stage);
  const participants = Array.from(state.filters.participant);
  // If nothing selected, show all
  if (stages.length === 0 && participants.length === 0) return egnyteLinks;
  return egnyteLinks.filter(l =>
    (stages.length === 0 || stages.includes(l.Stage)) &&
    (participants.length === 0 || participants.includes(l.Participant))
  );
}

function showEgnyteModal() {
  const modal = document.getElementById('egnyteModal');
  const content = document.getElementById('egnyteModalContent');
  // Modal overlay CSS uses flex layout; set to 'flex' when showing.
  modal.style.display = 'flex';
  const links = getSelectedEgnyteLinks();
  if (!links.length) {
    content.innerHTML = '<div style="margin:1em 0;">No Egnyte folder links for current selection.</div>';
    return;
  }

  content.innerHTML = links.map(l =>
    `<div class="egnyte-link-row">
      <div class="egnyte-link-label"><span class="egnyte-stage">Stage: ${l.Stage}</span> <span class="egnyte-participant">Participant: ${l.Participant}</span></div>
      <button class="btn btn-small egnyte-open-btn" onclick="window.open('${l.Link}','_blank')">Open Folder</button>
    </div>`
  ).join('');
}


function attachEgnyteBtnListener() {
  const egnyteBtn = document.getElementById('egnyteBtn');
  const egnyteModal = document.getElementById('egnyteModal');
  const egnyteModalClose = document.getElementById('egnyteModalClose');
  const debugLog = document.getElementById('debugLog');
  function logDebug(msg) {
    if (debugLog) debugLog.textContent += `\n[Egnyte] ${msg}`;
    console.log('[Egnyte]', msg);
  }
  if (egnyteBtn) {
    egnyteBtn.onclick = () => {
      logDebug('Go to Egnyte button clicked');
      showEgnyteModal();
    };
    logDebug('Egnyte button event listener attached');
  } else {
    logDebug('Egnyte button NOT FOUND when trying to attach event listener');
  }
  if (egnyteModalClose) egnyteModalClose.onclick = () => {
    logDebug('Egnyte modal closed');
    egnyteModal.style.display = 'none';
  };
  if (egnyteModal) egnyteModal.onclick = (e) => {
    if (e.target === egnyteModal) {
      logDebug('Egnyte modal closed (background click)');
      egnyteModal.style.display = 'none';
    }
  };
}

// Attach immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  attachEgnyteBtnListener();
}




console.log('REACHED 3: AFTER_EGNYTE_LISTENER_SETUP');



console.log('REACHED 4: BEFORE_ELS_BLOCK');
const els = {
  fileInput: document.getElementById('fileInput'),
  fileInputLabel: document.getElementById('fileInputLabel'),
  exportBtn: document.getElementById('exportBtn'),
  statusEl: document.getElementById('status'),
  statusText: document.getElementById('statusText'),
  debugLog: document.getElementById('debugLog'),
};
console.log('REACHED 5: AFTER_ELS_BLOCK');

// ...state engine and filter logic removed...

const callState = {
  columns: [],
  records: [],
  filteredRecords: [],
  lastFileInfo: null,
  dimCols: {
    participant: null,
    stage: null,
    building: null,
    path_id: null,
    point_id: null,
    location_source: null,

    // KML/vector export columns
    actual_lat: null,
    actual_lon: null,
    actual_geoid_alt: null,
    actual_hae_alt: null,

    location_lat: null,
    location_lon: null,
    location_geoid_alt: null,
    location_hae_alt: null,
  },
};

const callUi = {
  showPreview: false,
};

const IDB_DB_NAME = 'resultsArchive';
const IDB_DB_VERSION = 1;
const IDB_STORE_FILES = 'files';
const IDB_KEY_ARCHIVE_PKL = 'archivePkl';
const IDB_KEY_CALL_PKL = 'callPkl';

const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';

function ensureExternalScript({ url, globalName, timeoutMs = 30000 }) {
  // If already present, no-op.
  if (globalName && globalName in window) return Promise.resolve();

  // If a script with this URL already exists, wait for it.
  const existing = Array.from(document.scripts).find((s) => s.src === url);
  if (existing) {
    if (globalName && globalName in window) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Timed out loading ${url}`)), timeoutMs);
      existing.addEventListener('load', () => {
        clearTimeout(t);
        resolve();
      });
      existing.addEventListener('error', () => {
        clearTimeout(t);
        reject(new Error(`Failed to load ${url}`));
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    const t = setTimeout(() => {
      script.remove();
      reject(new Error(`Timed out loading ${url}`));
    }, timeoutMs);
    script.onload = () => {
      clearTimeout(t);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(t);
      reject(new Error(`Failed to load ${url}`));
    };
    document.head.appendChild(script);
  });
}

async function ensurePyodideAvailable() {
  // loadPyodide is provided by pyodide.js
  if ('loadPyodide' in window) return;
  logDebug('Pyodide global not found; injecting pyodide.js…');
  await ensureExternalScript({ url: PYODIDE_CDN_URL, globalName: 'loadPyodide', timeoutMs: 60000 });
}

function formatBytes(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = num;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i === 0 ? 0 : (i === 1 ? 1 : 2);
  return `${v.toFixed(digits)} ${units[i]}`;
}

console.log('REACHED 6: BEFORE_INDEXEDDB_FUNCTIONS');
function openIdb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_FILES)) {
        db.createObjectStore(IDB_STORE_FILES, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

async function idbGetPkl(key) {
  const db = await openIdb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_FILES, 'readonly');
      const store = tx.objectStore(IDB_STORE_FILES);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
    });
  } finally {
    db.close();
  }
}

async function idbDeletePkl(key) {
  const db = await openIdb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_FILES, 'readwrite');
      const store = tx.objectStore(IDB_STORE_FILES);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB delete aborted'));
    });
  } finally {
    db.close();
  }
}

async function idbSetPkl(key, { file, bytes }) {
  const db = await openIdb();
  try {
    const meta = {
      name: file?.name ?? '',
      size: file?.size ?? (bytes?.byteLength ?? 0),
      lastModified: file?.lastModified ?? 0,
      type: file?.type ?? 'application/octet-stream',
      savedAt: Date.now(),
    };

    const blob = file instanceof Blob ? file : new Blob([bytes ?? new Uint8Array()], { type: meta.type });

    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_FILES, 'readwrite');
      const store = tx.objectStore(IDB_STORE_FILES);
      store.put({ key, meta, blob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'));
    });

    return meta;
  } finally {
    db.close();
  }
}

async function refreshLastDatasetInfo() {
  if (els.lastDatasetInfo) {
    try {
      const rec = await idbGetPkl(IDB_KEY_ARCHIVE_PKL);
      const meta = rec?.meta;
      if (!meta?.name) {
        els.lastDatasetInfo.textContent = '';
      } else {
        const parts = [];
        parts.push(`Saved archive: ${meta.name}`);
        if (meta.size) parts.push(formatBytes(meta.size));
        if (meta.lastModified) parts.push(new Date(meta.lastModified).toLocaleString());
        els.lastDatasetInfo.textContent = parts.join(' • ');
      }
    } catch {
      els.lastDatasetInfo.textContent = '';
    }
  }

  if (els.lastCallDatasetInfo) {
    try {
      const rec = await idbGetPkl(IDB_KEY_CALL_PKL);
      const meta = rec?.meta;
      if (!meta?.name) {
        els.lastCallDatasetInfo.textContent = '';
      } else {
        const parts = [];
        parts.push(`Saved call data: ${meta.name}`);
        if (meta.size) parts.push(formatBytes(meta.size));
        if (meta.lastModified) parts.push(new Date(meta.lastModified).toLocaleString());
        els.lastCallDatasetInfo.textContent = parts.join(' • ');
      }
    } catch {
      els.lastCallDatasetInfo.textContent = '';
    }
  }
}

const METRICS = ['h80', 'v80'];
const METRIC_LABELS = {
  h80: 'Hor 80%',
  v80: 'Ver 80%',
};

const SECTION_ORDER = ['Results', 'Location Technology', 'Handset', 'Path', 'Point'];

function sortByPreferredOrder(values, preferredOrder) {
  const pref = new Map(preferredOrder.map((v, i) => [String(v).toLowerCase(), i]));
  return Array.from(values).sort((a, b) => {
    const ak = String(a ?? '').toLowerCase();
    const bk = String(b ?? '').toLowerCase();
    const ar = pref.has(ak) ? pref.get(ak) : Number.POSITIVE_INFINITY;
    const br = pref.has(bk) ? pref.get(bk) : Number.POSITIVE_INFINITY;
    if (ar !== br) return ar - br;
    return String(a ?? '').localeCompare(String(b ?? ''));
  });
}

function sortPivotRowsByRowKeys(pivot, { preferredOrderByKey = {} } = {}) {
  if (!pivot || !Array.isArray(pivot.rows) || !pivot.rowMeta || !Array.isArray(pivot.rowKeys)) return;
  if (pivot.rows.length <= 1) return;

  const orderMaps = new Map();
  for (const [key, order] of Object.entries(preferredOrderByKey)) {
    if (!key || !Array.isArray(order)) continue;
    orderMaps.set(
      key,
      new Map(order.map((v, i) => [String(v ?? '').toLowerCase(), i]))
    );
  }

  const compareValues = (key, aVal, bVal) => {
    const map = orderMaps.get(key);
    if (map) {
      // If this key is configured with ['*'], treat all values as equal and skip sorting by this key.
      if (map.size === 1 && map.has('*')) {
        return 0;
      }
      const ak = String(aVal ?? '').toLowerCase();
      const bk = String(bVal ?? '').toLowerCase();
      const ar = map.has(ak) ? map.get(ak) : Number.POSITIVE_INFINITY;
      const br = map.has(bk) ? map.get(bk) : Number.POSITIVE_INFINITY;
      if (ar !== br) return ar - br;
    }
    return String(aVal ?? '').localeCompare(String(bVal ?? ''));
  };

  pivot.rows.sort((aRowId, bRowId) => {
    const aMeta = pivot.rowMeta.get(aRowId) ?? {};
    const bMeta = pivot.rowMeta.get(bRowId) ?? {};

    for (const key of pivot.rowKeys) {
      const cmp = compareValues(key, aMeta[key], bMeta[key]);
      if (cmp) return cmp;
    }

    // Final fallback: stable, deterministic ordering.
    return String(aRowId ?? '').localeCompare(String(bRowId ?? ''));
  });
}

function sortRowIdsByRowKeys(rowIds, pivot, { preferredOrderByKey = {} } = {}) {
  if (!Array.isArray(rowIds) || !pivot || !pivot.rowMeta || !Array.isArray(pivot.rowKeys)) return rowIds;
  if (rowIds.length <= 1) return rowIds;

  const orderMaps = new Map();
  for (const [key, order] of Object.entries(preferredOrderByKey)) {
    if (!key || !Array.isArray(order)) continue;
    orderMaps.set(
      key,
      new Map(order.map((v, i) => [String(v ?? '').toLowerCase(), i]))
    );
  }

  const compareValues = (key, aVal, bVal) => {
    const map = orderMaps.get(key);
    if (map) {
      // If this key is configured with ['*'], treat all values as equal and skip sorting by this key.
      if (map.size === 1 && map.has('*')) {
        return 0;
      }
      const ak = String(aVal ?? '').toLowerCase();
      const bk = String(bVal ?? '').toLowerCase();
      const ar = map.has(ak) ? map.get(ak) : Number.POSITIVE_INFINITY;
      const br = map.has(bk) ? map.get(bk) : Number.POSITIVE_INFINITY;
      if (ar !== br) return ar - br;
    }
    return String(aVal ?? '').localeCompare(String(bVal ?? ''));
  };

  return rowIds.slice().sort((aRowId, bRowId) => {
    const aMeta = pivot.rowMeta.get(aRowId) ?? {};
    const bMeta = pivot.rowMeta.get(bRowId) ?? {};

    for (const key of pivot.rowKeys) {
      const cmp = compareValues(key, aMeta[key], bMeta[key]);
      if (cmp) return cmp;
    }
    return String(aRowId ?? '').localeCompare(String(bRowId ?? ''));
  });
}

const PARTICIPANT_ID_SEP = '\u0001';

function makeParticipantIdKey(participant, identifier) {
  return `${toKey(participant)}${PARTICIPANT_ID_SEP}${toKey(identifier)}`;
}

function setStatus(text, { error = false } = {}) {
  if (!els.statusText) return;
  els.statusText.textContent = text;
  els.statusText.style.color = error ? 'var(--danger)' : 'var(--text)';
}

function logDebug(message) {
  if (!els.debugLog) return;
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  els.debugLog.textContent += (els.debugLog.textContent ? '\n' : '') + line;
}

setStatus('Ready. Load a Dataset to begin.');
logDebug('app.js initialized.');



function setGridZoom(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return;
  const clamped = Math.max(0.5, Math.min(1, v));
  document.documentElement.style.setProperty('--grid-zoom', String(clamped));
}

// Restore grid zoom preference early.
/*
try {
  const saved = localStorage.getItem('resultsArchive.gridZoom');
  if (saved) setGridZoom(saved);
} catch {
  // ignore
}
*/

console.log('REACHED 8: AFTER_STORAGE_STARTUP');

// ...existing code...

try {
  setStatus('Ready. Load a Dataset (.pkl) to begin. Call data is optional.');
  logDebug('app.js initialized (storage startup temporarily disabled).');
  console.log('REACHED 8: BEFORE_ATTACH_FILE_INPUT_LISTENERS_CALL');
} catch (err) {
  console.error('[DIAG] Error after REACHED 8:', err);
}

// ...existing code...

function detectColumn(columns, candidates) {
  const lower = columns.map((c) => String(c).toLowerCase());
  for (const cand of candidates) {
    const idx = lower.indexOf(cand.toLowerCase());
    if (idx >= 0) return columns[idx];
  }
  // Fallback: contains-match
  for (const cand of candidates) {
    const idx = lower.findIndex((c) => c.includes(cand.toLowerCase()));
    if (idx >= 0) return columns[idx];
  }
  return null;
}

function guessMetricColumns(columns) {
  const h = detectColumn(columns, [
    'h80',
    'hor 80%',
    'horizontal 80%',
    'horizontal_80%',
    'horizontal80',
    'hor80',
    'horizontal 80',
  ]);
  const v = detectColumn(columns, [
    'v80',
    'ver 80%',
    'vertical 80%',
    'vertical_80%',
    'vertical80',
    'ver80',
    'vertical 80',
  ]);
  return { h80: h, v80: v };
}

function getMetricConfig() {
  const keys = [];
  const labels = {};

  const h = state.metricCols?.h80;
  const v = state.metricCols?.v80;

  if (h) {
    keys.push(h);
    labels[h] = METRIC_LABELS.h80;
  }
  if (v) {
    keys.push(v);
    labels[v] = METRIC_LABELS.v80;
  }

  return { metricKeys: keys, metricLabels: labels };
}

function setExportEnabled(enabled) {
  if (!els.exportExcel) return;
  els.exportExcel.disabled = !enabled;
}

function setCallsExportEnabled(enabled) {
  if (!els.exportCallsExcel) return;
  els.exportCallsExcel.disabled = !enabled;
}

function setCallsKmlExportEnabled(enabled) {
  if (!els.exportCallsKml) return;
  els.exportCallsKml.disabled = !enabled;
}

function canExportCallsKml() {
  if (!callState.records.length) return false;
  if (!callState.filteredRecords.length) return false;
  const c = callState.dimCols;
  const hasActualLatLon = Boolean(c.actual_lat && c.actual_lon);
  const hasActualAlt = Boolean(c.actual_geoid_alt || c.actual_hae_alt);
  const hasLocationAlt = Boolean(c.location_geoid_alt || c.location_hae_alt);
  return hasActualLatLon && hasActualAlt && hasLocationAlt;
}

function updateCallViewToggleButton() {
  const btn = els.callViewToggleBtn;
  if (!btn) return;

  const needsBuilding = Boolean(state.dimCols.building) || Boolean(callState.dimCols.building);
  const hasSelectedBuilding = Boolean(state.filters.building && state.filters.building.size > 0);

  const canShow = Boolean(callState.records.length) && (!needsBuilding || hasSelectedBuilding);
  btn.disabled = !canShow;

  if (!canShow) {
    btn.textContent = 'View Call Data';
    return;
  }

  btn.textContent = callUi.showPreview ? 'Hide Call Data' : 'View Call Data';
}

function updateCallLocationSourceButton() {
  const btn = els.callLocationSourceBtn;
  if (!btn) return;

  const canShow = Boolean(callState.records.length) && Boolean(callState.dimCols?.location_source);
  btn.disabled = !canShow;

  if (!canShow) {
    btn.textContent = 'Location Source: N/A';
    return;
  }

  const selected = state.filters.location_source;
  btn.textContent = `Location Source: ${selectionSummary(selected?.size ?? 0, 0)}`;
}

function safeFilePart(s) {
  return String(s ?? '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function formatDateForFilename(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function formatDateYmdHm(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildFiltersSummaryAoA() {
  const lines = [];
  const setToText = (set) => {
    if (!set) return '';
    if (set.size === 0) return 'All';
    return Array.from(set).join(', ');
  };

  lines.push(['Results Archive Export']);
  lines.push(['Exported at', new Date().toLocaleString()]);
  lines.push(['Build', document.getElementById('buildStamp')?.textContent ?? '']);
  lines.push([]);

  lines.push(['Buildings', setToText(state.filters.building)]);
  lines.push(['Participant', setToText(state.filters.participant)]);
  lines.push(['OS', setToText(state.filters.os)]);
  lines.push(['Stage', setToText(state.filters.stage)]);
  lines.push(['Path ID', setToText(state.filters.path_id)]);
  lines.push(['Point ID', setToText(state.filters.point_id)]);
  lines.push(['Section', setToText(state.filters.row_type)]);

  // Location Source is call-data-only; keep it out of the archive export unless call data is loaded.
  if (callState.records.length && callState.dimCols?.location_source) {
    lines.push(['Location Source', setToText(state.filters.location_source)]);
  }

  if (state.idBySection && state.idBySection.size) {
    lines.push([]);
    lines.push(['Identifier filters']);
    const sections = sortByPreferredOrder(Array.from(state.idBySection.keys()), SECTION_ORDER);
    for (const sec of sections) {
      const set = state.idBySection.get(sec);
      if (!set || set.size === 0) continue;
      lines.push([`Identifier — ${sec}`, `${set.size} selected`]);
    }
  }

  return lines;
}

function buildBuildingHealthAoA() {
  const lines = [];
  lines.push(['Building Health Check']);
  lines.push(['Exported at', new Date().toLocaleString()]);
  lines.push(['Build', document.getElementById('buildStamp')?.textContent ?? '']);
  lines.push([]);

  const buildingCol = state.dimCols.building;
  const stageCol = state.dimCols.stage;
  const rowTypeCol = state.dimCols.row_type;
  const hCol = state.metricCols?.h80;
  const vCol = state.metricCols?.v80;

  const toNum = (v) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  if (!buildingCol) {
    lines.push(['Missing Building column; cannot compute building health.']);
    return lines;
  }
  if (!stageCol) {
    lines.push(['Missing Stage column; cannot compute per-stage health.']);
    return lines;
  }
  if (!hCol && !vCol) {
    lines.push(['Missing metric columns (Horizontal/Vertical 80%); nothing to summarize.']);
    return lines;
  }

  const all = state.filteredRecords?.length ? state.filteredRecords : [];
  if (!all.length) {
    lines.push(['No filtered rows available. Select a building and ensure results are visible, then export again.']);
    return lines;
  }

  // If the dataset has a Section/Row Type column and includes a "point" section,
  // prefer using only point rows for health/bias (typically the most actionable level).
  let rows = all;
  if (rowTypeCol) {
    const pointRows = all.filter((r) => String(r?.[rowTypeCol] ?? '').toLowerCase() === 'point');
    if (pointRows.length) {
      rows = pointRows;
      lines.push(['Source rows', `Section=${rowTypeCol}=point (${rows.length.toLocaleString()} rows)`]);
    } else {
      lines.push(['Source rows', `All sections (${rows.length.toLocaleString()} rows)`]);
    }
  } else {
    lines.push(['Source rows', `All rows (${rows.length.toLocaleString()} rows)`]);
  }
  lines.push([]);

  const makeAgg = () => ({
    rows: 0,
    hN: 0,
    hSum: 0,
    hAbsSum: 0,
    hPos: 0,
    hNeg: 0,
    hZero: 0,
    vN: 0,
    vSum: 0,
    vAbsSum: 0,
    vPos: 0,
    vNeg: 0,
    vZero: 0,
  });

  const byBuildingStage = new Map();
  const byBuilding = new Map();

  const bumpAgg = (agg, hVal, vVal) => {
    agg.rows++;

    if (hVal !== null) {
      agg.hN++;
      agg.hSum += hVal;
      agg.hAbsSum += Math.abs(hVal);
      if (hVal > 0) agg.hPos++;
      else if (hVal < 0) agg.hNeg++;
      else agg.hZero++;
    }

    if (vVal !== null) {
      agg.vN++;
      agg.vSum += vVal;
      agg.vAbsSum += Math.abs(vVal);
      if (vVal > 0) agg.vPos++;
      else if (vVal < 0) agg.vNeg++;
      else agg.vZero++;
    }
  };

  for (const r of rows) {
    const b = toKey(r?.[buildingCol]) || '(blank)';
    const s = toKey(r?.[stageCol]) || '(blank)';

    const hVal = hCol ? toNum(r?.[hCol]) : null;
    const vVal = vCol ? toNum(r?.[vCol]) : null;

    const key = `${b}\u0000${s}`;
    if (!byBuildingStage.has(key)) byBuildingStage.set(key, { building: b, stage: s, agg: makeAgg() });
    bumpAgg(byBuildingStage.get(key).agg, hVal, vVal);

    if (!byBuilding.has(b)) byBuilding.set(b, makeAgg());
    bumpAgg(byBuilding.get(b), hVal, vVal);
  }

  const biasLabel = (bias) => {
    if (!Number.isFinite(bias)) return '';
    const a = Math.abs(bias);
    const strength = a >= 0.6 ? 'Strong' : a >= 0.3 ? 'Moderate' : a >= 0.15 ? 'Slight' : 'Mixed';
    if (strength === 'Mixed') return 'Mixed';
    return bias > 0 ? `${strength} +` : `${strength} -`;
  };

  const fmtPct = (num) => (Number.isFinite(num) ? num : '');


  const header = [
    'Building',
    'Stage',
    'Rows',
    'H80 N',
    'H80 Mean',
    'H80 MeanAbs',
    'H80 Pos%',
    'H80 Neg%',
    'H80 Bias',
    'H80 Bias Label',
    'V80 N',
    'V80 Mean',
    'V80 MeanAbs',
    'V80 Pos%',
    'V80 Neg%',
    'V80 Bias',
    'V80 Bias Label',
  ];
  lines.push(header);

  const entries = Array.from(byBuildingStage.values()).sort((a, b) => {
    const bc = a.building.localeCompare(b.building);
    if (bc) return bc;
    return a.stage.localeCompare(b.stage);
  });

  const emitAggRow = (building, stage, agg) => {
    const hMean = agg.hN ? agg.hSum / agg.hN : null;
    const hAbsMean = agg.hN ? agg.hAbsSum / agg.hN : null;
    const hPosPct = agg.hN ? agg.hPos / agg.hN : null;
    const hNegPct = agg.hN ? agg.hNeg / agg.hN : null;
    const hBiasDen = agg.hPos + agg.hNeg;
    const hBias = hBiasDen ? (agg.hPos - agg.hNeg) / hBiasDen : null;

    const vMean = agg.vN ? agg.vSum / agg.vN : null;
    const vAbsMean = agg.vN ? agg.vAbsSum / agg.vN : null;
    const vPosPct = agg.vN ? agg.vPos / agg.vN : null;
    const vNegPct = agg.vN ? agg.vNeg / agg.vN : null;
    const vBiasDen = agg.vPos + agg.vNeg;
    const vBias = vBiasDen ? (agg.vPos - agg.vNeg) / vBiasDen : null;

    lines.push([
      building,
      stage,
      agg.rows,
      agg.hN,
      hMean ?? '',
      hAbsMean ?? '',
      fmtPct(hPosPct),
      fmtPct(hNegPct),
      hBias ?? '',
      biasLabel(hBias ?? NaN),
      agg.vN,
      vMean ?? '',
      vAbsMean ?? '',
      fmtPct(vPosPct),
      fmtPct(vNegPct),
      vBias ?? '',
      biasLabel(vBias ?? NaN),
    ]);
  };

  for (const e of entries) emitAggRow(e.building, e.stage, e.agg);

  lines.push([]);
  lines.push(['Building Totals']);
  lines.push(header);
  const buildingNames = Array.from(byBuilding.keys()).sort((a, b) => a.localeCompare(b));
  for (const b of buildingNames) emitAggRow(b, '(All)', byBuilding.get(b));

  return lines;
}

function buildCallFiltersSummaryAoA() {
  const lines = [];
  const setToText = (set) => {
    if (!set) return '';
    if (set.size === 0) return 'All';
    return Array.from(set).join(', ');
  };

  lines.push(['Call Data Export']);
  lines.push(['Exported at', new Date().toLocaleString()]);
  lines.push(['Build', document.getElementById('buildStamp')?.textContent ?? '']);
  lines.push([]);

  lines.push(['Buildings', setToText(state.filters.building)]);
  lines.push(['Participant', setToText(state.filters.participant)]);
  lines.push(['Stage', setToText(state.filters.stage)]);
  lines.push(['Path ID', setToText(state.filters.path_id)]);
  lines.push(['Point ID', setToText(state.filters.point_id)]);

  if (callState.dimCols?.location_source) {
    lines.push(['Location Source', setToText(state.filters.location_source)]);
  }

  return lines;
}

function exportCallsToExcel() {
  const XLSX = window.XLSX;
  if (!XLSX) {
    setStatus('Excel export library not loaded yet. Please refresh and try again.', { error: true });
    return;
  }

  if (!callState.records.length) {
    setStatus('No call data loaded yet.', { error: true });
    return;
  }

  const rows = callState.filteredRecords?.length ? callState.filteredRecords : [];
  if (!rows.length) {
    setStatus('No call rows match the selected filters.', { error: true });
    return;
  }

  const cols = (callState.columns ?? []).slice();
  if (!cols.length) {
    setStatus('Call data has no detected columns to export.', { error: true });
    return;
  }

  const aoa = [cols];
  for (const r of rows) {
    aoa.push(cols.map((c) => {
      const v = r?.[c];
      if (v === null || v === undefined) return '';
      if (typeof v === 'number') return v;
      return String(v);
    }));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Freeze header row.
  const ySplit = 1;
  const topLeftCell = XLSX.utils.encode_cell({ r: ySplit, c: 0 });
  ws['!sheetViews'] = [{ pane: { state: 'frozen', xSplit: 0, ySplit, topLeftCell, activePane: 'bottomLeft' } }];

  // Autofilter the full range.
  const lastRow = aoa.length - 1;
  const lastCol = cols.length - 1;
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } }) };

  // Light column sizing based on first N rows.
  const maxChars = new Array(cols.length).fill(6);
  const sampleRows = Math.min(aoa.length, 300);
  for (let r = 0; r < sampleRows; r++) {
    for (let c = 0; c < cols.length; c++) {
      const v = aoa[r]?.[c];
      const s = v === null || v === undefined ? '' : String(v);
      maxChars[c] = Math.min(70, Math.max(maxChars[c], s.length));
    }
  }
  ws['!cols'] = maxChars.map((wch) => ({ wch: Math.min(72, Math.max(8, wch)) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Call Data');

  const ws2 = XLSX.utils.aoa_to_sheet(buildCallFiltersSummaryAoA());
  ws2['!cols'] = [{ wch: 24 }, { wch: 120 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Filters');

  const dt = new Date();
  const buildingPart = state.filters.building && state.filters.building.size
    ? `_${safeFilePart(Array.from(state.filters.building).slice(0, 3).join('-'))}${state.filters.building.size > 3 ? '_and_more' : ''}`
    : '';
  const filename = `Call_Data_${formatDateForFilename(dt)}${buildingPart}.xlsx`;

  try {
    XLSX.writeFile(wb, filename, { compression: true });
    setStatus(`Exported Excel: ${filename}`);
  } catch (err) {
    console.error(err);
    setStatus(`Excel export failed: ${err?.message ?? String(err)}`, { error: true });
  }
}

function parseNumber(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function cdataSafe(s) {
  return String(s ?? '').replaceAll(']]>', ']]&gt;');
}

function xmlEscape(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function downloadTextFile({ filename, text, mime }) {
  const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildCallKmlFromRows({ rows, docName, groupByParticipant = false }) {
  const c = callState.dimCols;

  // Big KMLs can be slow in Google Earth.
  const hardLimit = 50000;
  if (rows.length > hardLimit) {
    const ok = confirm(`You are exporting ${rows.length.toLocaleString()} call vectors. This may be very large/slow in Google Earth. Continue?`);
    if (!ok) return null;
  }

  const STYLE_OK = 'lineOk';
  const STYLE_BAD = 'lineBad';
  const OK_VERT_M = 5;
  const OK_HORIZ_M = 50;

  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const cVal = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * cVal;
  };

  const pieces = [];
  pieces.push('<?xml version="1.0" encoding="UTF-8"?>');
  pieces.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
  pieces.push('<Document>');
  pieces.push(`<name>${xmlEscape(docName || `Call Vectors (${rows.length.toLocaleString()})`)}</name>`);

  // ABGR colors: ff00ff00 = green, ff0000ff = red
  pieces.push('<Style id="lineOk"><LineStyle><color>ff00ff00</color><width>2</width></LineStyle></Style>');
  pieces.push('<Style id="lineBad"><LineStyle><color>ff0000ff</color><width>2</width></LineStyle></Style>');

  const buildingCol = c.building;
  const participantCol = c.participant;
  const locationSourceCol = c.location_source;

  const makeNode = () => ({ count: 0, items: [], children: new Map() });
  const root = makeNode();

  const getOrCreateChild = (node, name) => {
    const key = toKey(name);
    if (!node.children.has(key)) node.children.set(key, makeNode());
    return node.children.get(key);
  };

  const addPlacemark = (r, placemarkXml) => {
    root.count++;

    // Grouping strategy:
    // - Default: by Building (previous behavior)
    // - If groupByParticipant:
    //     Participant -> Location Source (if available) -> Building (if available)
    //     Otherwise Participant -> Building (if available)
    if (groupByParticipant && participantCol) {
      const p = toKey(r?.[participantCol]) || '(blank)';
      const pNode = getOrCreateChild(root, p);
      pNode.count++;

      if (locationSourceCol) {
        const ls = toKey(r?.[locationSourceCol]) || '(blank)';
        const lsNode = getOrCreateChild(pNode, ls);
        lsNode.count++;

        if (buildingCol) {
          const b = toKey(r?.[buildingCol]) || '(blank)';
          const bNode = getOrCreateChild(lsNode, b);
          bNode.count++;
          bNode.items.push(placemarkXml);
          return;
        }

        lsNode.items.push(placemarkXml);
        return;
      }

      if (buildingCol) {
        const b = toKey(r?.[buildingCol]) || '(blank)';
        const bNode = getOrCreateChild(pNode, b);
        bNode.count++;
        bNode.items.push(placemarkXml);
        return;
      }

      pNode.items.push(placemarkXml);
      return;
    }

    if (buildingCol) {
      const b = toKey(r?.[buildingCol]) || '(blank)';
      const bNode = getOrCreateChild(root, b);
      bNode.count++;
      bNode.items.push(placemarkXml);
      return;
    }

    root.items.push(placemarkXml);
  };

  for (const r of rows) {
    const actualLat = parseNumber(r?.[c.actual_lat]);
    const actualLon = parseNumber(r?.[c.actual_lon]);
    if (actualLat === null || actualLon === null) continue;

    const locLat = c.location_lat ? (parseNumber(r?.[c.location_lat]) ?? actualLat) : actualLat;
    const locLon = c.location_lon ? (parseNumber(r?.[c.location_lon]) ?? actualLon) : actualLon;

    const actualGeoid = c.actual_geoid_alt ? parseNumber(r?.[c.actual_geoid_alt]) : null;
    const actualHae = c.actual_hae_alt ? parseNumber(r?.[c.actual_hae_alt]) : null;
    const geoidSep = (actualGeoid !== null && actualHae !== null) ? (actualHae - actualGeoid) : null;

    // Google Earth's "absolute" altitude behaves like meters above sea level (geoid-ish).
    // Use surveyed Geoid Alt if present; otherwise convert from HAE using the surveyed separation.
    const actualAlt = actualGeoid !== null ? actualGeoid : (actualHae !== null && geoidSep !== null ? (actualHae - geoidSep) : actualHae);

    const locGeoid = c.location_geoid_alt ? parseNumber(r?.[c.location_geoid_alt]) : null;
    const locHae = c.location_hae_alt ? parseNumber(r?.[c.location_hae_alt]) : null;
    const locAlt = locGeoid !== null
      ? locGeoid
      : (locHae !== null && geoidSep !== null ? (locHae - geoidSep) : locHae);

    if (actualAlt === null || locAlt === null) continue;

    const delta = locAlt - actualAlt;
    const horizM = haversineMeters(actualLat, actualLon, locLat, locLon);
    const vertM = Math.abs(delta);
    const isOk = (vertM < OK_VERT_M) && (horizM < OK_HORIZ_M);
    const styleUrl = isOk ? `#${STYLE_OK}` : `#${STYLE_BAD}`;

    const buildingVal = buildingCol ? toKey(r?.[buildingCol]) : '';
    const stageVal = c.stage ? toKey(r?.[c.stage]) : '';
    const participantVal = c.participant ? toKey(r?.[c.participant]) : '';
    const pathVal = c.path_id ? toKey(r?.[c.path_id]) : '';
    const pointVal = c.point_id ? toKey(r?.[c.point_id]) : '';

    const nameBits = [];
    if (buildingVal) nameBits.push(buildingVal);
    if (stageVal) nameBits.push(stageVal);
    if (pointVal) nameBits.push(pointVal);
    const placemarkName = nameBits.length ? nameBits.join(' • ') : 'Call Vector';

    const descLines = [];
    if (buildingVal) descLines.push(`Building: ${buildingVal}`);
    if (stageVal) descLines.push(`Stage: ${stageVal}`);
    if (participantVal) descLines.push(`Participant: ${participantVal}`);
    if (pathVal) descLines.push(`Path ID: ${pathVal}`);
    if (pointVal) descLines.push(`Point ID: ${pointVal}`);
    if (c.location_source) descLines.push(`Location Source: ${toKey(r?.[c.location_source])}`);
    descLines.push(`Actual Alt (MSL): ${actualAlt}`);
    descLines.push(`Location Alt (MSL): ${locAlt}`);
    descLines.push(`Delta (Location-Actual): ${delta}`);
    descLines.push(`Horizontal distance: ${Number.isFinite(horizM) ? horizM.toFixed(2) : ''} m`);
    descLines.push(`Vertical distance: ${Number.isFinite(vertM) ? vertM.toFixed(2) : ''} m`);
    descLines.push(`Pass (H<${OK_HORIZ_M}m & V<${OK_VERT_M}m): ${isOk ? 'YES' : 'NO'}`);
    if (geoidSep !== null) descLines.push(`Geoid Sep (HAE-Geoid): ${geoidSep}`);

    const coords = `${actualLon},${actualLat},${actualAlt} ${locLon},${locLat},${locAlt}`;

    const pm = [];
    pm.push('<Placemark>');
    pm.push(`<name>${xmlEscape(placemarkName)}</name>`);
    pm.push(`<styleUrl>${styleUrl}</styleUrl>`);
    pm.push(`<description><![CDATA[${cdataSafe(descLines.join('<br/>'))}]]></description>`);
    pm.push('<LineString>');
    pm.push('<tessellate>0</tessellate>');
    pm.push('<altitudeMode>absolute</altitudeMode>');
    pm.push(`<coordinates>${coords}</coordinates>`);
    pm.push('</LineString>');
    pm.push('</Placemark>');

    addPlacemark(r, pm.join(''));
  }

  const emitNode = (name, node) => {
    pieces.push('<Folder>');
    pieces.push(`<name>${xmlEscape(`${name} (${node.count.toLocaleString()})`)}</name>`);
    pieces.push('<open>0</open>');
    pieces.push(...node.items);
    const childNames = Array.from(node.children.keys()).sort((a, b) => a.localeCompare(b));
    for (const childName of childNames) {
      emitNode(childName, node.children.get(childName));
    }
    pieces.push('</Folder>');
  };

  // Root-level placemarks (only when no grouping columns exist).
  pieces.push(...root.items);

  const topNames = Array.from(root.children.keys()).sort((a, b) => a.localeCompare(b));
  for (const n of topNames) {
    emitNode(n, root.children.get(n));
  }

  pieces.push('</Document>');
  pieces.push('</kml>');

  return pieces.join('\n');
}

async function exportCallsToKml() {
  if (!canExportCallsKml()) {
    setStatus('KML export unavailable: missing required columns (Actual Lat/Lon + altitudes).', { error: true });
    return;
  }


  // If we don't have surveyed geoid separation, exporting absolute altitudes from HAE may be offset.
  const c = callState.dimCols;
  const hasGeoidSeparation = Boolean(c.actual_geoid_alt && c.actual_hae_alt);
  const willUseHaeForActual = Boolean(c.actual_hae_alt && !c.actual_geoid_alt);
  const willUseHaeForLocation = Boolean(c.location_hae_alt && !c.location_geoid_alt);
  if (!hasGeoidSeparation && (willUseHaeForActual || willUseHaeForLocation)) {
    const ok = confirm('This call dataset does not appear to include both Actual Geoid Alt and Actual HAE Alt.\n\nThe KML will still export, but absolute altitudes may be offset because Google Earth expects MSL/Geoid-like heights.\n\nContinue?');
    if (!ok) return;
  }

  const rows = callState.filteredRecords;
  const participantCol = callState.dimCols.participant;

  const buildingLabel = (() => {
    const selected = state.filters.building;
    if (!selected || selected.size === 0) return 'All Buildings';
    const arr = Array.from(selected);
    if (arr.length === 1) return arr[0];
    const head = arr.slice(0, 3).join(', ');
    return `${head}${arr.length > 3 ? ` +${arr.length - 3} more` : ''}`;
  })();

  // Export a single combined KML. If Participant is present, group into toggleable folders.
  const grouped = Boolean(participantCol);
  const kml = buildCallKmlFromRows({
    rows,
    docName: grouped
      ? `Call Vectors (by Participant) — ${buildingLabel} (${rows.length.toLocaleString()})`
      : `Call Vectors — ${buildingLabel} (${rows.length.toLocaleString()})`,
    groupByParticipant: grouped,
  });
  if (!kml) return;
  const dt = new Date();
  const buildingPart = state.filters.building && state.filters.building.size
    ? `_${safeFilePart(Array.from(state.filters.building).slice(0, 3).join('-'))}${state.filters.building.size > 3 ? '_and_more' : ''}`
    : '';
  const filename = `Call_Vectors_${grouped ? 'By_Participant_' : ''}${formatDateForFilename(dt)}${buildingPart}.kml`;
  downloadTextFile({ filename, text: kml, mime: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
  setStatus(`Exported KML: ${filename}`);
}

function exportCurrentPivotToExcel() {
    // ...existing code...
  
  const XLSX = window.XLSX;
  if (!XLSX) {
    setStatus('Excel export library not loaded yet. Please refresh and try again.', { error: true });
    return;
  }

  const pivot = state.lastPivot;
  const rowHeaderCols = state.lastRowHeaderCols;
  console.log("rowHeaderCols at export:", rowHeaderCols);
  if (!pivot || !Array.isArray(pivot.cols) || !Array.isArray(pivot.rows) || !rowHeaderCols) {
    setStatus('Nothing to export yet (load data + select building(s)).', { error: true });
    return;
  }

  const leftCols = rowHeaderCols.map((c) => (typeof c === 'string' ? ({ key: c, label: c }) : c));
  const leftCount = leftCols.length;
  const stages = pivot.cols;
  const { metricKeys, metricLabels } = getMetricConfig();
  const metricCount = metricKeys.length;

  if (!metricCount) {
    setStatus('Could not find metric columns (Horizontal/Vertical 80%).', { error: true });
    return;
  }

  const lastCol = leftCount + stages.length * metricCount - 1;

  // Title + generated rows (like the screenshot).
  const now = new Date();
  const titleRow = ['Stage Comparison', ...Array(lastCol).fill('')];
  const generatedRow = [`Generated ${formatDateYmdHm(now)}`, ...Array(lastCol).fill('')];
  const spacerRow = Array(lastCol + 1).fill('');

  // Build a two-row header like the grid:
  // Row 1: left column labels + merged stage group headers.
  // Row 2: (blank under left headers) + metric subheaders (Hor/Ver 80%).
  const headerTop = leftCols.map((c) => String(c?.label ?? c?.key ?? ''));
  for (const s of stages) {
    const stageLabel = String(s).toLowerCase().startsWith('stage ') ? String(s) : `Stage ${s}`;
    for (let i = 0; i < metricCount; i++) {
      headerTop.push(i === 0 ? stageLabel : '');
    }
  }

  const headerSub = Array(leftCount).fill('');
  for (const _s of stages) {
    for (const m of metricKeys) {
      headerSub.push(String(metricLabels?.[m] ?? m));
    }
  }

  const aoa = [titleRow, generatedRow, spacerRow, headerTop, headerSub];
  const HEADER_TOP_ROW = 3, HEADER_SUB_ROW = 4, DATA_START_ROW = 5;

  const exportRowIds = state.dimCols.row_type
    ? sortRowIdsByRowKeys(pivot.rows, pivot, {
      preferredOrderByKey: {
        [state.dimCols.row_type]: SECTION_ORDER,
        OS: ['*'], // treat all OS values as equal, disables OS-based sorting
      },
      rowKeys: rowHeaderCols.rowKeys
    })
    : pivot.rows;

  // Track previous values for each left column to blank repeats
  const prevVals = new Array(leftCols.length).fill(undefined);
  for (const rowId of exportRowIds) {
    const meta = pivot.rowMeta?.get(rowId) ?? {};
    const row = [];
    // Determine indices for group keys
    const buildingIndex = leftCols.findIndex(c => c.key === state.dimCols.building);
    const sectionIndex  = leftCols.findIndex(c => c.key === state.dimCols.row_type);

    // Detect group boundaries
    const buildingChanged = buildingIndex >= 0 && meta[state.dimCols.building] !== prevVals[buildingIndex];
    const sectionChanged  = sectionIndex  >= 0 && meta[state.dimCols.row_type]  !== prevVals[sectionIndex];

    // Reset duplicate suppression when groups change
    if (buildingChanged) {
      // New building → reset everything
      prevVals.fill(undefined);
    } else if (sectionChanged) {
      // New section → reset section only
      prevVals[sectionIndex] = undefined;
    }

    // Fill left columns with selective duplicate suppression
    for (let i = 0; i < leftCols.length; i++) {
      const key = leftCols[i].key;
      const val = meta[key];

      // Only suppress duplicates for Building, Participant, Section
      const suppress =
        key === state.dimCols.building ||
        key === state.dimCols.participant ||
        key === state.dimCols.row_type;

      if (suppress) {
        if (prevVals[i] === val) {
          row.push('');
        } else {
          row.push(val);
          prevVals[i] = val;
        }
      } else {
        // Always show OS and Identifier
        row.push(val);
        prevVals[i] = val;
      }
    }
    // Fill metric columns for each stage (mirroring grid)
    for (const s of stages) {
      const rowMap = pivot.matrix?.get(rowId);
      const cell = rowMap ? rowMap.get(s) : undefined;
      for (const m of metricKeys) {
        let v = cell && typeof cell === 'object' ? cell[m] : undefined;
        let formatted = '';
        if (v !== undefined && v !== null && v !== '') {
          const num = typeof v === 'number' ? v : Number(v);
          if (Number.isFinite(num) && String(v).trim() !== '') {
            formatted = num.toFixed(2);
          } else {
            formatted = String(v);
          }
        }
        row.push(formatted);
      }
    }
    aoa.push(row);
  }

  const lastRow = aoa.length - 1;
  const ySplit = 5;
  // --- Custom column widths as requested ---
  let ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 20 }, // Identifier
    { wch: 15 }, // Building
    { wch: 15 }, // Participant
    { wch: 12 }, // OS
    { wch: 18 }, // Section
    ...Array(lastCol - 4).fill({ wch: 15 })
  ];
  const topLeftCell = XLSX.utils.encode_cell({ r: ySplit, c: leftCount });
  ws['!sheetViews'] = [{ pane: { state: 'frozen', xSplit: leftCount, ySplit, topLeftCell, activePane: 'bottomRight' } }];

  // --- Helper to apply style to a cell ---
  const applyStyle = (r, c, style) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = ws[addr];
    if (!cell) return;
    cell.s = { ...(cell.s || {}), ...(style || {}) };
  };



  const wb = XLSX.utils.book_new();

  // Group rows by building and participant, insert summary row at top of each participant section
  const buildingGroups = {};
  for (const rowId of exportRowIds) {
    const meta = pivot.rowMeta?.get(rowId) ?? {};
    const building = meta['Building'] || meta['building'] || meta[leftCols.find(c => c.key.toLowerCase() === 'building')?.key];
    if (!buildingGroups[building]) buildingGroups[building] = [];
    buildingGroups[building].push(rowId);
  }
  for (const building of Object.keys(buildingGroups)) {
    let aoaBuilding = [];
    const SECTION_ORDER = ['Results', 'Location Technology', 'Handset', 'Point', 'Path'];
    const buildingRows = buildingGroups[building].map(rowId => {
      const meta = pivot.rowMeta?.get(rowId) ?? {};
      const participant = meta['Participant'] || meta['participant'] || meta[leftCols.find(c => c.key.toLowerCase() === 'participant')?.key];
      const section = meta['Section'] || meta['section'] || meta[leftCols.find(c => c.key.toLowerCase() === 'section')?.key];
      return { rowId, participant, section, meta };
    });
    // Group rows by participant
    const participantGroups = {};
    for (const row of buildingRows) {
      const key = String(row.participant);
      if (!participantGroups[key]) participantGroups[key] = [];
      participantGroups[key].push(row);
    }
    // Sort each participant group by SECTION_ORDER, then OS, Identifier, rowId
    const sortedRows = [];
    Object.values(participantGroups).forEach(group => {
      group.sort((a, b) => {
        const aIdx = SECTION_ORDER.indexOf(a.section);
        const bIdx = SECTION_ORDER.indexOf(b.section);

        // Primary: section order
        const aRank = aIdx === -1 ? 999 : aIdx;
        const bRank = bIdx === -1 ? 999 : bIdx;
        if (aRank !== bRank) return aRank - bRank;

        // Secondary: preserve original order within the section
        return a.rowId - b.rowId;
      });
      sortedRows.push(...group);
    });
    let prevParticipant = null;
    let prevSection = null;
    let prevVals = new Array(leftCols.length).fill(undefined);
    let headerAdded = false;
    for (const { rowId, participant, section, meta } of sortedRows) {
      // Insert empty row between participant sections
      if (prevParticipant !== null && participant !== prevParticipant) {
        aoaBuilding.push(Array(headerTop.length).fill(''));
        prevVals = new Array(leftCols.length).fill(undefined);   // <-- add this
      }
      // Insert blank row and bolded header for new section
      if (prevSection !== null && section !== prevSection) {
        aoaBuilding.push(Array(headerTop.length).fill(''));
        const sectionHeader = Array(leftCols.length).fill('');
        sectionHeader[leftCols.findIndex(c => c.key.toLowerCase() === 'section')] = section;
        aoaBuilding.push(sectionHeader);
        prevVals = new Array(leftCols.length).fill(undefined);   // <-- add this
      }
      // If this is the very first row, insert the header at the top (no summary row)
      if (!headerAdded) {
        aoaBuilding.push([...titleRow]);
        aoaBuilding.push([...generatedRow]);
        aoaBuilding.push([...spacerRow]);
        aoaBuilding.push([...headerTop]);
        aoaBuilding.push([...headerSub]);
        headerAdded = true;
      }
      prevParticipant = participant;
      prevSection = section;
      // Build row as before
      const row = [];
      for (let i = 0; i < leftCols.length; i++) {
        const key = leftCols[i].key;
        const val = meta[key];
        // Remove duplicates for Building only within the entire sheet, and Participant only within each group
        if (key.toLowerCase() === 'building') {
          // Only show Building once at the top, then blank for subsequent rows
          if (prevVals[i] === undefined) {
            row.push(val);
            prevVals[i] = val;
          } else {
            row.push('');
          }
        } else if (key.toLowerCase() === 'participant') {
          if (prevVals[i] === val) {
            row.push('');
          } else {
            row.push(val);
            prevVals[i] = val;
          }
        } else if (key.toLowerCase() === 'os') {
          row.push(val); // always show OS, no suppression
        } else {
          row.push(val);
        }
      }
      for (const s of stages) {
        const rowMap = pivot.matrix?.get(rowId);
        const cell = rowMap ? rowMap.get(s) : undefined;
        for (const m of metricKeys) {
          let v = cell && typeof cell === 'object' ? cell[m] : undefined;
          let formatted = '';
          if (v !== undefined && v !== null && v !== '') {
            const num = typeof v === 'number' ? v : Number(v);
            if (Number.isFinite(num) && String(v).trim() !== '') {
              formatted = num.toFixed(2);
            } else {
              formatted = String(v);
            }
          }
          row.push(formatted);
        }
      }
      aoaBuilding.push(row);
    }
    // Create worksheet for this building
    const wsBuilding = XLSX.utils.aoa_to_sheet(aoaBuilding);
    wsBuilding['!cols'] = ws['!cols'];
    // Only style true header rows (headerTop/headerSub) in each block
    // Find all header row indices (rows that match headerTop or headerSub exactly)
    const headerRowIndices = [];
    for (let r = 0; r < aoaBuilding.length; r++) {
      const row = aoaBuilding[r];
      if (
        Array.isArray(row) &&
        (row.join('|||') === headerTop.join('|||') || row.join('|||') === headerSub.join('|||'))
      ) {
        headerRowIndices.push(r);
      }
    }
    for (const r of headerRowIndices) {
      const isTop = aoaBuilding[r].join('|||') === headerTop.join('|||');
      const isSub = aoaBuilding[r].join('|||') === headerSub.join('|||');
      for (let c = 0; c < headerTop.length; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = wsBuilding[addr];
        if (!cell) continue;
        if (isTop) {
          // Left headers gray+green, stage headers orange
          if (c < leftCols.length) cell.s = STYLE_HEADER_LEFT;
          else cell.s = STYLE_HEADER_STAGE;
        } else if (isSub) {
          cell.s = STYLE_HEADER_SUB;
        }
      }
    }
    // Merge timestamp row
    wsBuilding['!merges'] = wsBuilding['!merges'] || [];
    wsBuilding['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: headerTop.length - 1 } });
    // Merge left headers
    for (let c = 0; c < leftCols.length; c++) {
      wsBuilding['!merges'].push({ s: { r: 3, c }, e: { r: 4, c } });
    }
    for (let i = 0; i < stages.length; i++) {
      const startCol = leftCols.length + i * metricCount;
      const endCol = startCol + metricCount - 1;
      if (endCol > startCol) {
        wsBuilding['!merges'].push({ s: { r: 3, c: startCol }, e: { r: 3, c: endCol } });
      }
    }
    // Freeze header rows so they remain visible when scrolling
    // Freeze the top 5 rows (rows 0-4) so header is always visible
    wsBuilding['!sheetViews'] = [{ pane: { state: 'frozen', xSplit: 0, ySplit: 5, topLeftCell: XLSX.utils.encode_cell({ r: 5, c: 0 }), activePane: 'bottomLeft' } }];
    // Find column indices for 'Hor 80%' and 'Ver 80%' in headerSub
    const eightyColIndices = [];
    for (let c = 0; c < headerTop.length; c++) {
      if (headerSub[c] && (headerSub[c].toLowerCase().includes('hor 80%') || headerSub[c].toLowerCase().includes('ver 80%'))) {
        eightyColIndices.push(c);
      }
    }
    // Add a black border and apply red style to 80% columns in data rows
    const borderRange = { s: { r: 3, c: 0 }, e: { r: aoaBuilding.length - 1, c: headerTop.length - 1 } };
    // Find column indices for left columns: Building, Participant, OS, Section
    const leftColNames = ['Building', 'Participant', 'OS', 'Section'];
    const leftColIndices = leftColNames.map(name => headerTop.findIndex(h => h.toLowerCase() === name.toLowerCase())).filter(idx => idx !== -1);

    for (let r = borderRange.s.r; r <= borderRange.e.r; r++) {
      // Only apply styles to data rows (not headerTop/headerSub)
      const isHeader = headerRowIndices.includes(r);
      // Detect if this is an empty row (all cells are empty string)
      const isEmptyRow = Array.isArray(aoaBuilding[r]) && aoaBuilding[r].every(v => v === '');
      for (let c = borderRange.s.c; c <= borderRange.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = wsBuilding[addr];
        if (!cell) continue;
        cell.s = cell.s || {};
        if (isHeader) {
          // Keep all borders for header rows
          cell.s.border = {
            top:    { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left:   { style: 'thin', color: { rgb: 'FF000000' } },
            right:  { style: 'thin', color: { rgb: 'FF000000' } }
          };
        } else if (isEmptyRow) {
          // Only top and bottom borders for empty row
          cell.s.border = {
            top:    { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } }
          };
        } else {
          // Add vertical borders only to the outside (first and last columns)
          if (c === borderRange.s.c && c === borderRange.e.c) {
            // Only one column: all borders (vertical thin, horizontal dotted)
            cell.s.border = {
              top:    { style: 'dotted', color: { rgb: 'FF000000' } },
              bottom: { style: 'dotted', color: { rgb: 'FF000000' } },
              left:   { style: 'thin', color: { rgb: 'FF000000' } },
              right:  { style: 'thin', color: { rgb: 'FF000000' } }
            };
          } else if (c === borderRange.s.c) {
            // First column: left border (vertical thin, horizontal dotted)
            cell.s.border = {
              top:    { style: 'dotted', color: { rgb: 'FF000000' } },
              bottom: { style: 'dotted', color: { rgb: 'FF000000' } },
              left:   { style: 'thin', color: { rgb: 'FF000000' } }
            };
          } else if (c === borderRange.e.c) {
            // Last column: right border (vertical thin, horizontal dotted)
            cell.s.border = {
              top:    { style: 'dotted', color: { rgb: 'FF000000' } },
              bottom: { style: 'dotted', color: { rgb: 'FF000000' } },
              right:  { style: 'thin', color: { rgb: 'FF000000' } }
            };
          } else {
            // Inner columns: only top and bottom, both dotted
            cell.s.border = {
              top:    { style: 'dotted', color: { rgb: 'FF000000' } },
              bottom: { style: 'dotted', color: { rgb: 'FF000000' } }
            };
          }
        }
        // Apply red font to 80% columns in data rows only
        if (!isHeader && eightyColIndices.includes(c)) {
          cell.s.font = { ...(cell.s.font || {}), color: { rgb: 'FFC00000' } };
        }
        // Apply green font to left columns in data rows only
        if (!isHeader && leftColIndices.includes(c)) {
          cell.s.font = { ...(cell.s.font || {}), color: { rgb: GREEN } };
        }
      }
    }
    let sheetName = String(building || 'Building');
    if (!sheetName.trim()) sheetName = 'Building';
    XLSX.utils.book_append_sheet(wb, wsBuilding, sheetName);
  }
  

  // Building health check sheet
  const wsHealth = XLSX.utils.aoa_to_sheet(buildBuildingHealthAoA());
  wsHealth['!cols'] = [
    { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsHealth, 'Building Health');

  // Filters/metadata sheet

  const ws2_filters = XLSX.utils.aoa_to_sheet(buildFiltersSummaryAoA());
  ws2_filters['!cols'] = [{ wch: 24 }, { wch: 120 }];
  // Only add 'Filters' sheet if it does not already exist in this workbook
  if (!wb.SheetNames.includes('Filters')) {
    XLSX.utils.book_append_sheet(wb, ws2_filters, 'Filters');
  }

  const dt_export = new Date();
  const buildingPart_export = state.filters.building && state.filters.building.size
    ? `_${safeFilePart(Array.from(state.filters.building).slice(0, 3).join('-'))}${state.filters.building.size > 3 ? '_and_more' : ''}`
    : '';
  const filename_export = `Stage_Comparison_${formatDateForFilename(dt_export)}${buildingPart_export}.xlsx`;

  try {
    XLSX.writeFile(wb, filename_export, { compression: true });
    setStatus(`Exported Excel: ${filename_export}`);
  } catch (err) {
    console.error(err);
    setStatus(`Excel export failed: ${err?.message ?? String(err)}`, { error: true });
  }
}

// Ensure exportCurrentPivotToExcel is globally accessible for button event handlers
window.exportCurrentPivotToExcel = exportCurrentPivotToExcel;

function guessDimensionColumns(columns) {
  return {
    stage: detectColumn(columns, ['stage', 'stg', 'phase']),
    building: detectColumn(columns, [
      'building_id',
      'building id',
      'buildingid',
      'building',
      'bldg_id',
      'bldg id',
      'bldgid',
      'bldg',
      'site_id',
      'site id',
      'site',
      'location',
    ]),
    participant: detectColumn(columns, ['participant', 'carrier', 'name', 'user', 'person']),
    path_id: detectColumn(columns, ['path_id', 'path id', 'path', 'pathid']),
    point_id: detectColumn(columns, ['point_id', 'point id', 'point', 'pointid']),
    os: detectColumn(columns, ['os', 'operating system', 'platform']),
    row_type: detectColumn(columns, ['row_type', 'row type', 'type', 'section']),
    id: detectColumn(columns, ['id', 'label', 'name']),
  };
}

function guessCallDimensionColumns(columns) {
  return {
    participant: detectColumn(columns, ['participant', 'carrier', 'name', 'user', 'person']),
    stage: detectColumn(columns, ['stage', 'stg', 'phase']),
    building: detectColumn(columns, [
      'building_id',
      'building id',
      'buildingid',
      'building',
      'bldg_id',
      'bldg id',
      'bldgid',
      'bldg',
      'site_id',
      'site id',
      'site',
      'location',
    ]),
    path_id: detectColumn(columns, ['path_id', 'path id', 'path', 'pathid']),
    point_id: detectColumn(columns, ['point_id', 'point id', 'point', 'pointid']),
    location_source: detectColumn(columns, ['location_source', 'location source', 'loc source', 'source']),

    actual_lat: detectColumn(columns, ['actual lat', 'actual_lat', 'actual latitude', 'survey lat']),
    actual_lon: detectColumn(columns, ['actual lon', 'actual_lon', 'actual longitude', 'survey lon']),
    actual_geoid_alt: detectColumn(columns, ['actual geoid alt', 'actual geoid altitude', 'geoid alt', 'geoid_alt', 'geoid altitude']),
    actual_hae_alt: detectColumn(columns, ['actual hae alt', 'actual hae altitude', 'hae alt', 'hae_alt', 'hae altitude']),

    location_lat: detectColumn(columns, ['location lat', 'location latitude', 'loc lat', 'reported lat', 'estimated lat']),
    location_lon: detectColumn(columns, ['location lon', 'location longitude', 'loc lon', 'reported lon', 'estimated lon']),
    location_geoid_alt: detectColumn(columns, ['location geoid alt', 'location geoid altitude', 'loc geoid alt']),
    // Your measured altitude column is typically just "Location Altitude" (assumed HAE).
    location_hae_alt: detectColumn(columns, [
      'location altitude (hae)',
      'location alt (hae)',
      'location hae alt',
      'location altitude hae',
      'location altitude',
      'location_altitude',
      'loc altitude',
      'loc alt',
      'loc hae alt',
      'loc alt hae',
    ]),
  };
}

function toKey(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function uniqSortedValues(records, colName, limit = 5000) {
  const s = new Set();
  for (const r of records) {
    const k = toKey(r?.[colName]);
    if (!k) continue;
    s.add(k);
    if (s.size >= limit) break;
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

function getActiveFilters(exceptKeys = []) {
  const except = new Set(Array.isArray(exceptKeys) ? exceptKeys : [exceptKeys]);
  return Object.entries(state.filters).filter(([k, set]) => !except.has(k) && set && set.size > 0);
}

function filterRecordsWithActive(records, activeEntries) {
  if (!activeEntries.length) return records;
  return records.filter((r) => {
    for (const [logicalKey, selected] of activeEntries) {
      const col = state.dimCols[logicalKey];
      if (!col) continue;
      const value = toKey(r?.[col]);
      if (!selected.has(value)) return false;
    }
    return true;
  });
}

function filterRecordsWithActiveByDim(records, activeEntries, dimCols) {
  if (!activeEntries.length) return records;
  return records.filter((r) => {
    for (const [logicalKey, selected] of activeEntries) {
      const col = dimCols?.[logicalKey];
      if (!col) continue;
                const value = toKey(r?.[col]);
      if (!selected.has(value)) return false;
    }
    return true;
  });
}

function buildingScopedRecords(records) {
  const buildingCol = state.dimCols.building;
  if (!buildingCol) return records;

  const selectedBuildings = state.filters.building;
  if (!selectedBuildings || selectedBuildings.size === 0) return records;

  return records.filter((r) => selectedBuildings.has(toKey(r?.[buildingCol])));
}

function buildingScopedRecordsByDim(records, dimCols) {
  const buildingCol = dimCols?.building;
  if (!buildingCol) return records;

  const selectedBuildings = state.filters.building;
  if (!selectedBuildings || selectedBuildings.size === 0) return records;

  return records.filter((r) => selectedBuildings.has(toKey(r?.[buildingCol])));
}

function measureTextPx(text, font) {
  const canvas = measureTextPx._canvas ?? (measureTextPx._canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  return ctx.measureText(text).width;
}

function autosizeSelectToWidestOption(selectEl) {
  if (!selectEl) return;
  const style = window.getComputedStyle(selectEl);
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

  let max = 0;
  for (const opt of selectEl.options) {
    max = Math.max(max, measureTextPx(opt.textContent ?? '', font));
  }

  const extra = 56;
  selectEl.style.width = Math.ceil(max + extra) + 'px';
}

function enableControls(enabled) {
  if (els.clearFilters) els.clearFilters.disabled = !enabled;

  const hasBuilding = Boolean(state.dimCols.building) || Boolean(callState.dimCols?.building);
  const buildingEnabled = enabled && hasBuilding;

  if (els.buildingSelect) els.buildingSelect.disabled = !buildingEnabled;
  if (els.selectAllBuildings) els.selectAllBuildings.disabled = !buildingEnabled;
  if (els.clearBuildings) els.clearBuildings.disabled = !buildingEnabled;
  if (els.buildingText) els.buildingText.disabled = !buildingEnabled;
  if (els.applyBuildingText) els.applyBuildingText.disabled = !buildingEnabled;
  if (els.clearBuildingText) els.clearBuildingText.disabled = !buildingEnabled;
}


// ...removed call to updateSectionsVisibility(); no longer needed in minimal PWA...

function syncBuildingSelectFromState() {
  if (!els.buildingSelect) return;
  const selected = state.filters.building;
  for (const opt of els.buildingSelect.options) {
    opt.selected = selected.has(opt.value);
  }
}

function populateBuildingSelectOptions() {
  if (!els.buildingSelect) return;
  els.buildingSelect.innerHTML = '';

  if (!state.knownBuildings || state.knownBuildings.length === 0) return;

  for (const v of state.knownBuildings) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (state.filters.building.has(v)) opt.selected = true;
    els.buildingSelect.appendChild(opt);
  }
}

function recomputeKnownBuildings() {
  const valsA = (state.records.length && state.dimCols.building)
    ? uniqSortedValues(state.records, state.dimCols.building, 20000)
    : [];

  const valsC = (callState.records.length && callState.dimCols?.building)
    ? uniqSortedValues(callState.records, callState.dimCols.building, 20000)
    : [];

  const s = new Set();
  for (const v of valsA) s.add(v);
  for (const v of valsC) s.add(v);

  state.knownBuildings = Array.from(s).sort((a, b) => String(a).localeCompare(String(b)));
  state.knownBuildingsLowerMap = new Map();
  for (const v of state.knownBuildings) state.knownBuildingsLowerMap.set(String(v).toLowerCase(), v);
}

function parseCommaList(text) {
  if (!text) return [];
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function applyBuildingTextFilter() {
  const hasBuilding = Boolean(state.dimCols.building) || Boolean(callState.dimCols?.building);
  if (!hasBuilding) return;
  if (!els.buildingText) return;

  const raw = els.buildingText.value;
  const parts = parseCommaList(raw);

  const selected = new Set();
  const unknown = [];

  for (const p of parts) {
    const keyLower = p.toLowerCase();
    const mapped = state.knownBuildingsLowerMap.get(keyLower);
    if (mapped) {
      selected.add(mapped);
    } else {
      selected.add(p);
      unknown.push(p);
    }
  }

  state.filters.building.clear();
  for (const v of selected) state.filters.building.add(v);
  syncBuildingSelectFromState();

  if (unknown.length) logDebug(`Building override included unknown value(s): ${unknown.join(', ')}`);

  applyFilters();
  buildFiltersUI();
  render();
  // updateSectionsVisibility(); (removed for minimal PWA)
  setStatus(state.filters.building.size ? 'Building selection applied.' : 'Select building(s) above to begin.');
}

function clearBuildingTextFilter() {
  if (els.buildingText) els.buildingText.value = '';
  state.filters.building.clear();
  syncBuildingSelectFromState();
  applyFilters();
  buildFiltersUI();
  render();
  updateSectionsVisibility();
  setStatus('Building selection cleared. Select building(s) above to begin.');
}

function getRowHeaderCols() {
  const buildingCol = state.dimCols.building;
  const participantCol = state.dimCols.participant;
  const osCol = state.dimCols.os;
  const sectionCol = state.dimCols.row_type;
  const idCol = state.dimCols.id;

  const cols = [];
  if (buildingCol) cols.push({ key: buildingCol, label: 'Building' });
  if (participantCol) cols.push({ key: participantCol, label: 'Participant' });
  if (osCol) cols.push({ key: osCol, label: 'OS' });
  if (sectionCol) cols.push({ key: sectionCol, label: 'Section' });
  if (idCol) cols.push({ key: idCol, label: 'Identifier' });

  if (!cols.length && participantCol) cols.push({ key: participantCol, label: 'Participant' });
  return cols;
}

function pruneIdBySectionToSelectedSections() {
  const selectedSections = state.filters.row_type;
  if (!selectedSections || selectedSections.size === 0) {
    state.idBySection.clear();
    return;
  }
  for (const sec of Array.from(state.idBySection.keys())) {
    if (!selectedSections.has(sec)) state.idBySection.delete(sec);
  }
}

function applyFilters() {
  const buildingCol = state.dimCols.building;
  const requireBuildingSelection = Boolean(state.dimCols.building) || Boolean(callState.dimCols.building);
  const selectedBuildings = state.filters.building;

  if (requireBuildingSelection && (!selectedBuildings || selectedBuildings.size === 0)) {
    state.filteredRecords = [];
    callState.filteredRecords = [];
    renderCallSummary();
    renderCallTable();
    setCallsExportEnabled(false);
    setCallsKmlExportEnabled(false);
    updateCallLocationSourceButton();
    updateCallViewToggleButton();
    return;
  }

  const active = getActiveFilters([]);
  let out = active.length ? filterRecordsWithActive(state.records, active) : state.records;

  // Section-specific ID filters: only apply when Section filter is explicitly set.
  const sectionCol = state.dimCols.row_type;
  const idCol = state.dimCols.id;
  const participantCol = state.dimCols.participant;
  const selectedSections = state.filters.row_type;

  if (sectionCol && idCol && selectedSections && selectedSections.size > 0 && state.idBySection.size > 0) {
    out = out.filter((r) => {
      const sec = toKey(r?.[sectionCol]);
      // Section filter already applied above, but keep this safe.
      if (!selectedSections.has(sec)) return false;

      const set = state.idBySection.get(sec);
      if (!set || set.size === 0) return true;

      // If the set contains participant+identifier keys, filter on the pair.
      // Otherwise, fall back to identifier-only behavior.
      const sample = set.values().next().value;
      const usesPairKeys = Boolean(participantCol) && typeof sample === 'string' && sample.includes(PARTICIPANT_ID_SEP);

      if (usesPairKeys) {
        const pairKey = makeParticipantIdKey(r?.[participantCol], r?.[idCol]);
        return set.has(pairKey);
      }

      const idVal = toKey(r?.[idCol]);
      return set.has(idVal);
    });
  }

  state.filteredRecords = out;

  // Apply the same filter sets to call data (only for columns present in callState.dimCols).
  if (callState.records.length) {
    const scopedCalls = buildingScopedRecordsByDim(callState.records, callState.dimCols);
    const callOut = active.length ? filterRecordsWithActiveByDim(scopedCalls, active, callState.dimCols) : scopedCalls;
    callState.filteredRecords = callOut;
  } else {
    callState.filteredRecords = [];
  }

  renderCallSummary();
  renderCallTable();
  setCallsExportEnabled(callState.filteredRecords.length > 0);
  updateCallLocationSourceButton();
  setCallsKmlExportEnabled(canExportCallsKml());
  updateCallViewToggleButton();
}

function resetAfterBuildingClear() {
  // Clear everything so the user can start fresh with a new Building selection.
  for (const k of Object.keys(state.filters)) state.filters[k].clear();
  state.idBySection.clear();
  if (els.buildingText) els.buildingText.value = '';

  // Hide call preview (visual reset) but keep preference storage as-is.
  callUi.showPreview = false;
  updateCallViewToggleButton();

  applyFilters();
  buildFiltersUI();
  render();
  updateSectionsVisibility();

  setStatus('Building selection cleared. Select building(s) above to begin.');
}

function clearAllFilters() {
  // Keep Building selection intact; it's the primary scope.
  for (const k of Object.keys(state.filters)) {
    if (k === 'building') continue;
    state.filters[k].clear();
  }
  state.idBySection.clear();

  applyFilters();
  buildFiltersUI();
  render();
}

function selectionSummary(selectedCount, totalCount) {
  if (!selectedCount) return 'All';
  if (!totalCount) return `${selectedCount}`;
  return `${selectedCount}/${totalCount}`;
}

function normalizePickerValues(values) {
  const out = [];
  for (const v of values ?? []) {
    if (v && typeof v === 'object' && 'value' in v) {
      const value = String(v.value ?? '');
      const label = String(v.label ?? v.value ?? '');
      out.push({ value, label, search: (label + ' ' + value).toLowerCase() });
    } else {
      const value = String(v ?? '');
      out.push({ value, label: value, search: value.toLowerCase() });
    }
  }
  return out;
}

function openMultiSelectPicker({ title, values, selectedSet, onApply }) {
  const existing = document.querySelector('.picker-overlay');
  if (existing) existing.remove();

  const items = normalizePickerValues(values);
  const totalCount = items.length;
  const workingSelected = new Set(Array.from(selectedSet ?? []).map((v) => String(v)));

  const overlay = document.createElement('div');
  overlay.className = 'picker-overlay';
  overlay.tabIndex = -1;

  const panel = document.createElement('div');
  panel.className = 'picker';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');

  const head = document.createElement('div');
  head.className = 'picker-head';

  const titleEl = document.createElement('div');
  titleEl.className = 'picker-title';
  titleEl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-small';
  closeBtn.textContent = 'Close';

  head.appendChild(titleEl);
  head.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'picker-body';

  const hint = document.createElement('div');
  hint.className = 'muted';
  hint.style.fontSize = '12px';
  hint.textContent = 'Empty selection = All';

  const count = document.createElement('div');
  count.className = 'picker-count muted';
  count.style.fontSize = '12px';

  const actionRow = document.createElement('div');
  actionRow.className = 'picker-toolbar';

  const selectAllBtn = document.createElement('button');
  selectAllBtn.type = 'button';
  selectAllBtn.className = 'btn btn-small';
  selectAllBtn.textContent = 'Select all';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-small';
  clearBtn.textContent = 'Clear';

  actionRow.appendChild(selectAllBtn);
  actionRow.appendChild(clearBtn);

  const sel = document.createElement('select');
  sel.className = 'picker-select';
  sel.multiple = true;
  sel.size = 14;

  const footer = document.createElement('div');
  footer.className = 'picker-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn';
  cancelBtn.textContent = 'Cancel';

  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'btn active';
  applyBtn.textContent = 'Apply';

  footer.appendChild(cancelBtn);
  footer.appendChild(applyBtn);

  body.appendChild(hint);
  body.appendChild(count);
  body.appendChild(actionRow);
  body.appendChild(sel);

  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(footer);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
  };

  const updateCount = () => {
    count.textContent = `Selected: ${selectionSummary(workingSelected.size, totalCount)}`;
  };

  const renderOptions = () => {
    sel.innerHTML = '';
    for (const it of items) {
      const opt = document.createElement('option');
      opt.value = it.value;
      opt.textContent = it.label;
      opt.selected = workingSelected.has(it.value);
      sel.appendChild(opt);
    }
  };

  const syncWorkingFromSelect = () => {
    for (const opt of sel.options) {
      if (opt.selected) workingSelected.add(opt.value);
      else workingSelected.delete(opt.value);
    }
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });

  closeBtn.addEventListener('click', () => close());
  cancelBtn.addEventListener('click', () => close());

  sel.addEventListener('change', () => {
    syncWorkingFromSelect();
    updateCount();
  });

  selectAllBtn.addEventListener('click', () => {
    for (const it of items) workingSelected.add(it.value);
    renderOptions();
    updateCount();
  });

  clearBtn.addEventListener('click', () => {
    workingSelected.clear();
    renderOptions();
    updateCount();
  });

  applyBtn.addEventListener('click', () => {
    const next = new Set(workingSelected);
    close();
    onApply(next);
  });

  renderOptions();
  updateCount();

  // Focus
  setTimeout(() => {
    sel.focus();
  }, 0);
}

function buildFiltersUI() {
  if (!els.filtersContainer) return;
  els.filtersContainer.innerHTML = '';

  const hasAnyData = state.records.length > 0 || callState.records.length > 0;
  if (!hasAnyData) {
    if (els.filtersHint) {
      els.filtersHint.style.display = '';
      els.filtersHint.textContent = 'Load a file to enable filters.';
    }
    return;
  }

  const buildingCol = state.dimCols.building;
  const requireBuildingSelection = Boolean(buildingCol);
  const hasSelectedBuildings = state.filters.building && state.filters.building.size > 0;

  if (requireBuildingSelection && !hasSelectedBuildings) {
    if (els.filtersHint) {
      els.filtersHint.textContent = 'Select one or more Building values above to show results and enable filters.';
    }
    return;
  }

  const buildingScopedArchive = buildingScopedRecords(state.records);
  const buildingScopedCalls = buildingScopedRecordsByDim(callState.records, callState.dimCols);

  const unionValues = (a, b) => {
    const s = new Set();
    for (const v of a ?? []) s.add(v);
    for (const v of b ?? []) s.add(v);
    return Array.from(s).sort((x, y) => String(x).localeCompare(String(y)));
  };

  const renderStandardFilter = ({ logicalKey, label }) => {
    const archiveCol = state.dimCols[logicalKey];
    const callCol = callState.dimCols?.[logicalKey];
    if (!archiveCol && !callCol) return false;

    const archiveValues = archiveCol ? uniqSortedValues(buildingScopedArchive, archiveCol) : [];
    const callValues = callCol ? uniqSortedValues(buildingScopedCalls, callCol) : [];
    let values = unionValues(archiveValues, callValues);
    if (!values.length) return false;

    if (logicalKey === 'row_type') {
      values = sortByPreferredOrder(values, SECTION_ORDER);
    }

    // Prune selections no longer available under the current scope.
    if (state.filters[logicalKey] && state.filters[logicalKey].size) {
      const allowed = new Set(values);
      for (const v of Array.from(state.filters[logicalKey])) {
        if (!allowed.has(v)) state.filters[logicalKey].delete(v);
      }
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';

    const name = document.createElement('span');
    name.className = 'filter-name';
    name.textContent = `${label}`;

    const badge = document.createElement('span');
    badge.className = 'filter-badge';
    badge.textContent = selectionSummary(state.filters[logicalKey]?.size ?? 0, values.length);

    btn.appendChild(name);
    btn.appendChild(badge);

    btn.addEventListener('click', () => {
      openMultiSelectPicker({
        title: `${label}`,
        values,
        selectedSet: state.filters[logicalKey],
        onApply: (nextSet) => {
          const set = state.filters[logicalKey];
          set.clear();
          for (const v of nextSet) set.add(v);

          if (logicalKey === 'row_type') {
            pruneIdBySectionToSelectedSections();
          }

          applyFilters();
          buildFiltersUI();
          render();
        },
      });
    });

    els.filtersContainer.appendChild(btn);
    return true;
  };

  let addedAny = false;

  // Render Participant + Section first.
  if (renderStandardFilter({ logicalKey: 'participant', label: 'Participant' })) addedAny = true;
  if (renderStandardFilter({ logicalKey: 'row_type', label: 'Section' })) addedAny = true;

  // Render section-specific ID filters.
  const sectionCol = state.dimCols.row_type;
  const idCol = state.dimCols.id;
  const participantCol = state.dimCols.participant;
  const selectedSections = state.filters.row_type;

  if (sectionCol && idCol) {
    if (!selectedSections || selectedSections.size === 0) {
      // Clear any prior section-id filters to avoid confusing invisible state.
      state.idBySection.clear();
    } else {
      pruneIdBySectionToSelectedSections();

      const otherActive = getActiveFilters(['building', 'row_type']);
      const sections = sortByPreferredOrder(Array.from(selectedSections), SECTION_ORDER);


      for (const sec of sections) {
        const sectionOnly = buildingScopedArchive.filter((r) => toKey(r?.[sectionCol]) === sec);
        const scoped = otherActive.length ? filterRecordsWithActive(sectionOnly, otherActive) : sectionOnly;
        let values;
        let allowedKeys;

        // --- BEGIN MODIFIED BLOCK: Add Stage as identifier filter dimension ---
        const stageCol = state.dimCols.stage;
        if (stageCol) {
          const keyToLabel = new Map();
          for (const r of scoped) {
            const idVal = toKey(r?.[idCol]);
            if (!idVal) continue;
            const stageVal = toKey(r?.[stageCol]);
            const pVal = toKey(r?.[participantCol]);
            let label = idVal;
            if (stageVal && pVal) {
              label = `${stageVal} — ${pVal} — ${idVal}`;
            } else if (stageVal) {
              label = `${stageVal} — ${idVal}`;
            } else if (pVal) {
              label = `${pVal} — ${idVal}`;
            }
            // Compose a unique key including stage, participant, and id
            const key = `${stageVal}\u0001${pVal}\u0001${idVal}`;
            if (!keyToLabel.has(key)) keyToLabel.set(key, label);
          }
          const entries = Array.from(keyToLabel.entries()).sort((a, b) => a[1].localeCompare(b[1]));
          values = entries.map(([value, label]) => ({ value, label }));
          allowedKeys = new Set(entries.map(([value]) => value));
        } else if (participantCol) {
          const keyToLabel = new Map();
          for (const r of scoped) {
            const idVal = toKey(r?.[idCol]);
            if (!idVal) continue;
            const pVal = toKey(r?.[participantCol]);
            const key = makeParticipantIdKey(pVal, idVal);
            const label = pVal ? `${pVal} — ${idVal}` : idVal;
            if (!keyToLabel.has(key)) keyToLabel.set(key, label);
          }
          const entries = Array.from(keyToLabel.entries()).sort((a, b) => a[1].localeCompare(b[1]));
          values = entries.map(([value, label]) => ({ value, label }));
          allowedKeys = new Set(entries.map(([value]) => value));
        } else {
          const ids = uniqSortedValues(scoped, idCol);
          if (!ids.length) continue;
          values = ids;
          allowedKeys = new Set(ids);
        }
        // --- END MODIFIED BLOCK ---

        if (!values || (Array.isArray(values) && values.length === 0)) continue;

        addedAny = true;

        const set = state.idBySection.get(sec) ?? new Set();
        state.idBySection.set(sec, set);

        // Prune selections no longer available.
        if (set.size) {
          for (const v of Array.from(set)) {
            if (!allowedKeys.has(v)) set.delete(v);
          }
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-btn';

        const name = document.createElement('span');
        name.className = 'filter-name';
        name.textContent = `Identifier — ${sec}`;

        const badge = document.createElement('span');
        badge.className = 'filter-badge';
        badge.textContent = selectionSummary(set.size, values.length);

        btn.appendChild(name);
        btn.appendChild(badge);

        btn.addEventListener('click', () => {
          openMultiSelectPicker({
            title: `Identifier — ${sec}`,
            values,
            selectedSet: set,
            onApply: (nextSet) => {
              set.clear();
              for (const v of nextSet) set.add(v);
              applyFilters();
              buildFiltersUI();
              render();
            },
          });
        });

        els.filtersContainer.appendChild(btn);
      }
    }
  }

  // Render remaining filters.
  if (renderStandardFilter({ logicalKey: 'stage', label: 'Stage' })) addedAny = true;
  if (renderStandardFilter({ logicalKey: 'path_id', label: 'Path ID' })) addedAny = true;
  if (renderStandardFilter({ logicalKey: 'point_id', label: 'Point ID' })) addedAny = true;
  if (renderStandardFilter({ logicalKey: 'os', label: 'OS' })) addedAny = true;

  if (els.filtersHint) {
    if (addedAny) {
      els.filtersHint.textContent = '';
      els.filtersHint.style.display = 'none';
    } else {
      els.filtersHint.style.display = '';
      els.filtersHint.textContent = 'No filterable columns detected. Update column detection heuristics in app.js.';
    }
  }
}

function render() {
  if (!state.records.length) {
    if (els.gridContainer) els.gridContainer.innerHTML = '<div class="placeholder">Waiting for dataset…</div>';
    if (els.gridSummary) els.gridSummary.textContent = 'No data loaded.';
    state.lastPivot = null;
    state.lastRowHeaderCols = null;
    setExportEnabled(false);
    setCallsExportEnabled(callState.filteredRecords.length > 0);
    return;
  }

  applyFilters();

  if (state.dimCols.building && state.filters.building.size === 0) {
    if (els.gridContainer) els.gridContainer.innerHTML = '<div class="placeholder">Select one or more buildings to begin.</div>';
    if (els.gridSummary) els.gridSummary.textContent = 'No buildings selected.';
    state.lastPivot = null;
    state.lastRowHeaderCols = null;
    setExportEnabled(false);
    return;
  }

  if (!state.filteredRecords.length) {
    if (els.gridContainer) els.gridContainer.innerHTML = '<div class="placeholder">No rows match the selected filters.</div>';
    if (els.gridSummary) els.gridSummary.textContent = 'No matching rows.';
    state.lastPivot = null;
    state.lastRowHeaderCols = null;
    setExportEnabled(false);
    return;
  }

  const rowHeaderCols = getRowHeaderCols();
  const rowKeys = rowHeaderCols.map((c) => c.key);
  const colKey = state.dimCols.stage;

  if (!rowKeys.length) {
    setStatus('Could not detect row header columns. Update heuristics in app.js (guessDimensionColumns).', { error: true });
    return;
  }
  if (!colKey) {
    setStatus('Could not detect a Stage column. Update heuristics in app.js (guessDimensionColumns).', { error: true });
    return;
  }

  const { metricKeys, metricLabels } = getMetricConfig();
  if (!metricKeys.length) {
    setStatus('Could not detect metric columns (Horizontal/Vertical 80%).', { error: true });
    return;
  }

  const pivot = buildPivot({
    records: state.filteredRecords,
    rowKey: rowKeys,
    colKey,
    valueKey: metricKeys,
  });

  // Ensure results rows follow the same preferred Section ordering used in the filters UI.
  // (Within each other left-column grouping, e.g., Building/Participant/OS.)
  if (state.dimCols.row_type) {
    sortPivotRowsByRowKeys(pivot, {
      preferredOrderByKey: {
        [state.dimCols.row_type]: SECTION_ORDER,
      },
    });
  }

  state.lastPivot = pivot;
  state.lastRowHeaderCols = rowHeaderCols;
  setExportEnabled(true);

  if (els.gridSummary) {
    const metricText = metricKeys.map((m) => metricLabels?.[m] ?? m).join(', ');
    els.gridSummary.textContent = `Rows: ${pivot.rows.length} • Columns: ${pivot.cols.length} • Metrics: ${metricText} • Filtered: ${state.filteredRecords.length.toLocaleString()}/${state.records.length.toLocaleString()}`;
  }

  renderPivotGrid({
    container: els.gridContainer,
    pivot,
    rowHeaderKeys: rowHeaderCols,
    metricKeys,
    metricLabels,
    valueFormatter: (v) => {
      if (v === null || v === undefined || v === '') return '';
      const num = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(num) && String(v).trim() !== '') return num.toFixed(2);
      return String(v);
    },
  });
}

async function onFileSelected(file) {
  enableControls(false);
  setStatus('Reading file…');
  logDebug(`[onFileSelected] File selected: ${file?.name ?? '(unknown)'} (${file?.size ?? 0} bytes, type=${file?.type ?? 'unknown'})`);

  try {
    logDebug('[onFileSelected] Reading file as ArrayBuffer…');
    const buf = await file.arrayBuffer();
    logDebug(`[onFileSelected] ArrayBuffer read: ${buf.byteLength} bytes`);
    const bytes = new Uint8Array(buf);

    setStatus('Loading Pyodide + pandas (first load can take a bit)…');
    logDebug('[onFileSelected] Ensuring Pyodide is available…');
    console.log('REACHED 9: BEFORE_ensurePyodideAvailable_call (block ~2500)');
    console.log('REACHED 10: BEFORE_ensurePyodideAvailable_call (block ~2650)');
    await ensurePyodideAvailable();
    logDebug('[onFileSelected] Starting Pyodide unpickle…');

    const { columns, records } = await unpickleDataFrameToRecords(bytes);
    logDebug(`[onFileSelected] Unpickle succeeded. ${records.length} records, ${columns.length} columns.`);

    state.columns = columns;
    state.dimCols = guessDimensionColumns(columns);
    state.metricCols = guessMetricColumns(columns);
    state.records = records;

    state.lastFileInfo = {
      name: file?.name ?? '',
      size: file?.size ?? 0,
      lastModified: file?.lastModified ?? 0,
      type: file?.type ?? '',
    };

    // Cache known building values for case-insensitive mapping (manual input).
    // Source from whichever dataset(s) are loaded (archive and/or call).
    recomputeKnownBuildings();
    logDebug(`[onFileSelected] Detected building columns: archive=${state.dimCols.building ?? '(none)'}, call=${callState.dimCols.building ?? '(none)'}; buildings=${state.knownBuildings.length}`);

    // Reset filters on new load.
    for (const k of Object.keys(state.filters)) state.filters[k].clear();
    state.idBySection.clear();
    if (els.buildingText) els.buildingText.value = '';

    updateSectionsVisibility();

    populateBuildingSelectOptions();
    syncBuildingSelectFromState();

    applyFilters();
    buildFiltersUI();

    if (els.clearFilters) {
      els.clearFilters.onclick = clearAllFilters;
    }

    if (els.columnsPreview) {
      els.columnsPreview.textContent = JSON.stringify({
        detectedDimensions: state.dimCols,
        columns: state.columns,
      }, null, 2);
    }

    enableControls(true);
    if (els.zoomSelect) els.zoomSelect.disabled = false;
    setExportEnabled(false);
    setStatus(`Loaded ${records.length.toLocaleString()} rows. Select building(s) above to begin.`);
    logDebug(`[onFileSelected] Loaded ${records.length} rows, ${columns.length} columns.`);

    render();

    updateSectionsVisibility();
  } catch (err) {
    console.error(err);
    setStatus(`Load failed: ${err?.message ?? String(err)}`, { error: true });
    logDebug(`[onFileSelected] Load failed: ${err?.stack ?? (err?.message ?? String(err))}`);
    if (els.gridContainer) els.gridContainer.innerHTML = '<div class="placeholder">Failed to load dataset.</div>';
    if (els.gridSummary) els.gridSummary.textContent = 'Load failed.';
  }
}

function renderCallTable({ maxRows = 200 } = {}) {
  if (!els.callTableContainer) return;

  const needsBuilding = Boolean(state.dimCols.building) || Boolean(callState.dimCols.building);
  const hasSelectedBuilding = Boolean(state.filters.building && state.filters.building.size > 0);
  if (needsBuilding && !hasSelectedBuilding) {
    els.callTableContainer.innerHTML = '<div class="placeholder">Select one or more buildings to view call data.</div>';
    return;
  }

  const rows = callState.filteredRecords?.length ? callState.filteredRecords : callState.records;
  if (!rows || rows.length === 0) {
    els.callTableContainer.innerHTML = '<div class="placeholder">No call rows to display.</div>';
    return;
  }

  if (!callUi.showPreview) {
    els.callTableContainer.innerHTML = `
      <div class="placeholder">
        Call preview is hidden. Click “View Call Data” to show a preview (first ${maxRows.toLocaleString()} rows).
      </div>
    `;
    return;
  }

  const cols = callState.columns ?? [];
  const slice = rows.slice(0, Math.max(0, maxRows));

  const escapeHtml = (s) => String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const ths = cols.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
  const trs = slice.map((r) => {
    const tds = cols.map((c) => `<td>${escapeHtml(r?.[c] ?? '')}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  els.callTableContainer.innerHTML = `
    <div class="grid-scroll">
      <table class="simple-table">
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    </div>
    <div class="muted" style="margin-top:6px;">
      Showing ${slice.length.toLocaleString()} of ${rows.length.toLocaleString()} call rows.
    </div>
  `;
}

function renderCallSummary() {
  if (!els.callSummary) return;
  if (!callState.records.length) {
    els.callSummary.textContent = 'No call data loaded.';
    return;
  }

  const needsBuilding = Boolean(state.dimCols.building) || Boolean(callState.dimCols.building);
  const hasSelectedBuilding = Boolean(state.filters.building && state.filters.building.size > 0);
  if (needsBuilding && !hasSelectedBuilding) {
    els.callSummary.textContent = 'Call data loaded. Select building(s) to view.';
    return;
  }

  const parts = [];
  if (callState.lastFileInfo?.name) parts.push(callState.lastFileInfo.name);
  parts.push(`Rows: ${callState.filteredRecords.length.toLocaleString()}/${callState.records.length.toLocaleString()}`);

  els.callSummary.textContent = parts.join(' • ');
}

async function loadCallDatasetFromBytes({ bytes, fileInfo, saveToIdb = false, idbFile = null }) {
  enableControls(false);
  setStatus('Loading call data…');

  try {
    setStatus('Loading Pyodide + pandas (first load can take a bit)…');
    await ensurePyodideAvailable();
    logDebug('Starting Pyodide unpickle (call data)…');

    const { columns, records } = await unpickleDataFrameToRecords(bytes);
    logDebug('Unpickle succeeded for call data.');

    callState.columns = columns;
    callState.dimCols = guessCallDimensionColumns(columns);
    callState.records = records;
    callState.filteredRecords = records;
    callState.lastFileInfo = fileInfo;

    // Ensure Building picker can populate from call data even if archive isn't loaded.
    recomputeKnownBuildings();
    populateBuildingSelectOptions();
    syncBuildingSelectFromState();

    // Apply current filters (and Building selection requirement) immediately.
    applyFilters();
    buildFiltersUI();
    updateSectionsVisibility();

    if (saveToIdb) {
      try {
        await idbSetPkl(IDB_KEY_CALL_PKL, { file: idbFile, bytes });
        logDebug('Saved call dataset to IndexedDB for next launch.');
      } catch (e) {
        logDebug(`Could not save call dataset for next launch: ${e?.message ?? String(e)}`);
      }
    }

    setStatus(`Loaded call data: ${records.length.toLocaleString()} rows.`);
  } catch (err) {
    console.error(err);
    logDebug(`Call data load failed: ${err?.stack ?? (err?.message ?? String(err))}`);
    setStatus(`Call data load failed: ${err?.message ?? String(err)}`, { error: true });
    if (els.callTableContainer) els.callTableContainer.innerHTML = '<div class="placeholder">Failed to load call data.</div>';
    if (els.callSummary) els.callSummary.textContent = 'Call data load failed.';
  } finally {
    enableControls(true);
    if (els.zoomSelect) els.zoomSelect.disabled = false;
    setCallsExportEnabled(callState.filteredRecords.length > 0);
    setCallsKmlExportEnabled(canExportCallsKml());
    updateCallLocationSourceButton();
    updateCallViewToggleButton();
    updateSectionsVisibility();
  }
}

async function onCallFileSelected(file) {
  if (!file) return;
  setStatus('Reading call data file…');
  logDebug(`Call file selected: ${file?.name ?? '(unknown)'} (${file?.size ?? 0} bytes)`);

  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const fileInfo = {
    name: file?.name ?? '',
    size: file?.size ?? 0,
    lastModified: file?.lastModified ?? 0,
    type: file?.type ?? '',
  };

  await loadCallDatasetFromBytes({ bytes, fileInfo, saveToIdb: false, idbFile: null });
}


// --- Ensure all export event listeners are set after all functions are defined ---
if (els.exportExcel) {
  els.exportExcel.addEventListener('click', () => exportCurrentPivotToExcel());
}
if (els.exportCallsExcel) {
  els.exportCallsExcel.addEventListener('click', () => exportCallsToExcel());
}
if (els.exportCallsKml) {
  els.exportCallsKml.addEventListener('click', () => exportCallsToKml());
}

if (els.callViewToggleBtn) {
  // Default to hidden preview; allow user to toggle and remember preference.
  try {
    const saved = localStorage.getItem('resultsArchive.callPreview');
    if (saved === '1') callUi.showPreview = true;
  } catch {
    // ignore
  }

  updateCallViewToggleButton();

  els.callViewToggleBtn.addEventListener('click', () => {
    if (!callState.records.length) return;
    callUi.showPreview = !callUi.showPreview;
    try {
      localStorage.setItem('resultsArchive.callPreview', callUi.showPreview ? '1' : '0');
    } catch {
      // ignore
    }
    updateCallViewToggleButton();
    renderCallTable();
  });
}

if (els.callLocationSourceBtn) {
  els.callLocationSourceBtn.addEventListener('click', () => {
    if (!callState.records.length) return;
    const col = callState.dimCols?.location_source;
    if (!col) return;

    // Scope options by selected Buildings + other active filters (excluding itself).
    const scoped = buildingScopedRecordsByDim(callState.records, callState.dimCols);
    const otherActive = getActiveFilters(['location_source']);
    const preFiltered = otherActive.length ? filterRecordsWithActiveByDim(scoped, otherActive, callState.dimCols) : scoped;
    const values = uniqSortedValues(preFiltered, col);

    openMultiSelectPicker({
      title: 'Location Source',
      values,
      selectedSet: state.filters.location_source,
      onApply: (nextSet) => {
        const set = state.filters.location_source;
        set.clear();
        for (const v of nextSet) set.add(v);
        applyFilters();
        buildFiltersUI();
        render();
      },
    });
  });
}

// Grid scale control
if (els.zoomSelect) {
  // Apply saved value to the select UI if present.
  try {
    const saved = localStorage.getItem('resultsArchive.gridZoom');
    if (saved) els.zoomSelect.value = String(saved);
  } catch {
    // ignore
  }

  els.zoomSelect.addEventListener('change', () => {
    const v = els.zoomSelect.value;
    setGridZoom(v);
    try {
      localStorage.setItem('resultsArchive.gridZoom', String(v));
    } catch {
      // ignore
    }
  });
}

// Manual building override events
if (els.applyBuildingText) {
  els.applyBuildingText.addEventListener('click', () => applyBuildingTextFilter());
}
if (els.clearBuildingText) {
  els.clearBuildingText.addEventListener('click', () => clearBuildingTextFilter());
}
if (els.buildingText) {
  els.buildingText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyBuildingTextFilter();
    }
  });
  els.buildingText.addEventListener('change', () => applyBuildingTextFilter());
}

// Header building selection events
if (els.buildingSelect) {
  const applyBuildingSelectFilter = () => {
    state.filters.building.clear();
    for (const opt of els.buildingSelect.selectedOptions) state.filters.building.add(opt.value);

    // Keep the text box in sync so users can copy/paste selections.
    if (els.buildingText) {
      els.buildingText.value = Array.from(state.filters.building).join(', ');
    }

    logDebug(`Building selection changed: ${state.filters.building.size}`);
    setStatus(state.filters.building.size ? 'Building selection applied.' : 'Select building(s) above to begin.');

    applyFilters();
    buildFiltersUI();
    render();
    updateSectionsVisibility();
  };

  // Multi-select UX varies by browser; `input` fires more reliably than `change` in some cases.
  els.buildingSelect.addEventListener('change', applyBuildingSelectFilter);
  els.buildingSelect.addEventListener('input', applyBuildingSelectFilter);
}
if (els.selectAllBuildings && els.buildingSelect) {
  els.selectAllBuildings.addEventListener('click', () => {
    for (const opt of els.buildingSelect.options) opt.selected = true;
    state.filters.building.clear();
    for (const opt of els.buildingSelect.options) state.filters.building.add(opt.value);
    applyFilters();
    buildFiltersUI();
    render();
    updateSectionsVisibility();
  });
}
if (els.clearBuildings && els.buildingSelect) {
  els.clearBuildings.addEventListener('click', () => {
    for (const opt of els.buildingSelect.options) opt.selected = false;
    resetAfterBuildingClear();
  });
}




// File input label update
if (els.fileInput && els.fileInputLabel) {
  els.fileInput.addEventListener('change', () => {
    if (els.fileInput.files && els.fileInput.files.length > 0) {
      els.fileInputLabel.textContent = els.fileInput.files[0].name;
    } else {
      els.fileInputLabel.textContent = 'No file chosen';
    }
  });
}

// Export button wiring
if (els.exportBtn) {
  els.exportBtn.addEventListener('click', handleExport);
}

// Main export handler
async function handleExport() {
  // Debug: log when handleExport runs
  console.log("handleExport called");
  if (!els.statusEl) return;
  els.statusEl.textContent = '';

  if (!els.fileInput || !els.fileInput.files || els.fileInput.files.length === 0) {
    els.statusEl.textContent = 'Please select an Excel workbook.';
    return;
  }
  const file = els.fileInput.files[0];

  // Read correlation sheet
  if (typeof readCorrelationSheet !== 'function') {
    els.statusEl.textContent = 'readCorrelationSheet() not available.';
    return;
  }

  const result = await readCorrelationSheet(file);
  if (!result.ok) {
    els.statusEl.textContent = 'Error: ' + result.error;
    return;
  }

  // Debug: log rows length
  const rows = result.rows;
  console.log("Rows length:", rows.length);
  if (!rows.length) {
    els.statusEl.textContent = 'No data rows found.';
    return;
  }

  // Debug: call buildFilters and log
  buildFilters(rows);

  // Determine Stage + Building ID from first row
  const stage = rows[0].stage;
  const building = rows[0].building;

  // Apply all selected filters
  const filterContainer = document.getElementById('filterContainer');
  const selects = filterContainer ? filterContainer.querySelectorAll('select') : [];

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
    els.statusEl.textContent = 'No matching rows for Stage/Building.';
    return;
  }

  // Build KML
  if (typeof buildCallKmlFromRows !== 'function') {
    els.statusEl.textContent = 'KML builder not available.';
    return;
  }
  const kml = buildCallKmlFromRows({
    rows: filtered,
    docName: `Correlation KML — ${building} (${filtered.length} points)`,
    groupByParticipant: true
  });

  if (!kml) {
    els.statusEl.textContent = 'KML generation failed.';
    return;
  }

  // Download
  if (typeof downloadTextFile !== 'function') {
    els.statusEl.textContent = 'Download function not available.';
    return;
  }
  const filename = `Correlation_${building}.kml`;
  downloadTextFile({
    filename,
    text: kml,
    mime: 'application/vnd.google-earth.kml+xml;charset=utf-8'
  });

  els.statusEl.textContent = `Exported: ${filename}`;
}

// Call-data file input events
if (els.callFileInput) {
  els.callFileInput.addEventListener('click', () => {
    els.callFileInput.value = '';
  });

  els.callFileInput.addEventListener('change', (ev) => {
    console.log('[app] callFileInput change event fired', ev);
    if (els.debugLog) els.debugLog.textContent += `\n[app] callFileInput change event fired`;
    const file = els.callFileInput.files?.[0];
    if (!file) {
      console.log('[app] no call file selected');
      return;
    }
    try {
      onCallFileSelected(file);
    } catch (err) {
      console.error('[app] error in onCallFileSelected', err);
      if (els.debugLog) els.debugLog.textContent += `\n[app] error in onCallFileSelected: ${err?.message ?? err}`;
    }
  });
}

