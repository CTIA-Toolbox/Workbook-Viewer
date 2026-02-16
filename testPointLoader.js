// testPointLoader.js - Optimized for Static Ground Truth only
export async function loadTestPoints() {
  try {
    const resp = await fetch('./TestPoints.xlsx', { cache: 'no-store' });
    if (!resp.ok) return null;

    const arrayBuffer = await resp.arrayBuffer();
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
    const sheet = workbook.Sheets["TestPoints"] || workbook.Sheets[workbook.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(sheet);

    const lookup = {};
    rows.forEach(r => {
      const id = r["Test Point ID"] ? String(r["Test Point ID"]).trim() : null;
      if (id) {
        lookup[id] = {
          lat: Number(r["Latitude"]),
          lon: Number(r["Longitude"]),
          alt: Number(r["Altitude (Ellipsoid) Meters"]) || 0,
          floor: r["Floor"]
        };
      }
    });
    return lookup;
  } catch (err) {
    console.error("Error loading TestPoints.xlsx:", err);
    return null;
  }
}