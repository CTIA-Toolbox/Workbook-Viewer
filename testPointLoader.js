// testPointLoader.js
// Loads TestPoints.xlsx and builds a lookup table keyed by Test Point ID.

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js";

export async function loadTestPoints() {
  try {
    const resp = await fetch('./TestPoints.xlsx', { cache: 'no-store' });

    if (!resp.ok) {
      console.error("Failed to load TestPoints.xlsx:", resp.status);
      return null;
    }

    const arrayBuffer = await resp.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const lookup = {};

    for (const r of rows) {
      const id = r["Test Point ID"];
      if (!id) continue;

      lookup[id] = {
        lat: Number(r["Latitude"]),
        lon: Number(r["Longitude"]),
        alt: Number(r["Altitude (Ellipsoid) Meters"]) || 0,
        building: r["Building ID"],
        floor: r["Floor"]
      };
    }

    console.log("Loaded test point lookup:", lookup);
    return lookup;

  } catch (err) {
    console.error("Error loading TestPoints.xlsx:", err);
    return null;
  }
}