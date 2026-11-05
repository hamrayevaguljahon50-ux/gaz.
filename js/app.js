// Master Application Controller for PetroFlow Station Monitor

class StationApp {
  constructor() {
    this.currentSection = "dashboard";
    this.currentLang = window.stationData.settings.currentLang || "en";
    this.tankRenderer = new TankRenderer("tanksVisualGrid");
    this.charts = new StationCharts();
    this.gmail = new GmailReportManager();
    this.python = new PythonEngine();
  }

  init() {
    this.bindNavigation();
    this.bindLanguageSwitcher();
    this.bindForms();
    this.bindModals();
    this.bindFilters();
    this.setLanguage(this.currentLang);
    this.renderAll();
    this.python.initPyodide();

    // Populate Python Code Editor
    const pyEditor = document.getElementById("pythonCodeEditor");
    if (pyEditor) {
      pyEditor.value = window.DEFAULT_PYTHON_CODE;
    }

    // Set default dates in inputs to current time
    this.resetFormDates();
  }

  resetFormDates() {
    const now = new Date();
    // format as YYYY-MM-DDTHH:MM
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const inDate = document.getElementById("inflowDate");
    const outDate = document.getElementById("outflowDate");
    if (inDate) inDate.value = localIso;
    if (outDate) outDate.value = localIso;
  }

  bindNavigation() {
    const navLinks = document.querySelectorAll(".nav-link[data-section]");
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetSection = link.getAttribute("data-section");
        this.navigateTo(targetSection);
      });
    });

    // Mobile nav toggle
    const mobileBtn = document.getElementById("mobileMenuBtn");
    const navMenu = document.getElementById("navLinksMenu");
    if (mobileBtn && navMenu) {
      mobileBtn.addEventListener("click", () => {
        navMenu.classList.toggle("open");
      });
    }
  }

  navigateTo(sectionId) {
    this.currentSection = sectionId;

    // Update active nav link
    document.querySelectorAll(".nav-link").forEach(l => {
      if (l.getAttribute("data-section") === sectionId) {
        l.classList.add("active");
      } else {
        l.classList.remove("active");
      }
    });

    // Close mobile nav if open
    const navMenu = document.getElementById("navLinksMenu");
    if (navMenu) navMenu.classList.remove("open");

    // Hide all sections, display target
    document.querySelectorAll(".app-section").forEach(sec => {
      sec.classList.remove("active");
    });

    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
      target.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Specific section triggers
    if (sectionId === "analytics") {
      setTimeout(() => this.charts.renderAll(), 100);
    } else if (sectionId === "gmail") {
      this.gmail.updateLivePreview();
    } else if (sectionId === "python") {
      this.python.runPython(document.getElementById("pythonCodeEditor")?.value || window.DEFAULT_PYTHON_CODE);
    }
  }

  bindLanguageSwitcher() {
    const selector = document.getElementById("languageSelect");
    if (selector) {
      selector.value = this.currentLang;
      selector.addEventListener("change", (e) => {
        this.setLanguage(e.target.value);
      });
    }
  }

  setLanguage(lang) {
    if (!translations[lang]) lang = "en";
    this.currentLang = lang;
    window.stationData.settings.currentLang = lang;
    window.stationData.saveState();

    const t = translations[lang];

    // Update all elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (t[key]) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = t[key];
        } else {
          el.innerText = t[key];
        }
      }
    });

    // Update inputs with placeholder data-i18n-placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (t[key]) el.placeholder = t[key];
    });

    // Update dropdown options
    this.populateTankDropdowns();

    // Re-render tanks, tables, charts, preview
    this.renderAll();
  }

  populateTankDropdowns() {
    const tanks = window.stationData.tanks;
    const t = translations[this.currentLang];

    const inflowSelect = document.getElementById("inflowTank");
    const outflowSelect = document.getElementById("outflowTank");
    const editTankSelect = document.getElementById("editTankSelect");

    const buildOptions = () => tanks.map(tank => {
      const fuelName = t[tank.fuelGrade] || tank.name;
      return `<option value="${tank.id}">${tank.name} - ${fuelName} (${tank.currentStock.toLocaleString()} L)</option>`;
    }).join("");

    if (inflowSelect) inflowSelect.innerHTML = buildOptions();
    if (outflowSelect) outflowSelect.innerHTML = buildOptions();
    if (editTankSelect) editTankSelect.innerHTML = buildOptions();

    // LPG Field visibility toggles
    if (inflowSelect) {
      inflowSelect.addEventListener("change", () => {
        const selected = window.stationData.getTank(inflowSelect.value);
        const lpgFields = document.querySelectorAll(".inflow-lpg-only");
        lpgFields.forEach(f => {
          f.style.display = (selected && selected.type === "propane") ? "block" : "none";
        });
      });
      // Initial trigger
      const selected = window.stationData.getTank(inflowSelect.value);
      const lpgFields = document.querySelectorAll(".inflow-lpg-only");
      lpgFields.forEach(f => {
        f.style.display = (selected && selected.type === "propane") ? "block" : "none";
      });
    }
  }

  bindForms() {
    // Inflow Form Submission
    const inflowForm = document.getElementById("formRecordInflow");
    if (inflowForm) {
      inflowForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const t = translations[this.currentLang];
        const tankId = document.getElementById("inflowTank").value;
        const volume = parseFloat(document.getElementById("inflowVolume").value);
        const tank = window.stationData.getTank(tankId);

        if (!tank) return alert("Select a valid tank.");
        if (isNaN(volume) || volume <= 0) return alert("Please enter a valid volume.");

        if (tank.currentStock + volume > tank.capacity) {
          if (!confirm(t.alertOverCapacity + " Continue anyway?")) {
            return;
          }
        }

        try {
          window.stationData.recordInflow({
            tankId: tankId,
            volume: volume,
            massKg: document.getElementById("inflowMass")?.value,
            pressure: document.getElementById("inflowPressure")?.value,
            temperature: document.getElementById("inflowTemp")?.value,
            supplier: document.getElementById("inflowSupplier")?.value,
            invoiceNo: document.getElementById("inflowInvoice")?.value,
            truckPlate: document.getElementById("inflowTruck")?.value,
            operator: document.getElementById("inflowOperator")?.value,
            date: document.getElementById("inflowDate")?.value,
            notes: document.getElementById("inflowNotes")?.value
          });

          alert(t.alertSuccessInflow);
          inflowForm.reset();
          this.resetFormDates();
          this.renderAll();
        } catch (err) {
          alert("Error: " + err.message);
        }
      });
    }

    // Outflow Form Submission & Meter Calculation
    const outflowForm = document.getElementById("formRecordOutflow");
    const meterStart = document.getElementById("outflowMeterStart");
    const meterEnd = document.getElementById("outflowMeterEnd");
    const volumeInput = document.getElementById("outflowVolume");

    const calcMeterDiff = () => {
      const s = parseFloat(meterStart?.value);
      const e = parseFloat(meterEnd?.value);
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        volumeInput.value = (e - s).toFixed(1);
      }
    };

    if (meterStart && meterEnd) {
      meterStart.addEventListener("input", calcMeterDiff);
      meterEnd.addEventListener("input", calcMeterDiff);
    }

    if (outflowForm) {
      outflowForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const t = translations[this.currentLang];
        const tankId = document.getElementById("outflowTank").value;
        const volume = parseFloat(document.getElementById("outflowVolume").value);
        const tank = window.stationData.getTank(tankId);

        if (!tank) return alert("Select a valid tank.");
        if (isNaN(volume) || volume <= 0) return alert("Please specify dispensed volume.");

        if (volume > tank.currentStock) {
          alert(t.alertNegativeStock);
          return;
        }

        try {
          window.stationData.recordOutflow({
            tankId: tankId,
            volume: volume,
            dispenser: document.getElementById("outflowDispenser")?.value,
            meterStart: document.getElementById("outflowMeterStart")?.value,
            meterEnd: document.getElementById("outflowMeterEnd")?.value,
            shift: document.getElementById("outflowShift")?.value,
            operator: document.getElementById("outflowOperator")?.value,
            date: document.getElementById("outflowDate")?.value,
            notes: document.getElementById("outflowNotes")?.value
          });

          alert(t.alertSuccessOutflow);
          outflowForm.reset();
          this.resetFormDates();
          this.renderAll();
        } catch (err) {
          alert("Error: " + err.message);
        }
      });
    }

    // Tank Calibration Form
    const editTankSelect = document.getElementById("editTankSelect");
    if (editTankSelect) {
      editTankSelect.addEventListener("change", () => {
        this.fillCalibrationForm(editTankSelect.value);
      });
    }

    const formCalibrate = document.getElementById("formCalibrateTank");
    if (formCalibrate) {
      formCalibrate.addEventListener("submit", (e) => {
        e.preventDefault();
        const tankId = document.getElementById("editTankSelect").value;
        const updateData = {
          capacity: document.getElementById("editTankCapacity").value,
          currentStock: document.getElementById("editTankStock").value,
          safeMinimum: document.getElementById("editTankSafeMin").value,
          warningPercentage: document.getElementById("editTankWarningPct").value,
          temperature: document.getElementById("editTankTemp").value,
          pressure: document.getElementById("editTankPressure")?.value
        };

        window.stationData.updateTank(tankId, updateData);
        alert(translations[this.currentLang].btnUpdateTank + "!");
        this.renderAll();
        this.closeModal("modalCalibration");
      });
    }

    // Gmail Settings Form
    const gmailForm = document.getElementById("formGmailSettings");
    if (gmailForm) {
      gmailForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.stationData.settings.managerEmail = document.getElementById("gmailRecipient").value;
        window.stationData.settings.supervisorEmail = document.getElementById("gmailCc").value;
        window.stationData.settings.emailSubject = document.getElementById("gmailSubject").value;
        window.stationData.saveState();
        this.gmail.updateLivePreview();
        alert("Gmail settings saved!");
      });
    }

    const reportTypeSelect = document.getElementById("gmailReportType");
    if (reportTypeSelect) {
      reportTypeSelect.addEventListener("change", (e) => {
        this.gmail.reportType = e.target.value;
        this.gmail.updateLivePreview();
      });
    }
  }

  fillCalibrationForm(tankId) {
    const tank = window.stationData.getTank(tankId);
    if (!tank) return;

    document.getElementById("editTankCapacity").value = tank.capacity;
    document.getElementById("editTankStock").value = tank.currentStock;
    document.getElementById("editTankSafeMin").value = tank.safeMinimum;
    document.getElementById("editTankWarningPct").value = tank.warningPercentage || 20;
    document.getElementById("editTankTemp").value = tank.temperature || 15;

    const pressureGroup = document.getElementById("editPressureGroup");
    if (pressureGroup) {
      if (tank.type === "propane") {
        pressureGroup.style.display = "block";
        document.getElementById("editTankPressure").value = tank.pressure || 8.5;
      } else {
        pressureGroup.style.display = "none";
      }
    }
  }

  bindModals() {
    // Backdrop click close
    document.querySelectorAll(".modal").forEach(modal => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("open");
        }
      });
    });

    document.querySelectorAll(".modal-close").forEach(btn => {
      btn.addEventListener("click", () => {
        btn.closest(".modal").classList.remove("open");
      });
    });
  }

  openCalibration(tankId) {
    const select = document.getElementById("editTankSelect");
    if (select) {
      select.value = tankId;
      this.fillCalibrationForm(tankId);
    }
    const modal = document.getElementById("modalCalibration");
    if (modal) modal.classList.add("open");
  }

  openQuickInflow(tankId) {
    this.navigateTo("inflows");
    const select = document.getElementById("inflowTank");
    if (select) {
      select.value = tankId;
      select.dispatchEvent(new Event("change"));
    }
    document.getElementById("inflowVolume")?.focus();
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("open");
  }

  bindFilters() {
    const searchInflow = document.getElementById("searchInflow");
    const filterInflowFuel = document.getElementById("filterInflowFuel");
    if (searchInflow) searchInflow.addEventListener("input", () => this.renderInflowsTable());
    if (filterInflowFuel) filterInflowFuel.addEventListener("change", () => this.renderInflowsTable());

    const searchOutflow = document.getElementById("searchOutflow");
    const filterOutflowFuel = document.getElementById("filterOutflowFuel");
    if (searchOutflow) searchOutflow.addEventListener("input", () => this.renderOutflowsTable());
    if (filterOutflowFuel) filterOutflowFuel.addEventListener("change", () => this.renderOutflowsTable());

    // JSON Import
    const jsonInput = document.getElementById("jsonFileInput");
    if (jsonInput) {
      jsonInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const success = window.stationData.importFromJSON(evt.target.result);
          if (success) {
            alert("Station data imported successfully!");
            this.renderAll();
          } else {
            alert("Failed to import data: invalid JSON format.");
          }
        };
        reader.readAsText(file);
      });
    }
  }

  renderAll() {
    this.updateKPICards();
    this.tankRenderer.renderAll(window.stationData.tanks);
    this.renderInflowsTable();
    this.renderOutflowsTable();
    this.charts.renderAll();
    this.gmail.updateLivePreview();
    this.populateTankDropdowns();

    // Fill Gmail settings fields
    const s = window.stationData.settings;
    if (document.getElementById("gmailRecipient")) document.getElementById("gmailRecipient").value = s.managerEmail || "";
    if (document.getElementById("gmailCc")) document.getElementById("gmailCc").value = s.supervisorEmail || "";
    if (document.getElementById("gmailSubject")) document.getElementById("gmailSubject").value = s.emailSubject || "";
  }

  updateKPICards() {
    const totals = window.stationData.getTotals();
    const t = translations[this.currentLang];

    const elTotal = document.getElementById("kpiTotalFuelVal");
    const elGas = document.getElementById("kpiGasolineStockVal");
    const elPropane = document.getElementById("kpiPropaneStockVal");
    const elTodayIn = document.getElementById("kpiTodayDeliveriesVal");
    const elTodayOut = document.getElementById("kpiTodaySalesVal");
    const elAlerts = document.getElementById("kpiActiveAlertsVal");

    if (elTotal) elTotal.innerText = `${totals.totalFuelStock.toLocaleString()} L`;
    if (elGas) elGas.innerText = `${totals.totalGasolineStock.toLocaleString()} L`;
    if (elPropane) elPropane.innerText = `${totals.totalPropaneStock.toLocaleString()} L`;
    if (elTodayIn) elTodayIn.innerText = `+${totals.todayDeliveries.toLocaleString()} L`;
    if (elTodayOut) elTodayOut.innerText = `-${totals.todaySales.toLocaleString()} L`;

    if (elAlerts) {
      if (totals.activeAlerts > 0) {
        elAlerts.innerHTML = `<span class="badge badge-danger">⚠️ ${totals.activeAlerts} ${t.tankStatusLow}</span>`;
      } else {
        elAlerts.innerHTML = `<span class="badge badge-success">✅ ${t.kpiSafeStatus}</span>`;
      }
    }
  }

  renderInflowsTable() {
    const tbody = document.getElementById("inflowsTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchInflow")?.value || "").toLowerCase();
    const fuelFilter = document.getElementById("filterInflowFuel")?.value || "all";
    const t = translations[this.currentLang];

    let items = window.stationData.inflows;

    if (fuelFilter !== "all") {
      items = items.filter(i => {
        const tank = window.stationData.getTank(i.tankId);
        if (fuelFilter === "gasoline") return tank && tank.type === "gasoline";
        if (fuelFilter === "propane") return tank && tank.type === "propane";
        return true;
      });
    }

    if (searchTerm) {
      items = items.filter(i => 
        (i.supplier && i.supplier.toLowerCase().includes(searchTerm)) ||
        (i.invoiceNo && i.invoiceNo.toLowerCase().includes(searchTerm)) ||
        (i.truckPlate && i.truckPlate.toLowerCase().includes(searchTerm)) ||
        (i.operator && i.operator.toLowerCase().includes(searchTerm)) ||
        (i.notes && i.notes.toLowerCase().includes(searchTerm))
      );
    }

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">${t.noRecordsFound}</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const tank = window.stationData.getTank(item.tankId);
      const fuelName = tank ? (t[tank.fuelGrade] || tank.name) : item.fuelType;
      const isLpg = tank && tank.type === "propane";
      const extra = isLpg && item.pressure ? `<small class="badge badge-info">${item.pressure} bar</small>` : "";

      return `
        <tr>
          <td>
            <strong>${new Date(item.date).toLocaleDateString()}</strong><br>
            <small class="text-muted">${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
          </td>
          <td>
            <span class="badge" style="background-color: ${tank ? tank.color : '#64748b'}22; color: ${tank ? tank.color : '#fff'}; border: 1px solid ${tank ? tank.color : '#64748b'}66;">
              ${fuelName}
            </span>
          </td>
          <td>${tank ? tank.name : item.tankId}</td>
          <td><strong class="text-emerald">+${item.volume.toLocaleString()} L</strong> ${extra}</td>
          <td>${item.supplier || '-'}</td>
          <td><span class="invoice-tag">${item.invoiceNo || '-'}</span></td>
          <td><code>${item.truckPlate || '-'}</code></td>
          <td>
            <button class="btn btn-xs btn-danger" onclick="window.stationApp.deleteInflowRecord('${item.id}')" title="Delete">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  renderOutflowsTable() {
    const tbody = document.getElementById("outflowsTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("searchOutflow")?.value || "").toLowerCase();
    const fuelFilter = document.getElementById("filterOutflowFuel")?.value || "all";
    const t = translations[this.currentLang];

    let items = window.stationData.outflows;

    if (fuelFilter !== "all") {
      items = items.filter(o => {
        const tank = window.stationData.getTank(o.tankId);
        if (fuelFilter === "gasoline") return tank && tank.type === "gasoline";
        if (fuelFilter === "propane") return tank && tank.type === "propane";
        return true;
      });
    }

    if (searchTerm) {
      items = items.filter(o =>
        (o.dispenser && o.dispenser.toLowerCase().includes(searchTerm)) ||
        (o.operator && o.operator.toLowerCase().includes(searchTerm)) ||
        (o.notes && o.notes.toLowerCase().includes(searchTerm))
      );
    }

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">${t.noRecordsFound}</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const tank = window.stationData.getTank(item.tankId);
      const fuelName = tank ? (t[tank.fuelGrade] || tank.name) : item.fuelType;
      const meterText = (item.meterStart && item.meterEnd) ? `${item.meterStart} → ${item.meterEnd}` : "-";

      return `
        <tr>
          <td>
            <strong>${new Date(item.date).toLocaleDateString()}</strong><br>
            <small class="text-muted">${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
          </td>
          <td>
            <span class="badge" style="background-color: ${tank ? tank.color : '#64748b'}22; color: ${tank ? tank.color : '#fff'}; border: 1px solid ${tank ? tank.color : '#64748b'}66;">
              ${fuelName}
            </span>
          </td>
          <td><span class="badge badge-outline">${item.dispenser}</span></td>
          <td><strong class="text-amber">-${item.volume.toLocaleString()} L</strong></td>
          <td><small class="font-mono">${meterText}</small></td>
          <td>${t[item.shift] || item.shift}</td>
          <td>${item.operator}</td>
          <td>
            <button class="btn btn-xs btn-danger" onclick="window.stationApp.deleteOutflowRecord('${item.id}')" title="Delete">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  deleteInflowRecord(id) {
    const t = translations[this.currentLang];
    if (confirm(t.confirmDelete)) {
      window.stationData.deleteInflow(id);
      this.renderAll();
    }
  }

  deleteOutflowRecord(id) {
    const t = translations[this.currentLang];
    if (confirm(t.confirmDelete)) {
      window.stationData.deleteOutflow(id);
      this.renderAll();
    }
  }
}

// Global initialization on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.stationApp = new StationApp();
  window.stationApp.init();
});

