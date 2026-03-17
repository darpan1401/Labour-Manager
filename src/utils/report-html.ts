import { WorkerReport } from "./labour";

export function buildWorkerReportHtml(report: WorkerReport) {
  const rowsHtml = report.rows
    .map((row, index) => {
      const toneClass = getToneClass(row.statusTone);
      const rowClass = index % 2 === 0 ? "row-even" : "row-odd";

      return `
        <div class="table-row ${rowClass}">
          <div class="cell date-column">${escapeHtml(row.dateLabel)}</div>
          <div class="cell day-column">${escapeHtml(row.dayLabel)}</div>
          <div class="cell status-column">
            <span class="status-badge ${toneClass}">${escapeHtml(row.statusLabel)}</span>
          </div>
          <div class="cell money-column">Rs ${row.advance}</div>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #e2e8f0;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            padding: 28px;
          }

          .page {
            width: 100%;
            max-width: 1120px;
            margin: 0 auto;
            background: #f8fafc;
            padding: 32px;
            border-radius: 28px;
          }

          .hero {
            border-radius: 28px;
            padding: 30px 28px;
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
          }

          .eyebrow {
            color: #fbbf24;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }

          .title {
            margin-top: 14px;
            color: #ffffff;
            font-size: 44px;
            font-weight: 800;
          }

          .subtitle {
            margin-top: 10px;
            color: #cbd5e1;
            font-size: 24px;
          }

          .hero-meta {
            margin-top: 28px;
            font-size: 0;
          }

          .meta-card {
            display: inline-block;
            vertical-align: top;
            width: calc(50% - 8px);
            margin-right: 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 18px;
            border: 1px solid rgba(255, 255, 255, 0.12);
          }

          .meta-card:last-child {
            margin-right: 0;
          }

          .meta-label {
            color: #bfdbfe;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
          }

          .meta-value {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin-top: 8px;
          }

          .summary-row {
            margin-top: 24px;
            font-size: 0;
          }

          .summary-card {
            display: inline-block;
            vertical-align: top;
            width: calc(50% - 8px);
            margin-right: 16px;
            background: #ffffff;
            border-radius: 24px;
            padding: 22px 24px;
            border: 1px solid #e2e8f0;
          }

          .summary-card:last-child {
            margin-right: 0;
          }

          .summary-label {
            color: #475569;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
          }

          .summary-value {
            color: #0f172a;
            font-size: 34px;
            font-weight: 800;
            margin-top: 10px;
          }

          .table {
            margin-top: 24px;
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid #dbe3ef;
          }

          .table-header,
          .table-row {
            font-size: 0;
          }

          .table-header {
            background: #dbeafe;
            padding: 18px 20px;
          }

          .table-row {
            padding: 16px 20px;
            min-height: 68px;
          }

          .row-even {
            background: #ffffff;
          }

          .row-odd {
            background: #f8fafc;
          }

          .header-text,
          .cell {
            display: inline-block;
            vertical-align: middle;
          }

          .header-text {
            color: #1e3a8a;
            font-size: 18px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .cell {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
          }

          .date-column {
            width: 180px;
          }

          .day-column {
            width: 120px;
          }

          .status-column {
            width: calc(100% - 470px);
            padding-right: 16px;
          }

          .money-column {
            width: 170px;
            text-align: right;
          }

          .status-badge {
            display: inline-block;
            border-radius: 999px;
            border: 1px solid transparent;
            padding: 8px 14px;
            color: #0f172a;
            font-size: 16px;
            font-weight: 700;
          }

          .tone-success {
            background: #dcfce7;
            border-color: #86efac;
          }

          .tone-danger {
            background: #fee2e2;
            border-color: #fca5a5;
          }

          .tone-accent {
            background: #fef3c7;
            border-color: #fcd34d;
          }

          .tone-muted {
            background: #e2e8f0;
            border-color: #cbd5e1;
          }

          .footer {
            margin-top: 20px;
            color: #475569;
            font-size: 16px;
            line-height: 24px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="hero">
            <div class="eyebrow">Bhimijyani Painting Contractors</div>
            <div class="title">Monthly Labour Report</div>
            <div class="subtitle">${escapeHtml(report.monthLabel)}</div>

            <div class="hero-meta">
              <div class="meta-card">
                <div class="meta-label">Worker</div>
                <div class="meta-value">${escapeHtml(report.labourName)}</div>
              </div>

              <div class="meta-card">
                <div class="meta-label">Generated</div>
                <div class="meta-value">${escapeHtml(report.generatedAtLabel)}</div>
              </div>
            </div>
          </div>

          <div class="summary-row">
            <div class="summary-card">
              <div class="summary-label">Total Days</div>
              <div class="summary-value">${escapeHtml(String(report.totalDays % 1 === 0 ? report.totalDays : report.totalDays.toFixed(1)))}</div>
            </div>

            <div class="summary-card">
              <div class="summary-label">Advance</div>
              <div class="summary-value">Rs ${report.totalAdvance}</div>
            </div>
          </div>

          <div class="table">
            <div class="table-header">
              <div class="header-text date-column">Date</div>
              <div class="header-text day-column">Day</div>
              <div class="header-text status-column">Status</div>
              <div class="header-text money-column">Advance</div>
            </div>

            ${rowsHtml}
          </div>

          <div class="footer">
            All rights reserved to Bhimijyani Painting Contractors.
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getWorkerReportFingerprint(report: WorkerReport) {
  return JSON.stringify({
    labourName: report.labourName,
    monthLabel: report.monthLabel,
    totalDays: report.totalDays,
    totalAdvance: report.totalAdvance,
    rows: report.rows.map((row) => ({
      dateLabel: row.dateLabel,
      dayLabel: row.dayLabel,
      statusLabel: row.statusLabel,
      statusTone: row.statusTone,
      advance: row.advance,
      units: row.units,
    })),
  });
}

function getToneClass(tone: WorkerReport["rows"][number]["statusTone"]) {
  if (tone === "danger") {
    return "tone-danger";
  }

  if (tone === "accent") {
    return "tone-accent";
  }

  if (tone === "muted") {
    return "tone-muted";
  }

  return "tone-success";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
