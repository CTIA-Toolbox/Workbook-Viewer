// pivot.js
// A minimal pivot-table-like renderer.
//
// Defaults:
// - Rows: participant
// - Columns: chosen dimension (stage/building/participant)
// - Cells: chosen metric (e.g. h80)
//
// Extend later:
// - Add aggregations (sum/mean/min/max) for multiple records per cell.
// - Add sorting, filtering, column grouping, export.

function stringifyCell(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Keep it simple; adjust formatting later.
    return String(value);
  }
  return String(value);
}

function measureTextPx(text, font) {
  const canvas = measureTextPx._canvas ?? (measureTextPx._canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  return ctx.measureText(String(text ?? '')).width;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function applyAutoSizeColumnWidths(table, { leftColumnCount = 0, maxScanRows = 5000 } = {}) {
  const tbody = table.tBodies?.[0];
  const firstBodyRow = tbody?.rows?.[0];
  if (!firstBodyRow) return;

  const colCount = firstBodyRow.cells.length;
  if (!colCount) return;

  // Use the table's computed font to measure text accurately.
  const style = window.getComputedStyle(table);
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

  const paddingPx = 26; // cell padding + borders (approx)
  const minPx = 70;
  const maxPx = 520;

  const maxWidths = new Array(colCount).fill(0);

  // Seed widths from header labels (left headers + metric headers).
  const headRows = table.tHead ? Array.from(table.tHead.rows) : [];

  // Left headers come from header row 1.
  const headerRow1 = headRows[0];
  if (headerRow1) {
    for (let i = 0; i < leftColumnCount; i++) {
      const cell = headerRow1.cells[i];
      if (!cell) continue;
      maxWidths[i] = Math.max(maxWidths[i], measureTextPx(cell.textContent ?? '', font));
    }
  }

  // Data leaf headers come from the last header row.
  const leafHeaderRow = headRows.length ? headRows[headRows.length - 1] : null;
  if (leafHeaderRow && leafHeaderRow !== headerRow1) {
    for (let j = 0; j < leafHeaderRow.cells.length; j++) {
      const cell = leafHeaderRow.cells[j];
      const idx = leftColumnCount + j;
      if (idx >= colCount) break;
      maxWidths[idx] = Math.max(maxWidths[idx], measureTextPx(cell.textContent ?? '', font));
    }
  }

  // Also account for merged (top) headers (e.g., Stage names). Distribute width across its subcolumns.
  if (headerRow1 && leafHeaderRow && leafHeaderRow !== headerRow1) {
    let dataIdx = leftColumnCount;
    for (let i = leftColumnCount; i < headerRow1.cells.length; i++) {
      const cell = headerRow1.cells[i];
      if (!cell) continue;
      const span = cell.colSpan || 1;
      const w = measureTextPx(cell.textContent ?? '', font);
      const per = w / span;
      for (let k = 0; k < span; k++) {
        const idx = dataIdx + k;
        if (idx >= colCount) break;
        maxWidths[idx] = Math.max(maxWidths[idx], per);
      }
      dataIdx += span;
      if (dataIdx >= colCount) break;
    }
  }

  // Scan body cells (cap rows to avoid freezing on huge datasets).
  const rows = Array.from(tbody.rows);
  const scanCount = Math.min(rows.length, maxScanRows);
  for (let r = 0; r < scanCount; r++) {
    const tr = rows[r];
    for (let c = 0; c < colCount; c++) {
      const cell = tr.cells[c];
      if (!cell) continue;
      const text = cell.textContent ?? '';
      if (!text) continue;
      maxWidths[c] = Math.max(maxWidths[c], measureTextPx(text, font));
    }
  }

  // Ensure a colgroup exists.
  let colgroup = table.querySelector('colgroup');
  if (!colgroup) {
    colgroup = document.createElement('colgroup');
    table.insertBefore(colgroup, table.firstChild);
  }
  colgroup.innerHTML = '';

  for (let i = 0; i < colCount; i++) {
    const col = document.createElement('col');
    const px = clamp(maxWidths[i] + paddingPx, minPx, maxPx);
    col.style.width = `${Math.ceil(px)}px`;
    colgroup.appendChild(col);
  }
}

export function buildPivot({ records, rowKey, colKey, valueKey }) {
  const rowKeys = Array.isArray(rowKey) ? rowKey : [rowKey];

  const rowSet = new Set();
  const colSet = new Set();

  // Map: rowVal -> (colVal -> cellValue)
  const matrix = new Map();
  const rowMeta = new Map();

  const makeRowId = (rec) => {
    return rowKeys.map((k) => String(rec?.[k] ?? '')).join('||');
  };

  for (const r of records) {
    const rowId = makeRowId(r);
    const colVal = r?.[colKey];
    if (!rowId || rowId === rowKeys.map(() => '').join('||')) continue;
    if (colVal === undefined || colVal === null) continue;

    rowSet.add(rowId);
    colSet.add(String(colVal));

    const colId = String(colVal);

    if (!matrix.has(rowId)) matrix.set(rowId, new Map());

    if (!rowMeta.has(rowId)) {
      const meta = {};
      for (const k of rowKeys) meta[k] = r?.[k];
      rowMeta.set(rowId, meta);
    }

    // Minimal behavior: last-write-wins if duplicates exist.
    // Extend later: keep an array and aggregate.
    if (Array.isArray(valueKey)) {
      const obj = {};
      for (const k of valueKey) obj[k] = r?.[k];
      matrix.get(rowId).set(colId, obj);
    } else {
      matrix.get(rowId).set(colId, r?.[valueKey]);
    }
  }

  const rows = Array.from(rowSet).sort();
  const cols = Array.from(colSet).sort();

  return { rows, cols, matrix, rowMeta, rowKeys };
}

function applyStickyLeftOffsets(table, leftColumnCount) {
  if (!leftColumnCount) return;

  // Measure header cell widths for left columns.
  const headerRow = table.tHead?.rows?.[0];
  if (!headerRow) return;

  const widths = [];
  for (let i = 0; i < leftColumnCount; i++) {
    const cell = headerRow.cells[i];
    if (!cell) break;
    widths.push(cell.getBoundingClientRect().width);
  }

  const lefts = [];
  let acc = 0;
  for (const w of widths) {
    lefts.push(acc);
    acc += w;
  }

  // Apply to header + body cells.
  const allRows = [
    ...(table.tHead ? Array.from(table.tHead.rows) : []),
    ...(table.tBodies?.[0] ? Array.from(table.tBodies[0].rows) : []),
  ];

  for (const tr of allRows) {
    for (let i = 0; i < leftColumnCount; i++) {
      const cell = tr.cells[i];
      if (!cell) continue;
      cell.style.left = lefts[i] + 'px';
    }
  }
}

export function renderPivotGrid({ container, pivot, rowHeaderLabel, rowHeaderKeys = null, metricKeys = null, metricLabels = null, valueFormatter }) {
  const { rows, cols, matrix, rowMeta } = pivot;

  const leftCols = Array.isArray(rowHeaderKeys) && rowHeaderKeys.length
    ? rowHeaderKeys.map((x) => (typeof x === 'string' ? ({ key: x, label: x }) : x))
    : [{ key: rowHeaderLabel, label: rowHeaderLabel }];

  const table = document.createElement('table');
  table.className = 'table';

  const thead = document.createElement('thead');

  // Header row 1: merged dimension headers.
  const headRow1 = document.createElement('tr');
  for (let i = 0; i < leftCols.length; i++) {
    const th = document.createElement('th');
    th.className = 'sticky-col';
    th.textContent = String(leftCols[i]?.label ?? '');
    if (Array.isArray(metricKeys) && metricKeys.length) {
      th.rowSpan = 2;
    }
    headRow1.appendChild(th);
  }

  if (Array.isArray(metricKeys) && metricKeys.length) {
    for (const c of cols) {
      const th = document.createElement('th');
      th.className = 'hdr-top hdr-group';
      th.colSpan = metricKeys.length;
      th.textContent = c;
      headRow1.appendChild(th);
    }
    thead.appendChild(headRow1);

    // Header row 2: metric subheaders.
    const headRow2 = document.createElement('tr');
    for (const _c of cols) {
      for (const m of metricKeys) {
        const th = document.createElement('th');
        th.className = 'hdr-sub';
        th.textContent = String((metricLabels && metricLabels[m]) ? metricLabels[m] : m);
        headRow2.appendChild(th);
      }
    }
    thead.appendChild(headRow2);
  } else {
    for (const c of cols) {
      const th = document.createElement('th');
      th.className = 'hdr-top';
      th.textContent = c;
      headRow1.appendChild(th);
    }
    thead.appendChild(headRow1);
  }

  const tbody = document.createElement('tbody');

  for (const r of rows) {
    const tr = document.createElement('tr');

    const meta = rowMeta?.get(r) ?? {};
    for (let i = 0; i < leftCols.length; i++) {
      const key = leftCols[i]?.key;
      const td = document.createElement('td');
      td.className = 'sticky-col';
      const val = meta?.[key];
      td.textContent = val === null || val === undefined ? '' : String(val);
      if (!td.textContent) td.classList.add('cell-empty');
      tr.appendChild(td);
    }

    const rowMap = matrix.get(r);

    for (const c of cols) {
      const raw = rowMap ? rowMap.get(c) : undefined;

      if (Array.isArray(metricKeys) && metricKeys.length) {
        // Render one cell per metric (gives the appearance of subcolumns).
        for (const m of metricKeys) {
          const td = document.createElement('td');
          const v = raw && typeof raw === 'object' ? raw[m] : undefined;
          const formatted = valueFormatter ? valueFormatter(v, m, raw) : stringifyCell(v);
          const text = String(formatted ?? '');
          td.textContent = text;
          if (!text) td.classList.add('cell-empty');
          tr.appendChild(td);
        }
      } else {
        const td = document.createElement('td');
        const formatted = valueFormatter ? valueFormatter(raw) : stringifyCell(raw);
        const text = String(formatted ?? '');
        td.textContent = text;
        if (!text) td.classList.add('cell-empty');
        tr.appendChild(td);
      }
    }

    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  container.innerHTML = '';
  container.appendChild(table);

  // Apply sticky offsets after the table is in the DOM.
  requestAnimationFrame(() => {
    applyAutoSizeColumnWidths(table, { leftColumnCount: leftCols.length });
    // After widths are applied, compute sticky offsets from actual rendered widths.
    requestAnimationFrame(() => {
      applyStickyLeftOffsets(table, leftCols.length);
    });
  });
}
