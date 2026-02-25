// correlationReader.js
// Processes the Correlation sheet and joins it with Ground Truth data.

export function processCorrelationData(workbook, groundTruth) {
  try {
    const sheet = workbook.Sheets["Correlation"];
    if (!sheet) {
      console.error("Correlation sheet not found!");
      return [];
    }

    // Convert to JSON, skipping the header rows if necessary
    const rows = window.XLSX.utils.sheet_to_json(sheet, { range: 2 }); 

    return rows.map(row => {
      const pointId = row["Point ID"] ? String(row["Point ID"]).trim() : null;
      const truth = groundTruth ? groundTruth[pointId] : null;

      // Preserve all columns from the parsed row
      const data = { ...row };
      // Ensure device field is set for grouping
      data.device = row["Handset Model Name"] || row["device"] || row["Device"];
      data.pointId = pointId;
      data.reportedLat = Number(row["Location Latitude"]);
      data.reportedLon = Number(row["Location Longitude"]);
      data.reportedAlt = Number(row["Location Altitude"]);
      data.uncertaintyH = Number(row["Horizontal Uncertainty"]);
      data.uncertaintyV = Number(row["Vertical Uncertainty"]);
      data.tech = row["Location Technology String"];
      data.floor = row["Floor Number"];
      data.locationSource = row["Location Source"];
      data.completedCall = row["Completed Call"];
      data.correlatedCall = row["Correlated Call"];
      data.validHorizontal = row["Valid Horizontal"];
      data.validVertical = row["Valid Vertical"];
      data.summaryPoolTech = row["Summary Pool Technology"];
      data.carrier = row["Carrier"];
      data.participant = row["Participant"];
      // Map call setup and total duration fields for Device Performance Insights
      data.callSetupDuration = row["Call Setup Duration"] || row["Setup Duration"] || row["callSetupDuration"] || row["call_setup_duration"] || null;
      data.callTotalDuration = row["Call Total Duration"] || row["Total Duration"] || row["callTotalDuration"] || row["call_total_duration"] || null;

      // If we have Ground Truth, calculate the "Insight" metrics
      if (truth) {
        data.truthLat = truth.lat;
        data.truthLon = truth.lon;
        data.truthAlt = truth.alt;

        // Calculate Errors
        data.horizontalError = calculateDistance(data.reportedLat, data.reportedLon, truth.lat, truth.lon);

        // Use pre-calculated Vertical Error column if available, otherwise calculate as absolute difference

          // Store raw vertical error value
          data.vErrorRaw = Number(row["Vertical Error"]) || (data.reportedAlt - truth.alt);

        data.isWithinUncertainty = data.horizontalError <= data.uncertaintyH;
      }

      return data;
    });
  } catch (err) {
    console.error("Error processing Correlation data:", err);
    return [];
  }
}

// Helper: Haversine Formula to calculate distance in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}