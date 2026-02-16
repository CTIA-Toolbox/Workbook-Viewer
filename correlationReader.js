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

      // Basic data from the row
      const data = {
        pointId: pointId,
        timestamp: row["Location Fix Time"],
        device: row["Handset Model Name"],
        reportedLat: Number(row["Location Latitude"]),
        reportedLon: Number(row["Location Longitude"]),
        reportedAlt: Number(row["Location Altitude"]),
        uncertaintyH: Number(row["Horizontal Uncertainty"]),
        uncertaintyV: Number(row["Vertical Uncertainty"]),
        tech: row["Location Technology String"],
        floor: row["Floor Number"],
        // Additional filter fields
        completedCall: row["Completed Call"],
        correlatedCall: row["Correlated Call"],
        participant: row["Participant"],
        carrier: row["Carrier"],
        locationSource: row["Location Source"],
        summaryPoolTech: row["Summary Pool Technology"],
        validHorizontal: row["Valid Horizontal Location"],
        validVertical: row["Valid Vertical Location"]
      };

      // If we have Ground Truth, calculate the "Insight" metrics
      if (truth) {
        data.truthLat = truth.lat;
        data.truthLon = truth.lon;
        data.truthAlt = truth.alt;
        
        // Calculate Errors
        data.horizontalError = calculateDistance(data.reportedLat, data.reportedLon, truth.lat, truth.lon);
        
        // Use pre-calculated Vertical Error column if available, otherwise calculate as absolute difference
        if (row["Vertical Error"] !== undefined && row["Vertical Error"] !== null) {
          data.verticalError = Math.abs(Number(row["Vertical Error"]));
        } else {
          data.verticalError = Math.abs(data.reportedAlt - truth.alt);
        }
        
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