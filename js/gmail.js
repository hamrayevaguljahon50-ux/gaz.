// Gmail Integration & Shift Reporting Engine

class GmailReportManager {
  constructor() {
    this.reportType = "shift"; // 'shift', 'stock', 'emergency'
  }

  generateReportText(type = "shift") {
    const data = window.stationData;
    const settings = data.settings;
    const totals = data.getTotals();
    const lang = window.stationApp ? window.stationApp.currentLang : "en";
    const t = translations[lang] || translations.en;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString();

    let text = "";

    if (type === "emergency") {
      text += `🚨 URGENT: LOW FUEL INVENTORY ALERT\n`;
      text += `==============================================\n`;
      text += `Station: ${settings.stationName} (${settings.stationCode})\n`;
      text += `Generated: ${dateFormatted} at ${timeFormatted}\n`;
      text += `Alert Status: CRITICAL DEPLETION WARNING\n`;
      text += `==============================================\n\n`;

      text += `CRITICAL TANKS REQUIRING IMMEDIATE DISPATCH:\n`;
      let alertFound = false;
      data.tanks.forEach(tank => {
        const pct = ((tank.currentStock / tank.capacity) * 100).toFixed(1);
        const fuelName = t[tank.fuelGrade] || tank.name;
        if (tank.currentStock <= tank.safeMinimum || pct <= (tank.warningPercentage || 20)) {
          alertFound = true;
          text += `⚠️ ${tank.name} [${fuelName}]:\n`;
          text += `   - Current Volume: ${tank.currentStock.toLocaleString()} L (${pct}% of ${tank.capacity.toLocaleString()} L)\n`;
          text += `   - Safe Minimum Limit: ${tank.safeMinimum.toLocaleString()} L\n`;
          if (tank.type === "propane") {
            text += `   - LPG Pressure: ${tank.pressure || 8.5} bar\n`;
          }
          text += `   - ACTION NEEDED: Expedite tanker truck replenishment immediately!\n\n`;
        }
      });

      if (!alertFound) {
        text += `All tank volumes are currently above safe threshold limits.\n\n`;
      }

      text += `Please reply or confirm replenishment schedule with station operator.\n`;
      text += `--\n${settings.stationName} Dispatch System`;
      return text;
    }

    if (type === "stock") {
      text += `📊 DAILY FUEL INVENTORY & TANK BALANCE REPORT\n`;
      text += `==============================================\n`;
      text += `Station: ${settings.stationName} (${settings.stationCode})\n`;
      text += `Date: ${dateFormatted} ${timeFormatted}\n`;
      text += `==============================================\n\n`;

      text += `CURRENT TANK STORAGE STATUS:\n`;
      data.tanks.forEach(tank => {
        const pct = ((tank.currentStock / tank.capacity) * 100).toFixed(1);
        const fuelName = t[tank.fuelGrade] || tank.name;
        const status = (pct <= 20) ? "⚠️ LOW" : "✅ OPTIMAL";
        text += `• ${tank.name} - ${fuelName}:\n`;
        text += `   Level: ${tank.currentStock.toLocaleString()} / ${tank.capacity.toLocaleString()} L (${pct}%) [${status}]\n`;
        text += `   Temperature: ${tank.temperature || 15}°C`;
        if (tank.type === "propane") {
          text += ` | Pressure: ${tank.pressure || 8.5} bar (Max: ${tank.maxPressure || 16} bar)`;
        }
        text += `\n\n`;
      });

      text += `SUMMARY:\n`;
      text += `• Total Gasoline on hand: ${totals.totalGasolineStock.toLocaleString()} L\n`;
      text += `• Total Propane (LPG) on hand: ${totals.totalPropaneStock.toLocaleString()} L\n`;
      text += `• Combined Fuel Volume: ${totals.totalFuelStock.toLocaleString()} L\n\n`;
      text += `Authorized Sign-off: Station Supervisor\n`;
      text += `--\nGenerated via PetroFlow Monitor`;
      return text;
    }

    // Default: Shift Summary Report
    text += `📋 SHIFT HANDOVER & FUEL BALANCE REPORT\n`;
    text += `==============================================\n`;
    text += `Facility: ${settings.stationName}\n`;
    text += `Code: ${settings.stationCode}\n`;
    text += `Date & Time: ${dateFormatted} ${timeFormatted}\n`;
    text += `==============================================\n\n`;

    text += `1. TANK INVENTORY SNAPSHOT:\n`;
    data.tanks.forEach(tank => {
      const pct = ((tank.currentStock / tank.capacity) * 100).toFixed(1);
      const fuelName = t[tank.fuelGrade] || tank.name;
      text += `   - ${tank.name} (${fuelName}): ${tank.currentStock.toLocaleString()} L / ${tank.capacity.toLocaleString()} L (${pct}%)\n`;
      if (tank.type === "propane") {
        text += `     [LPG Pressure: ${tank.pressure || 8.5} bar | Temp: ${tank.temperature || 14}°C]\n`;
      }
    });

    text += `\n2. SHIFT REPLENISHMENTS (INFLOWS):\n`;
    const recentInflows = data.inflows.slice(0, 5);
    if (recentInflows.length === 0) {
      text += `   No deliveries logged during this reporting period.\n`;
    } else {
      recentInflows.forEach(inf => {
        text += `   + [${new Date(inf.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${inf.volume.toLocaleString()} L | Supplier: ${inf.supplier} | Waybill: ${inf.invoiceNo} | Truck: ${inf.truckPlate}\n`;
      });
    }

    text += `\n3. DISPENSER SALES (OUTFLOWS):\n`;
    const recentOutflows = data.outflows.slice(0, 5);
    if (recentOutflows.length === 0) {
      text += `   No dispensing sales recorded during this reporting period.\n`;
    } else {
      recentOutflows.forEach(out => {
        text += `   - [${new Date(out.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${out.volume.toLocaleString()} L | ${out.dispenser} | Meters: ${out.meterStart || 'N/A'} -> ${out.meterEnd || 'N/A'} | Operator: ${out.operator}\n`;
      });
    }

    text += `\n4. AGGREGATE ACTIVITY SUMMARY:\n`;
    text += `   • Total Inflows Delivered: ${totals.todayDeliveries.toLocaleString()} L\n`;
    text += `   • Total Outflows Dispensed: ${totals.todaySales.toLocaleString()} L\n`;
    text += `   • Net Station Volume Change: ${(totals.todayDeliveries - totals.todaySales > 0 ? "+" : "")}${(totals.todayDeliveries - totals.todaySales).toLocaleString()} L\n`;
    text += `   • Active Stock Alerts: ${totals.activeAlerts}\n\n`;

    text += `Shift Operator: Handover Certified\n`;
    text += `PetroFlow Automated Station Monitor\n`;
    return text;
  }

  getSubject(type = "shift") {
    const settings = window.stationData.settings;
    const now = new Date().toISOString().slice(0, 10);
    if (type === "emergency") {
      return `[URGENT ALERT] Low Fuel Stock at ${settings.stationCode} - ${now}`;
    }
    if (type === "stock") {
      return `[Daily Inventory] Tank Storage Audit ${settings.stationCode} - ${now}`;
    }
    return `[Shift Report] Fuel Inflow/Outflow Balance ${settings.stationCode} - ${now}`;
  }

  openGmailWeb(type = null) {
    const activeType = type || this.reportType;
    const settings = window.stationData.settings;
    const to = encodeURIComponent(settings.managerEmail || "");
    const cc = encodeURIComponent(settings.supervisorEmail || "");
    const subject = encodeURIComponent(this.getSubject(activeType));
    const body = encodeURIComponent(this.generateReportText(activeType));

    // Gmail Web Composer URL structure
    let gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    if (settings.supervisorEmail) {
      gmailUrl += `&cc=${cc}`;
    }

    window.open(gmailUrl, "_blank");
  }

  openMailto(type = null) {
    const activeType = type || this.reportType;
    const settings = window.stationData.settings;
    const to = encodeURIComponent(settings.managerEmail || "");
    const subject = encodeURIComponent(this.getSubject(activeType));
    const body = encodeURIComponent(this.generateReportText(activeType));

    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  }

  copyReportToClipboard(type = null) {
    const activeType = type || this.reportType;
    const text = this.generateReportText(activeType);
    navigator.clipboard.writeText(text).then(() => {
      const lang = window.stationApp ? window.stationApp.currentLang : "en";
      const t = translations[lang] || translations.en;
      alert(t.copiedToClipboard || "Copied to clipboard!");
    }).catch(err => {
      console.error("Clipboard copy failed", err);
    });
  }

  updateLivePreview() {
    const previewEl = document.getElementById("gmailLivePreview");
    if (!previewEl) return;
    previewEl.value = this.generateReportText(this.reportType);
  }
}

window.GmailReportManager = GmailReportManager;

