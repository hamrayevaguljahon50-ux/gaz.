// Gmail Integration & Shift Reporting Engine

class GmailReportManager {
  constructor() {
    this.reportType = "shift";
  }

  generateReportText(type = "shift") {
    const data = window.stationData;
    const settings = data.settings;
    const totals = data.getTotals();
    const lang = window.stationApp ? window.stationApp.currentLang : "uz";
    const t = translations[lang] || translations.uz;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString();

    let text = "";

    if (type === "emergency") {
      text += `🚨 SHOSHILINCH: YOQILG'I KAM QOLDI OGOHLANTIRISHI\n`;
      text += `==============================================\n`;
      text += `Shoxobcha: ${settings.stationName} (${settings.stationCode})\n`;
      text += `Vaqt: ${dateFormatted} soat ${timeFormatted}\n`;
      text += `Holat: XAVFLI MINIMAL CHEGARA\n`;
      text += `==============================================\n\n`;

      text += `TEZKOR YETKAZIB BERISH TALAB QILINADIGAN REZERVUARLAR:\n`;
      let alertFound = false;
      data.tanks.forEach(tank => {
        const pct = ((tank.currentStock / tank.capacity) * 100).toFixed(1);
        const fuelName = t[tank.fuelGrade] || tank.name;
        if (tank.currentStock <= tank.safeMinimum || pct <= (tank.warningPercentage || 20)) {
          alertFound = true;
          text += `⚠️ ${tank.name} [${fuelName}]:\n`;
          text += `   - Joriy qoldiq: ${tank.currentStock.toLocaleString()} L (${pct}% / Sig'im: ${tank.capacity.toLocaleString()} L)\n`;
          text += `   - Xavfsiz minimum: ${tank.safeMinimum.toLocaleString()} L\n`;
          if (tank.type === "propane") {
            text += `   - Propan bosimi: ${tank.pressure || 8.5} bar\n`;
          }
          text += `   - TALAB: Tezkor avtosisterna buyurtma qilish kerak!\n\n`;
        }
      });

      if (!alertFound) {
        text += `Barcha rezervuarlardagi qoldiq xavfsiz me'yorda.\n\n`;
      }

      text += `--\n${settings.stationName} Tizimi`;
      return text;
    }

    if (type === "stock") {
      text += `📊 KUNLIK YOQILG'I ZAXIRASI VA BALANSI HISOBOTI\n`;
      text += `==============================================\n`;
      text += `Shoxobcha: ${settings.stationName} (${settings.stationCode})\n`;
      text += `Sana: ${dateFormatted} ${timeFormatted}\n`;
      text += `==============================================\n\n`;

      text += `REZERVUARLAR ZAXIRASI HOLATI:\n`;
      data.tanks.forEach(tank => {
        const pct = ((tank.currentStock / tank.capacity) * 100).toFixed(1);
        const fuelName = t[tank.fuelGrade] || tank.name;
        const status = (pct <= 20) ? "⚠️ KAM" : "✅ ME'YORDA";
        text += `• ${tank.name} - ${fuelName}:\n`;
        text += `   Qoldiq: ${tank.currentStock.toLocaleString()} / ${tank.capacity.toLocaleString()} L (${pct}%) [${status}]\n`;
        text += `   Harorat: ${tank.temperature || 15}°C`;
        if (tank.type === "propane") {
          text += ` | Bosim: ${tank.pressure || 8.5} bar`;
        }
        text += `\n\n`;
      });

      text += `UMUMIY XULOSA:\n`;
      text += `• Jami benzin qoldig'i: ${totals.totalGasolineStock.toLocaleString()} L\n`;
      text += `• Jami propan (SNG) qoldig'i: ${totals.totalPropaneStock.toLocaleString()} L\n`;
      text += `• Barcha yoqilg'ilar zaxirasi: ${totals.totalFuelStock.toLocaleString()} L\n\n`;
      text += `Mas'ul shaxs: Shoxobcha boshlig'i\n`;
      text += `--\nPetroFlow Monitor`;
      return text;
    }

    // Default: Shift Summary Report
    text += `📋 SMENA YAKUNI VA YOQILG'I HARAKATI HISOBOTI\n`;
    text += `==============================================\n`;
    text += `Shoxobcha: ${settings.stationName}\n`;
    text += `Kod: ${settings.stationCode}\n`;
    text += `Sana: ${dateFormatted} ${timeFormatted}\n`;
    text += `==============================================\n\n`;

    text += `1. REZERVUARLARDAGI JORIY QOLDIQ:\n`;
    data.tanks.forEach(tank => {
      const pct = ((tank.currentStock / tank.capacity) * 100).toFixed(1);
      const fuelName = t[tank.fuelGrade] || tank.name;
      text += `   - ${tank.name} (${fuelName}): ${tank.currentStock.toLocaleString()} L / ${tank.capacity.toLocaleString()} L (${pct}%)\n`;
      if (tank.type === "propane") {
        text += `     [Propan bosimi: ${tank.pressure || 8.5} bar | Harorat: ${tank.temperature || 14}°C]\n`;
      }
    });

    text += `\n2. SMENADA QABUL QILINGAN (KIRIMLAR):\n`;
    const recentInflows = data.inflows.slice(0, 5);
    if (recentInflows.length === 0) {
      text += `   Smenada kirim qayd etilmadi.\n`;
    } else {
      recentInflows.forEach(inf => {
        text += `   + [${new Date(inf.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${inf.volume.toLocaleString()} L | Zavod: ${inf.supplier} | TTN: ${inf.invoiceNo} | Sisterna: ${inf.truckPlate}\n`;
      });
    }

    text += `\n3. SMENADA SOTILGAN (CHIQIMLAR):\n`;
    const recentOutflows = data.outflows.slice(0, 5);
    if (recentOutflows.length === 0) {
      text += `   Smenada sotuv qayd etilmadi.\n`;
    } else {
      recentOutflows.forEach(out => {
        text += `   - [${new Date(out.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${out.volume.toLocaleString()} L | ${out.dispenser} | Hisoblagich: ${out.meterStart || '-'} -> ${out.meterEnd || '-'} | Operator: ${out.operator}\n`;
      });
    }

    text += `\n4. SMENA HARAKATI UMUMIY BALANSI:\n`;
    text += `   • Jami kirim qilingan hajm: ${totals.todayDeliveries.toLocaleString()} L\n`;
    text += `   • Jami sotilgan / tarqatilgan hajm: ${totals.todaySales.toLocaleString()} L\n`;
    text += `   • Sof yoqilg'i harakati: ${(totals.todayDeliveries - totals.todaySales > 0 ? "+" : "")}${(totals.todayDeliveries - totals.todaySales).toLocaleString()} L\n`;
    text += `   • Kam qoldiq ogohlantirishlari: ${totals.activeAlerts}\n\n`;

    text += `Smenani topshirgan operator: Tasdiqlandi\n`;
    text += `PetroFlow Avtomatlashtirilgan Nazorat Tizimi\n`;
    return text;
  }

  getSubject(type = "shift") {
    const settings = window.stationData.settings;
    const now = new Date().toISOString().slice(0, 10);
    if (type === "emergency") {
      return `[SHOSHILINCH OGOHLANTIRISH] Yoqilg'i kam qoldi ${settings.stationCode} - ${now}`;
    }
    if (type === "stock") {
      return `[Kunlik Zaxira] Rezervuarlar auditi ${settings.stationCode} - ${now}`;
    }
    return `[Smena Hisoboti] Yoqilg'i Kirim/Chiqim Balansi ${settings.stationCode} - ${now}`;
  }

  openGmailWeb(type = null) {
    const activeType = type || this.reportType;
    const settings = window.stationData.settings;
    const to = encodeURIComponent(settings.managerEmail || "");
    const cc = encodeURIComponent(settings.supervisorEmail || "");
    const subject = encodeURIComponent(this.getSubject(activeType));
    const body = encodeURIComponent(this.generateReportText(activeType));

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
      const lang = window.stationApp ? window.stationApp.currentLang : "uz";
      const t = translations[lang] || translations.uz;
      alert(t.copiedToClipboard || "Hisobot nusxalandi!");
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

