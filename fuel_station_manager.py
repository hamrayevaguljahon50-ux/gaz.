#!/usr/bin/env python3
"""
PetroFlow Station Manager - Standalone Python Management & Analytics Engine
Supports Gasoline (AI-80, AI-92, AI-95) and Propane Gas (LPG) tracking,
inflows, outflows, tank calibrations, and automated Gmail SMTP dispatches.
"""

import os
import sys
import json
import argparse
from datetime import datetime

DATA_FILE = "station_data.json"

DEFAULT_DATA = {
    "tanks": [
        {
            "id": "tank-gasoline-92",
            "name": "Tank #1 (AI-92)",
            "type": "gasoline",
            "fuelGrade": "Gasoline AI-92",
            "capacity": 35000,
            "currentStock": 22450,
            "safeMinimum": 4000,
            "warningPercentage": 20,
            "temperature": 16.5,
            "pressure": None,
            "unit": "L"
        },
        {
            "id": "tank-gasoline-95",
            "name": "Tank #2 (AI-95 Premium)",
            "type": "gasoline",
            "fuelGrade": "Gasoline AI-95",
            "capacity": 25000,
            "currentStock": 14800,
            "safeMinimum": 3000,
            "warningPercentage": 20,
            "temperature": 15.8,
            "pressure": None,
            "unit": "L"
        },
        {
            "id": "tank-gasoline-80",
            "name": "Tank #3 (AI-80 Regular)",
            "type": "gasoline",
            "fuelGrade": "Gasoline AI-80",
            "capacity": 30000,
            "currentStock": 7100,
            "safeMinimum": 3500,
            "warningPercentage": 25,
            "temperature": 17.2,
            "pressure": None,
            "unit": "L"
        },
        {
            "id": "tank-propane-lpg",
            "name": "LPG Bullet #1 (Propane)",
            "type": "propane",
            "fuelGrade": "Propane Gas (LPG)",
            "capacity": 22000,
            "currentStock": 15200,
            "safeMinimum": 2500,
            "warningPercentage": 20,
            "temperature": 14.2,
            "pressure": 8.6,
            "maxPressure": 16.0,
            "unit": "L"
        }
    ],
    "inflows": [],
    "outflows": [],
    "settings": {
        "stationName": "PetroFlow Tashkent Terminal #4",
        "stationCode": "YQSH-04-TSH",
        "managerEmail": "station.manager@petroflow.uz"
    }
}


def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[!] Warning: Could not read {DATA_FILE}: {e}. Loading defaults.")
    return DEFAULT_DATA.copy()


def save_data(data):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[√] Station data saved to {DATA_FILE}")
    except Exception as e:
        print(f"[!] Error saving to {DATA_FILE}: {e}")


def display_dashboard(data):
    print("\n" + "=" * 70)
    print(f"  PETROFLOW FUEL & GAS STATION - MONITORING DASHBOARD")
    print(f"  Station: {data['settings'].get('stationName')} [{data['settings'].get('stationCode')}]")
    print(f"  Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    total_gasoline = 0
    total_propane = 0

    print("\n[ STORAGE TANKS & LEVEL STATUS ]")
    print("-" * 70)
    print(f"{'Tank Name':<22} {'Fuel Grade':<18} {'Current / Cap (L)':<20} {'Fill %':<8} {'Status'}")
    print("-" * 70)

    for t in data["tanks"]:
        cap = t["capacity"]
        cur = t["currentStock"]
        pct = (cur / cap * 100) if cap else 0
        status = "Optimal"
        if cur <= t["safeMinimum"]:
            status = "CRITICAL!"
        elif pct <= t.get("warningPercentage", 20):
            status = "LOW"

        if t["type"] == "propane":
            total_propane += cur
            pres = f" ({t.get('pressure', 0):.1f} bar)"
            print(f"{t['name']:<22} {t['fuelGrade']:<18} {f'{cur:,.0f}/{cap:,.0f}' + pres:<20} {pct:>5.1f}%   [{status}]")
        else:
            total_gasoline += cur
            print(f"{t['name']:<22} {t['fuelGrade']:<18} {f'{cur:,.0f}/{cap:,.0f}':<20} {pct:>5.1f}%   [{status}]")

    print("-" * 70)
    print(f"Total Gasoline Reserves : {total_gasoline:,.0f} Liters")
    print(f"Total Propane Reserves  : {total_propane:,.0f} Liters")
    print(f"Combined Station Stock  : {total_gasoline + total_propane:,.0f} Liters")
    print("=" * 70)


def record_inflow(data):
    print("\n--- RECORD INFLOW / DELIVERY ---")
    print("Available Tanks:")
    for idx, t in enumerate(data["tanks"]):
        print(f"  {idx + 1}. {t['name']} - {t['fuelGrade']} (Current: {t['currentStock']:,.0f} L)")

    choice = input("Select target tank (1-{}): ".format(len(data["tanks"]))).strip()
    try:
        tank_idx = int(choice) - 1
        target_tank = data["tanks"][tank_idx]
    except Exception:
        print("[!] Invalid tank selection.")
        return

    vol_str = input(f"Enter delivered volume in Liters: ").strip()
    try:
        vol = float(vol_str)
        if vol <= 0:
            raise ValueError
    except ValueError:
        print("[!] Invalid volume.")
        return

    pressure = None
    if target_tank["type"] == "propane":
        pres_str = input("Enter LPG tanker pressure in bar (e.g. 8.5): ").strip()
        try:
            pressure = float(pres_str)
        except ValueError:
            pressure = 8.5

    supplier = input("Supplier / Refinery: ").strip() or "Standard Delivery"
    invoice = input("Waybill / Invoice # (TTN): ").strip() or "N/A"
    truck = input("Tanker truck license plate: ").strip() or "N/A"
    operator = input("Receiving operator: ").strip() or "Station Operator"

    # Update stock
    target_tank["currentStock"] = min(target_tank["capacity"], target_tank["currentStock"] + vol)
    if pressure and target_tank["type"] == "propane":
        target_tank["pressure"] = pressure

    record = {
        "id": f"inf-py-{int(datetime.now().timestamp())}",
        "date": datetime.now().isoformat(),
        "tankId": target_tank["id"],
        "fuelType": target_tank["fuelGrade"],
        "volume": vol,
        "pressure": pressure,
        "supplier": supplier,
        "invoiceNo": invoice,
        "truckPlate": truck,
        "operator": operator
    }
    data["inflows"].insert(0, record)
    save_data(data)
    print(f"[√] Successfully added {vol:,.0f} L to {target_tank['name']}!")


def record_outflow(data):
    print("\n--- RECORD OUTFLOW / SALES ---")
    print("Available Tanks:")
    for idx, t in enumerate(data["tanks"]):
        print(f"  {idx + 1}. {t['name']} - {t['fuelGrade']} (Current: {t['currentStock']:,.0f} L)")

    choice = input("Select source tank (1-{}): ".format(len(data["tanks"]))).strip()
    try:
        tank_idx = int(choice) - 1
        source_tank = data["tanks"][tank_idx]
    except Exception:
        print("[!] Invalid tank selection.")
        return

    dispenser = input("Dispenser / Pump # (e.g. Pump 1 or LPG Col 2): ").strip() or "Pump 1"
    
    use_meters = input("Do you want to enter meter readings? (y/n): ").strip().lower() == "y"
    meter_start, meter_end, vol = None, None, 0.0

    if use_meters:
        try:
            meter_start = float(input("Start meter totalizer (L): ").strip())
            meter_end = float(input("End meter totalizer (L): ").strip())
            vol = meter_end - meter_start
            if vol < 0:
                print("[!] End meter cannot be less than start meter.")
                return
            print(f"Calculated volume dispensed: {vol:,.1f} Liters")
        except ValueError:
            print("[!] Invalid meter input.")
            return
    else:
        try:
            vol = float(input("Enter dispensed volume in Liters: ").strip())
            if vol <= 0:
                raise ValueError
        except ValueError:
            print("[!] Invalid volume.")
            return

    if vol > source_tank["currentStock"]:
        print(f"[!] Error: Dispensed volume ({vol:,.0f} L) exceeds available stock ({source_tank['currentStock']:,.0f} L)!")
        return

    operator = input("Cashier / Operator name: ").strip() or "Attendant"
    shift = input("Shift (1 for Day, 2 for Night): ").strip()
    shift_name = "Shift 1 (Day)" if shift == "1" else "Shift 2 (Night)"

    source_tank["currentStock"] = max(0, source_tank["currentStock"] - vol)

    record = {
        "id": f"out-py-{int(datetime.now().timestamp())}",
        "date": datetime.now().isoformat(),
        "tankId": source_tank["id"],
        "fuelType": source_tank["fuelGrade"],
        "dispenser": dispenser,
        "meterStart": meter_start,
        "meterEnd": meter_end,
        "volume": vol,
        "shift": shift_name,
        "operator": operator
    }
    data["outflows"].insert(0, record)
    save_data(data)
    print(f"[√] Successfully dispensed {vol:,.0f} L from {source_tank['name']}!")


def generate_gmail_report(data):
    from gmail_notifier import send_gmail_report, format_shift_report
    report_text, subject = format_shift_report(data)
    print("\n--- GMAIL REPORT PREVIEW ---")
    print(f"Subject: {subject}\n")
    print(report_text)
    print("-" * 50)

    send = input("Do you want to send this report via Gmail SMTP now? (y/n): ").strip().lower()
    if send == "y":
        send_gmail_report(data, report_text, subject)


def main():
    parser = argparse.ArgumentParser(description="PetroFlow Station Manager CLI")
    parser.add_argument("--action", choices=["dashboard", "inflow", "outflow", "gmail", "interactive"], default="interactive")
    args = parser.parse_args()

    data = load_data()

    if args.action == "dashboard":
        display_dashboard(data)
        return
    elif args.action == "inflow":
        record_inflow(data)
        return
    elif args.action == "outflow":
        record_outflow(data)
        return
    elif args.action == "gmail":
        generate_gmail_report(data)
        return

    # Interactive Menu
    while True:
        display_dashboard(data)
        print("\nMAIN MENU:")
        print("  1. Record Inflow (Delivery of Gasoline or Propane)")
        print("  2. Record Outflow (Dispenser Sale / Consumption)")
        print("  3. View / Send Gmail Shift Report")
        print("  4. Refresh Dashboard")
        print("  5. Exit")
        choice = input("\nEnter choice (1-5): ").strip()

        if choice == "1":
            record_inflow(data)
        elif choice == "2":
            record_outflow(data)
        elif choice == "3":
            generate_gmail_report(data)
        elif choice == "4":
            data = load_data()
        elif choice == "5":
            print("Exiting PetroFlow Station Manager. Goodbye!")
            sys.exit(0)
        else:
            print("Invalid choice, please select 1-5.")


if __name__ == "__main__":
    main()

