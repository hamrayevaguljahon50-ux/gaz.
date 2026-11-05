#!/usr/bin/env python3
"""
Gmail Notifier & Automated Dispatcher for PetroFlow Fuel Station
Uses Python's standard smtplib and email.mime libraries to dispatch shift balance reports
and low-fuel alert notifications to station managers and supervisors.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Default configuration (can be overridden via environment variables)
GMAIL_SMTP_HOST = "smtp.gmail.com"
GMAIL_SMTP_PORT = 465  # SSL port (or 587 for TLS)


def format_shift_report(data, is_urgent=False):
    settings = data.get("settings", {})
    tanks = data.get("tanks", [])
    inflows = data.get("inflows", [])
    outflows = data.get("outflows", [])

    station_name = settings.get("stationName", "PetroFlow Station")
    station_code = settings.get("stationCode", "YQSH-01")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    subject_prefix = "[URGENT LOW STOCK]" if is_urgent else "[Shift Report]"
    subject = f"{subject_prefix} {station_name} ({station_code}) - {datetime.now().strftime('%Y-%m-%d')}"

    # Build plain-text body
    lines = []
    lines.append("=" * 60)
    lines.append(f"PETROFLOW FILLING STATION - SHIFT BALANCE & FUEL AUDIT")
    lines.append(f"Station: {station_name} [{station_code}]")
    lines.append(f"Report Generated: {now_str}")
    lines.append("=" * 60)
    lines.append("\n1. CURRENT TANK INVENTORY:")

    total_stock = 0
    total_cap = 0
    alerts = []

    for t in tanks:
        cap = t.get("capacity", 0)
        cur = t.get("currentStock", 0)
        total_stock += cur
        total_cap += cap
        pct = (cur / cap * 100) if cap else 0
        fuel = t.get("fuelGrade", t.get("name", "Fuel"))

        safe_min = t.get("safeMinimum", 3000)
        status = "Optimal"
        if cur <= safe_min:
            status = "CRITICAL MINIMUM!"
            alerts.append(f"CRITICAL: {t['name']} is below safe threshold ({cur:,.0f} L / {safe_min:,.0f} L)")
        elif pct <= t.get("warningPercentage", 20):
            status = "LOW REORDER"
            alerts.append(f"WARNING: {t['name']} is low ({pct:.1f}% fill)")

        pres_info = f" | Pressure: {t.get('pressure', 0):.1f} bar" if t.get("type") == "propane" else ""
        lines.append(f"  • {t['name']} ({fuel}): {cur:,.0f} L / {cap:,.0f} L ({pct:.1f}%) [{status}]{pres_info}")

    lines.append(f"\nTotal Fuel Volume on Hand: {total_stock:,.0f} Liters (Capacity: {total_cap:,.0f} L)")

    lines.append("\n2. RECENT INFLOW DELIVERIES (PAST SHIFT):")
    if inflows:
        for inf in inflows[:5]:
            lines.append(f"  + [{inf.get('date', '')[:16]}] {inf.get('volume', 0):,.0f} L | {inf.get('fuelType', 'Fuel')} | Supplier: {inf.get('supplier', 'Refinery')} | Waybill: {inf.get('invoiceNo', '-')}")
    else:
        lines.append("  No new deliveries logged.")

    lines.append("\n3. RECENT DISPENSER OUTFLOWS (SALES):")
    if outflows:
        for out in outflows[:5]:
            lines.append(f"  - [{out.get('date', '')[:16]}] {out.get('volume', 0):,.0f} L | {out.get('fuelType', 'Fuel')} | {out.get('dispenser', 'Pump')} | Operator: {out.get('operator', 'Attendant')}")
    else:
        lines.append("  No dispenser sales logged.")

    if alerts:
        lines.append("\n" + "!" * 60)
        lines.append("ACTIVE ACTIONABLE ALERTS:")
        for a in alerts:
            lines.append(f"  🚨 {a}")
        lines.append("!" * 60)

    lines.append("\n--\nPetroFlow Automated Station Monitor")
    plain_text = "\n".join(lines)
    return plain_text, subject


def send_gmail_report(data, report_text=None, subject=None):
    """
    Sends the fuel station report using Gmail SMTP SSL.
    Credentials can be set via environment variables:
      GMAIL_SENDER = 'your.email@gmail.com'
      GMAIL_APP_PASSWORD = 'xxxx xxxx xxxx xxxx'
    """
    settings = data.get("settings", {})
    recipient = settings.get("managerEmail", "station.manager@petroflow.uz")
    supervisor = settings.get("supervisorEmail", "")

    sender_email = os.environ.get("GMAIL_SENDER")
    app_password = os.environ.get("GMAIL_APP_PASSWORD")

    if not report_text or not subject:
        report_text, subject = format_shift_report(data)

    if not sender_email or not app_password:
        print("\n[!] GMAIL SMTP CREDENTIALS NOT CONFIGURED IN ENVIRONMENT:")
        print("To send automated background emails directly via Python smtplib:")
        print("  1. Set environment variables:")
        print("     export GMAIL_SENDER='yourstation@gmail.com'")
        print("     export GMAIL_APP_PASSWORD='your-16-char-google-app-password'")
        print("  2. Re-run this script.")
        print("\n[i] Meanwhile, you can send this report instantly using the web interface:")
        print("    Click 'Open in Gmail Web (1-Click)' in the PetroFlow web dashboard!")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = recipient
    if supervisor:
        msg["Cc"] = supervisor

    msg.attach(MIMEText(report_text, "plain", "utf-8"))

    try:
        print(f"[...] Connecting to Gmail SMTP server ({GMAIL_SMTP_HOST}:{GMAIL_SMTP_PORT})...")
        with smtplib.SMTP_SSL(GMAIL_SMTP_HOST, GMAIL_SMTP_PORT) as server:
            server.login(sender_email, app_password)
            recipients = [recipient]
            if supervisor:
                recipients.append(supervisor)
            server.sendmail(sender_email, recipients, msg.as_string())
        print(f"[√] SUCCESS: Gmail shift report successfully sent to {recipient}!")
        return True
    except Exception as e:
        print(f"[!] Error sending email via Gmail SMTP: {e}")
        return False


if __name__ == "__main__":
    from fuel_station_manager import load_data
    station_data = load_data()
    txt, subj = format_shift_report(station_data)
    print("Subject:", subj)
    print(txt)

