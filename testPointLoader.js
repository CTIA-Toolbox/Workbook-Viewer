// testPointLoader.js
// Loads TestPoints.xlsx and builds a lookup table keyed by Test Point ID.

export async function loadTestPoints() {
  try {
    // Fetch from your repo (cache: 'no-store' ensures you get the latest version)
    const resp = await fetch('./TestPoints.xlsx', { cache: 'no-store' });

    if (!resp.ok) {
      console.error("Failed to load TestPoints.xlsx:", resp.status);
      return null;
    }

    const arrayBuffer = await resp.arrayBuffer();
    
    // Note: We use window.XLSX because it's loaded via CDN in your HTML
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(sheet);

    const lookup = {};

    for (const r of rows) {
      // Force ID to string to avoid "101" !== 101 mismatch issues
      const id = r["Test Point ID"] ? String(r["Test Point ID"]).trim() : null;
      if (!id) continue;

      lookup[id] = {
        lat: Number(r["Latitude"]),
        lon: Number(r["Longitude"]),
        alt: Number(r["Altitude (Ellipsoid) Meters"]) || 0,
        building: r["Building ID"],
        floor: r["Floor"]
      };
    }

    console.log(`Loaded ${Object.keys(lookup).length} test points from lookup.`);
    return lookup;

  } catch (err) {
    console.error("Error loading TestPoints.xlsx:", err);
    return null;
  }
}