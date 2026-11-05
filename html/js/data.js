// Fuel Station State & Data Management Module

const DEFAULT_TANKS = [
  {
    id: "tank-gasoline-92",
    name: "Tank #1 (AI-92)",
    type: "gasoline",
    fuelGrade: "fuelGasoline92",
    capacity: 35000,
    currentStock: 22450,
    safeMinimum: 4000,
    warningPercentage: 20,
    temperature: 16.5,
    density: 0.745,
    pressure: null,
    unit: "L",
    color: "#f59e0b",
    waveColor: "rgba(245, 158, 11, 0.45)"
  },
  {
    id: "tank-gasoline-95",
    name: "Tank #2 (AI-95 Premium)",
    type: "gasoline",
    fuelGrade: "fuelGasoline95",
    capacity: 25000,
    currentStock: 14800,
    safeMinimum: 3000,
    warningPercentage: 20,
    temperature: 15.8,
    density: 0.755,
    pressure: null,
    unit: "L",
    color: "#10b981",
    waveColor: "rgba(16, 185, 129, 0.45)"
  },
  {
    id: "tank-gasoline-80",
    name: "Tank #3 (AI-80 Regular)",
    type: "gasoline",
    fuelGrade: "fuelGasoline80",
    capacity: 30000,
    currentStock: 7100,
    safeMinimum: 3500,
    warningPercentage: 25,
    temperature: 17.2,
    density: 0.730,
    pressure: null,
    unit: "L",
    color: "#eab308",
    waveColor: "rgba(234, 179, 8, 0.45)"
  },
  {
    id: "tank-propane-lpg",
    name: "LPG Bullet #1 (Propane)",
    type: "propane",
    fuelGrade: "fuelPropane",
    capacity: 22000,
    currentStock: 15200,
    safeMinimum: 2500,
    warningPercentage: 20,
    temperature: 14.2,
    density: 0.540,
    pressure: 8.6,
    maxPressure: 16.0,
    unit: "L",
    color: "#06b6d4",
    waveColor: "rgba(6, 182, 212, 0.45)"
  }
];

const DEFAULT_INFLOWS = [
  {
    id: "inf-101",
    date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    tankId: "tank-gasoline-92",
    fuelType: "fuelGasoline92",
    volume: 12000,
    supplier: "Fergana Oil Refinery (FNQIZ)",
    invoiceNo: "TTN-847291",
    truckPlate: "01 742 AAA",
    operator: "Bobur Aliyev",
    temperature: 15.4,
    pressure: null,
    notes: "Certificate of Quality #410/26 OK"
  },
  {
    id: "inf-102",
    date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    tankId: "tank-propane-lpg",
    fuelType: "fuelPropane",
    volume: 9500,
    massKg: 5130,
    supplier: "Mubarek Gas Processing Plant",
    invoiceNo: "LPG-662901",
    truckPlate: "80 315 BBA",
    operator: "Khamid Zokirov",
    temperature: 13.8,
    pressure: 9.1,
    notes: "Density 0.540 kg/L, odorant level standard"
  },
  {
    id: "inf-103",
    date: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    tankId: "tank-gasoline-95",
    fuelType: "fuelGasoline95",
    volume: 8000,
    supplier: "Bukhara Refinery (BNQIZ)",
    invoiceNo: "TTN-910244",
    truckPlate: "10 890 VAA",
    operator: "Bobur Aliyev",
    temperature: 16.1,
    pressure: null,
    notes: "Euro-5 Standard verified"
  },
  {
    id: "inf-104",
    date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    tankId: "tank-gasoline-92",
    fuelType: "fuelGasoline92",
    volume: 6000,
    supplier: "Uzbekneftegaz Logistics",
    invoiceNo: "TTN-912803",
    truckPlate: "01 555 XYZ",
    operator: "Sherzod Karimov",
    temperature: 17.0,
    pressure: null,
    notes: "Regular scheduled replenishment"
  }
];

const DEFAULT_OUTFLOWS = [
  {
    id: "out-201",
    date: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    tankId: "tank-gasoline-92",
    fuelType: "fuelGasoline92",
    dispenser: "Pump #1",
    meterStart: 124500,
    meterEnd: 127850,
    volume: 3350,
    shift: "outflowShiftDay",
    operator: "Sardor Umarov",
    notes: "Day shift retail sales"
  },
  {
    id: "out-202",
    date: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    tankId: "tank-propane-lpg",
    fuelType: "fuelPropane",
    dispenser: "LPG Column #1",
    meterStart: 89400,
    meterEnd: 92250,
    volume: 2850,
    shift: "outflowShiftNight",
    operator: "Aziz Rakhimov",
    notes: "Night fleet refueling (Taxis)"
  },
  {
    id: "out-203",
    date: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    tankId: "tank-gasoline-95",
    fuelType: "fuelGasoline95",
    dispenser: "Pump #3",
    meterStart: 64100,
    meterEnd: 65900,
    volume: 1800,
    shift: "outflowShiftDay",
    operator: "Sardor Umarov",
    notes: "Day shift retail"
  },
  {
    id: "out-204",
    date: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    tankId: "tank-propane-lpg",
    fuelType: "fuelPropane",
    dispenser: "LPG Column #2",
    meterStart: 45200,
    meterEnd: 47900,
    volume: 2700,
    shift: "outflowShiftDay",
    operator: "Aziz Rakhimov",
    notes: "Commercial van and taxi refueling"
  },
  {
    id: "out-205",
    date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    tankId: "tank-gasoline-80",
    fuelType: "fuelGasoline80",
    dispenser: "Pump #4",
    meterStart: 102100,
    meterEnd: 104500,
    volume: 2400,
    shift: "outflowShiftDay",
    operator: "Sardor Umarov",
    notes: "Agricultural and municipal transport"
  }
];

class FuelStationData {
  constructor() {
    this.STORAGE_KEY = "petroflow_station_data_v1";
    this.SETTINGS_KEY = "petroflow_station_settings_v1";
    this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.tanks = parsed.tanks || DEFAULT_TANKS;
        this.inflows = parsed.inflows || DEFAULT_INFLOWS;
        this.outflows = parsed.outflows || DEFAULT_OUTFLOWS;
      } else {
        this.resetToDefaults();
      }
    } catch (e) {
      this.resetToDefaults();
    }

    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      this.settings = settings ? JSON.parse(settings) : {
        currentLang: "uz",
        stationName: "PetroFlow Tashkent Terminal #4",
        stationCode: "YQSH-04-TSH",
        managerEmail: "station.manager@petroflow.uz",
        supervisorEmail: "supervisor@petroflow.uz",
        emailSubject: "[PetroFlow Report] Daily Fuel Stock & Dispensing Balance"
      };
    } catch (e) {
      this.settings = {
        currentLang: "uz",
        stationName: "PetroFlow Tashkent Terminal #4",
        stationCode: "YQSH-04-TSH",
        managerEmail: "station.manager@petroflow.uz",
        supervisorEmail: "supervisor@petroflow.uz",
        emailSubject: "[PetroFlow Report] Daily Fuel Stock & Dispensing Balance"
      };
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        tanks: this.tanks,
        inflows: this.inflows,
        outflows: this.outflows
      }));
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }

  resetToDefaults() {
    this.tanks = JSON.parse(JSON.stringify(DEFAULT_TANKS));
    this.inflows = JSON.parse(JSON.stringify(DEFAULT_INFLOWS));
    this.outflows = JSON.parse(JSON.stringify(DEFAULT_OUTFLOWS));
    this.saveState();
  }

  getTank(id) {
    return this.tanks.find(t => t.id === id);
  }

  recordInflow(inflowData) {
    const tank = this.getTank(inflowData.tankId);
    if (!tank) throw new Error("Target tank not found");

    const volume = parseFloat(inflowData.volume);
    if (isNaN(volume) || volume <= 0) throw new Error("Invalid volume amount");

    tank.currentStock = Math.min(tank.capacity, tank.currentStock + volume);

    if (tank.type === "propane" && inflowData.pressure) {
      const p = parseFloat(inflowData.pressure);
      if (!isNaN(p)) tank.pressure = p;
    }
    if (inflowData.temperature) {
      const t = parseFloat(inflowData.temperature);
      if (!isNaN(t)) tank.temperature = t;
    }

    const newRecord = {
      id: "inf-" + Date.now().toString(36),
      date: inflowData.date || new Date().toISOString(),
      tankId: inflowData.tankId,
      fuelType: tank.fuelGrade,
      volume: volume,
      massKg: inflowData.massKg ? parseFloat(inflowData.massKg) : null,
      supplier: inflowData.supplier || "Direct Refinery Delivery",
      invoiceNo: inflowData.invoiceNo || "N/A",
      truckPlate: inflowData.truckPlate || "N/A",
      operator: inflowData.operator || "Station Attendant",
      temperature: inflowData.temperature ? parseFloat(inflowData.temperature) : null,
      pressure: inflowData.pressure ? parseFloat(inflowData.pressure) : null,
      notes: inflowData.notes || ""
    };

    this.inflows.unshift(newRecord);
    this.saveState();
    return newRecord;
  }

  recordOutflow(outflowData) {
    const tank = this.getTank(outflowData.tankId);
    if (!tank) throw new Error("Source tank not found");

    let volume = parseFloat(outflowData.volume);
    if (isNaN(volume) || volume <= 0) {
      const start = parseFloat(outflowData.meterStart);
      const end = parseFloat(outflowData.meterEnd);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        volume = end - start;
      } else {
        throw new Error("Invalid dispensed volume or meter readings");
      }
    }

    if (volume > tank.currentStock) {
      throw new Error("Cannot dispense more than current stock in tank!");
    }

    tank.currentStock = Math.max(0, tank.currentStock - volume);

    const newRecord = {
      id: "out-" + Date.now().toString(36),
      date: outflowData.date || new Date().toISOString(),
      tankId: outflowData.tankId,
      fuelType: tank.fuelGrade,
      dispenser: outflowData.dispenser || "Dispenser 1",
      meterStart: outflowData.meterStart ? parseFloat(outflowData.meterStart) : null,
      meterEnd: outflowData.meterEnd ? parseFloat(outflowData.meterEnd) : null,
      volume: volume,
      shift: outflowData.shift || "outflowShiftDay",
      operator: outflowData.operator || "Station Cashier",
      notes: outflowData.notes || ""
    };

    this.outflows.unshift(newRecord);
    this.saveState();
    return newRecord;
  }

  deleteInflow(recordId) {
    const index = this.inflows.findIndex(r => r.id === recordId);
    if (index === -1) return false;

    const record = this.inflows[index];
    const tank = this.getTank(record.tankId);
    if (tank) {
      tank.currentStock = Math.max(0, tank.currentStock - record.volume);
    }

    this.inflows.splice(index, 1);
    this.saveState();
    return true;
  }

  deleteOutflow(recordId) {
    const index = this.outflows.findIndex(r => r.id === recordId);
    if (index === -1) return false;

    const record = this.outflows[index];
    const tank = this.getTank(record.tankId);
    if (tank) {
      tank.currentStock = Math.min(tank.capacity, tank.currentStock + record.volume);
    }

    this.outflows.splice(index, 1);
    this.saveState();
    return true;
  }

  updateTank(tankId, updateData) {
    const tank = this.getTank(tankId);
    if (!tank) return false;

    if (updateData.capacity !== undefined) tank.capacity = parseFloat(updateData.capacity);
    if (updateData.currentStock !== undefined) tank.currentStock = parseFloat(updateData.currentStock);
    if (updateData.safeMinimum !== undefined) tank.safeMinimum = parseFloat(updateData.safeMinimum);
    if (updateData.warningPercentage !== undefined) tank.warningPercentage = parseFloat(updateData.warningPercentage);
    if (updateData.temperature !== undefined) tank.temperature = parseFloat(updateData.temperature);
    if (tank.type === "propane" && updateData.pressure !== undefined) {
      tank.pressure = parseFloat(updateData.pressure);
    }

    this.saveState();
    return true;
  }

  getTotals() {
    let totalGasolineStock = 0;
    let totalPropaneStock = 0;
    let activeAlerts = 0;

    this.tanks.forEach(t => {
      if (t.type === "gasoline") {
        totalGasolineStock += t.currentStock;
      } else if (t.type === "propane") {
        totalPropaneStock += t.currentStock;
      }

      const pct = (t.currentStock / t.capacity) * 100;
      if (t.currentStock <= t.safeMinimum || pct <= (t.warningPercentage || 20)) {
        activeAlerts++;
      }
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todayDeliveries = this.inflows
      .filter(i => new Date(i.date).getTime() >= todayStart)
      .reduce((sum, item) => sum + item.volume, 0);

    const todaySales = this.outflows
      .filter(o => new Date(o.date).getTime() >= todayStart)
      .reduce((sum, item) => sum + item.volume, 0);

    return {
      totalFuelStock: totalGasolineStock + totalPropaneStock,
      totalGasolineStock,
      totalPropaneStock,
      todayDeliveries,
      todaySales,
      activeAlerts
    };
  }

  get7DayTrends() {
    const labels = [];
    const inflowsData = [];
    const outflowsData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      labels.push(dayStr);

      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = start + 86400 * 1000;

      const dayIn = this.inflows
        .filter(inf => {
          const t = new Date(inf.date).getTime();
          return t >= start && t < end;
        })
        .reduce((sum, item) => sum + item.volume, 0);

      const dayOut = this.outflows
        .filter(out => {
          const t = new Date(out.date).getTime();
          return t >= start && t < end;
        })
        .reduce((sum, item) => sum + item.volume, 0);

      inflowsData.push(dayIn);
      outflowsData.push(dayOut);
    }

    return { labels, inflowsData, outflowsData };
  }

  exportToJSON() {
    const data = {
      tanks: this.tanks,
      inflows: this.inflows,
      outflows: this.outflows,
      settings: this.settings,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.tanks && parsed.inflows && parsed.outflows) {
        this.tanks = parsed.tanks;
        this.inflows = parsed.inflows;
        this.outflows = parsed.outflows;
        if (parsed.settings) this.settings = parsed.settings;
        this.saveState();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  exportCSV(type = "inflows") {
    let headers = [];
    let rows = [];

    if (type === "inflows") {
      headers = ["ID", "Date", "Tank", "Fuel Grade", "Volume (L)", "Supplier", "Invoice No", "Truck Plate", "Operator", "Notes"];
      rows = this.inflows.map(i => [
        i.id,
        new Date(i.date).toLocaleString(),
        i.tankId,
        i.fuelType,
        i.volume,
        `"${(i.supplier || "").replace(/"/g, '""')}"`,
        `"${(i.invoiceNo || "").replace(/"/g, '""')}"`,
        `"${(i.truckPlate || "").replace(/"/g, '""')}"`,
        `"${(i.operator || "").replace(/"/g, '""')}"`,
        `"${(i.notes || "").replace(/"/g, '""')}"`
      ]);
    } else {
      headers = ["ID", "Date", "Tank", "Fuel Grade", "Dispenser", "Meter Start", "Meter End", "Dispensed Volume (L)", "Shift", "Operator", "Notes"];
      rows = this.outflows.map(o => [
        o.id,
        new Date(o.date).toLocaleString(),
        o.tankId,
        o.fuelType,
        `"${(o.dispenser || "").replace(/"/g, '""')}"`,
        o.meterStart || 0,
        o.meterEnd || 0,
        o.volume,
        o.shift,
        `"${(o.operator || "").replace(/"/g, '""')}"`,
        `"${(o.notes || "").replace(/"/g, '""')}"`
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `petroflow_${type}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.stationData = new FuelStationData();

