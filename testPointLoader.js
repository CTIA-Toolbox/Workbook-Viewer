// testPointLoader.js
// Updated to load Test Points, Barometric Logs, and Baro Trends from the workbook.

export async function loadBuildingData() {
  try {
    const resp = await fetch('./TestPoints.xlsx', { cache: 'no-store' });
    if (!resp.ok) return null;

    const arrayBuffer = await resp.arrayBuffer();
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });

    // 1. Load Ground Truth (Test Points)
    const tpSheet = workbook.Sheets["TestPoints"] || workbook.Sheets[workbook.SheetNames[0]];
    const tpRows = window.XLSX.utils.sheet_to_json(tpSheet);
    const testPointLookup = {};

    tpRows.forEach(r => {
      const id = r["Test Point ID"] ? String(r["Test Point ID"]).trim() : null;
      if (id) {
        testPointLookup[id] = {
          lat: Number(r["Latitude"]),
          lon: Number(r["Longitude"]),
          alt: Number(r["Altitude (Ellipsoid) Meters"]) || 0,
          floor: r["Floor"]
        };
      }
    });

    // 2. Load Baro Trend (The link between Points and Pressure)
    const trendSheet = workbook.Sheets["Baro Trend"];
    const baroTrends = trendSheet ? window.XLSX.utils.sheet_to_json(trendSheet) : [];

    // 3. Load Barometric (The raw reference pressure log)
    const baroLogSheet = workbook.Sheets["Barometric"];
    const baroLogs = baroLogSheet ? window.XLSX.utils.sheet_to_json(baroLogSheet) : [];

    console.log(`Loaded ${Object.keys(testPointLookup).length} Test Points.`);
    console.log(`Loaded ${baroTrends.length} Baro Trend entries.`);

    return {
      testPoints: testPointLookup,
      trends: baroTrends,
      logs: baroLogs
    };

  } catch (err) {
    console.error("Error loading building data:", err);
    return null;
  }
}