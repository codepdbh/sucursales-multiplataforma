import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';

import type { Branch, LiquidationReport, LiquidationSaleDetail } from '../../../lib/types';
import { Badge, Button, DataTable, EmptyState, Field, Input, Panel, SectionTitle, Select } from '../ui';

interface ReportsSectionProps {
  branches: Branch[];
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  reportBranchId: string;
  reportAnnual: LiquidationReport | null;
  reportDaily: LiquidationReport | null;
  reportDate: string;
  reportMonthly: LiquidationReport | null;
  reportRange: LiquidationReport | null;
  reportRangeEndDate: string;
  reportRangeStartDate: string;
  reportWeekly: LiquidationReport | null;
  setReportBranchId: Dispatch<SetStateAction<string>>;
  setReportDate: Dispatch<SetStateAction<string>>;
  setReportRangeEndDate: Dispatch<SetStateAction<string>>;
  setReportRangeStartDate: Dispatch<SetStateAction<string>>;
}

interface DailySalesDetailsProps {
  branchName: string;
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  filenameDate: string;
  periodDisplay: string;
  periodLabel: string;
  report: LiquidationReport | null;
  showBranchColumn: boolean;
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'annual' | 'range';

const REPORT_OPTIONS: { label: string; value: ReportPeriod }[] = [
  { label: 'diario', value: 'daily' },
  { label: 'semanal', value: 'weekly' },
  { label: 'mensual', value: 'monthly' },
  { label: 'anual', value: 'annual' },
  { label: 'rango', value: 'range' },
];

const PDF_PAGE_WIDTH = 842;
const PDF_PAGE_HEIGHT = 595;
const PDF_MARGIN = 36;
const PDF_ROW_HEIGHT = 18;

interface ReportTableColumn {
  label: string;
  maxChars: number;
  width: number;
}

function getReportColumns(showBranchColumn: boolean): ReportTableColumn[] {
  if (showBranchColumn) {
    return [
      { label: 'Fecha', width: 125, maxChars: 22 },
      { label: 'Sucursal', width: 135, maxChars: 23 },
      { label: 'Producto', width: 190, maxChars: 34 },
      { label: 'Cantidad', width: 65, maxChars: 9 },
      { label: 'Precio unitario', width: 90, maxChars: 14 },
      { label: 'Precio total', width: 90, maxChars: 14 },
      { label: 'Usuario', width: 75, maxChars: 13 },
    ];
  }

  return [
    { label: 'Fecha', width: 145, maxChars: 23 },
    { label: 'Producto', width: 245, maxChars: 43 },
    { label: 'Cantidad', width: 65, maxChars: 9 },
    { label: 'Precio unitario', width: 105, maxChars: 16 },
    { label: 'Precio total', width: 105, maxChars: 16 },
    { label: 'Usuario', width: 105, maxChars: 18 },
  ];
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDateInput(value: string): string {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'short',
  }).format(new Date(year, month - 1, day));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePdfText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '');
}

function escapePdfText(value: string): string {
  return normalizePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(maxChars - 1, 0))}.`;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'reporte';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getReportFilename(
  branchName: string,
  periodLabel: string,
  reportDate: string,
  extension: 'pdf' | 'xls',
): string {
  return `reporte-ventas-${slugify(periodLabel)}-${slugify(branchName)}-${reportDate}.${extension}`;
}

function buildSalesRows(
  details: LiquidationSaleDetail[],
  formatDate: (value: string) => string,
  formatMoney: (value: number) => string,
  showBranchColumn: boolean,
): string[][] {
  return details.map((detail) => {
    const row = [formatDate(detail.createdAt)];

    if (showBranchColumn) {
      row.push(detail.branchName);
    }

    row.push(
      detail.productName,
      formatQuantity(detail.quantity),
      formatMoney(detail.unitPrice),
      formatMoney(detail.lineTotal),
      detail.username,
    );

    return row;
  });
}

function buildExcelBlob(
  report: LiquidationReport,
  branchName: string,
  periodLabel: string,
  periodDisplay: string,
  formatDate: (value: string) => string,
  formatMoney: (value: number) => string,
  showBranchColumn: boolean,
): Blob {
  const columns = getReportColumns(showBranchColumn);
  const headers = columns.map((column) => column.label);
  const rows = buildSalesRows(report.salesDetails, formatDate, formatMoney, showBranchColumn);
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('');
  const headerRow = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #3f72c3; color: #ffffff; }
    th, td { border: 1px solid #9fb4d8; padding: 6px 8px; }
  </style>
</head>
<body>
  <h2>Reporte ${escapeHtml(periodLabel)} de ventas</h2>
  <p>${escapeHtml(branchName)} / ${escapeHtml(periodDisplay)}</p>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

  return new Blob(['\ufeff', html], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
}

function pdfText(x: number, y: number, size: number, value: string): string {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET\n`;
}

function buildPdfContentPage(
  rows: string[][],
  columns: ReportTableColumn[],
  pageIndex: number,
  totalPages: number,
  branchName: string,
  periodLabel: string,
  periodDisplay: string,
): string {
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const headerTop = PDF_PAGE_HEIGHT - 108;
  const headerHeight = 20;
  const firstRowY = headerTop - 18;
  let content = '';

  content += '0.08 0.12 0.20 rg\n';
  content += pdfText(PDF_MARGIN, PDF_PAGE_HEIGHT - 42, 18, `Reporte ${periodLabel} de ventas`);
  content += '0.28 0.34 0.43 rg\n';
  content += pdfText(
    PDF_MARGIN,
    PDF_PAGE_HEIGHT - 62,
    9,
    `${branchName} / ${periodDisplay}`,
  );
  content += pdfText(PDF_PAGE_WIDTH - 90, PDF_PAGE_HEIGHT - 42, 8, `Pagina ${pageIndex + 1}/${totalPages}`);

  content += '0.25 0.45 0.76 rg\n';
  content += `${PDF_MARGIN} ${headerTop - 5} ${tableWidth} ${headerHeight} re f\n`;
  content += '1 1 1 rg\n';

  let x = PDF_MARGIN;
  columns.forEach((column) => {
    content += pdfText(x + 4, headerTop + 1, 9, column.label);
    x += column.width;
  });

  rows.forEach((row, rowIndex) => {
    const y = firstRowY - rowIndex * PDF_ROW_HEIGHT;
    if (rowIndex % 2 === 0) {
      content += '0.93 0.95 0.99 rg\n';
      content += `${PDF_MARGIN} ${y - 5} ${tableWidth} ${PDF_ROW_HEIGHT} re f\n`;
    }

    content += '0.08 0.12 0.20 rg\n';
    let cellX = PDF_MARGIN;
    row.forEach((cell, cellIndex) => {
      content += pdfText(
        cellX + 4,
        y,
        8,
        truncateText(cell, columns[cellIndex].maxChars),
      );
      cellX += columns[cellIndex].width;
    });
  });

  return content;
}

function buildPdfBlob(
  report: LiquidationReport,
  branchName: string,
  periodLabel: string,
  periodDisplay: string,
  formatDate: (value: string) => string,
  formatMoney: (value: number) => string,
  showBranchColumn: boolean,
): Blob {
  const columns = getReportColumns(showBranchColumn);
  const rows = buildSalesRows(report.salesDetails, formatDate, formatMoney, showBranchColumn);
  const rowsPerPage = 24;
  const pages = rows.length
    ? Array.from({ length: Math.ceil(rows.length / rowsPerPage) }, (_, index) =>
        rows.slice(index * rowsPerPage, (index + 1) * rowsPerPage),
      )
    : [[]];
  const objects = [
    '',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const pageObjectIds: number[] = [];
  const encoder = new TextEncoder();

  pages.forEach((pageRows, pageIndex) => {
    const stream = buildPdfContentPage(
      pageRows,
      columns,
      pageIndex,
      pages.length,
      branchName,
      periodLabel,
      periodDisplay,
    );
    const contentObjectId = objects.push(
      `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`,
    );
    const pageObjectId = objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    );
    pageObjectIds.push(pageObjectId);
  });

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] /Count ${pageObjectIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += `${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function DailySalesDetails({
  branchName,
  formatDate,
  formatMoney,
  filenameDate,
  periodDisplay,
  periodLabel,
  report,
  showBranchColumn,
}: DailySalesDetailsProps) {
  const details = report?.salesDetails ?? [];
  const hasDetails = details.length > 0;

  function downloadExcel(): void {
    if (!report) {
      return;
    }

    downloadBlob(
      buildExcelBlob(
        report,
        branchName,
        periodLabel,
        periodDisplay,
        formatDate,
        formatMoney,
        showBranchColumn,
      ),
      getReportFilename(branchName, periodLabel, filenameDate, 'xls'),
    );
  }

  function downloadPdf(): void {
    if (!report) {
      return;
    }

    downloadBlob(
      buildPdfBlob(
        report,
        branchName,
        periodLabel,
        periodDisplay,
        formatDate,
        formatMoney,
        showBranchColumn,
      ),
      getReportFilename(branchName, periodLabel, filenameDate, 'pdf'),
    );
  }

  return (
    <Panel className="p-5">
      <SectionTitle
        actions={
          <>
            <Button disabled={!hasDetails} icon={<FileText />} onClick={downloadPdf}>
              PDF
            </Button>
            <Button disabled={!hasDetails} icon={<FileSpreadsheet />} onClick={downloadExcel}>
              Excel
            </Button>
          </>
        }
        eyebrow="Ventas"
        title={`Detalle ${periodLabel}`}
      />

      {report ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="blue">{report.salesCount} ventas</Badge>
          <Badge tone={report.netTotal >= 0 ? 'green' : 'red'}>
            Total {formatMoney(report.incomeTotal)}
          </Badge>
          <Badge tone="neutral">
            {periodDisplay}
          </Badge>
        </div>
      ) : null}

      <div className="report-sheet mt-4">
        {hasDetails ? (
          <DataTable>
            <thead>
              <tr>
                <th>Fecha</th>
                {showBranchColumn ? <th>Sucursal</th> : null}
                <th>Producto</th>
                <th className="report-number-cell">Cantidad</th>
                <th className="report-number-cell">Precio unitario</th>
                <th className="report-number-cell">Precio total</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {details.map((detail) => (
                <tr key={detail.saleItemId}>
                  <td>{formatDate(detail.createdAt)}</td>
                  {showBranchColumn ? (
                    <td className="font-semibold text-[color:var(--text)]">
                      {detail.branchName}
                    </td>
                  ) : null}
                  <td className="font-bold text-[color:var(--text-strong)]">
                    {detail.productName}
                  </td>
                  <td className="report-number-cell">{formatQuantity(detail.quantity)}</td>
                  <td className="report-number-cell report-money-cell">
                    {formatMoney(detail.unitPrice)}
                  </td>
                  <td className="report-number-cell report-money-cell">
                    {formatMoney(detail.lineTotal)}
                  </td>
                  <td>{detail.username}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState>No hay ventas registradas para el reporte {periodLabel}.</EmptyState>
        )}
      </div>
    </Panel>
  );
}

export function ReportsSection({
  branches,
  formatDate,
  formatMoney,
  reportBranchId,
  reportAnnual,
  reportDaily,
  reportDate,
  reportMonthly,
  reportRange,
  reportRangeEndDate,
  reportRangeStartDate,
  reportWeekly,
  setReportBranchId,
  setReportDate,
  setReportRangeEndDate,
  setReportRangeStartDate,
}: ReportsSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('daily');
  const selectedBranchName =
    branches.find((branch) => branch.id === reportBranchId)?.name ?? 'Todas las sucursales';
  const selectedPeriodLabel =
    REPORT_OPTIONS.find((option) => option.value === selectedPeriod)?.label ?? 'diario';
  const selectedReportByPeriod: Record<ReportPeriod, LiquidationReport | null> = {
    annual: reportAnnual,
    daily: reportDaily,
    monthly: reportMonthly,
    range: reportRange,
    weekly: reportWeekly,
  };
  const selectedReport = selectedReportByPeriod[selectedPeriod];
  const showBranchColumn = !reportBranchId;
  const selectedPeriodDisplay =
    selectedPeriod === 'range'
      ? `${formatDateInput(reportRangeStartDate)} / ${formatDateInput(reportRangeEndDate)}`
      : selectedReport
        ? `${formatDate(selectedReport.periodStart)} / ${formatDate(selectedReport.periodEnd)}`
        : '';
  const selectedFilenameDate =
    selectedPeriod === 'range'
      ? `${reportRangeStartDate}-a-${reportRangeEndDate}`
      : reportDate;
  const filtersGridClass =
    selectedPeriod === 'range'
      ? 'mt-4 grid gap-3 lg:grid-cols-[180px_180px_minmax(0,260px)_180px] lg:items-end'
      : 'mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,260px)_180px] lg:items-end';

  function updateRangeStartDate(value: string): void {
    setReportRangeStartDate(value);

    if (value && reportRangeEndDate && value > reportRangeEndDate) {
      setReportRangeEndDate(value);
    }
  }

  function updateRangeEndDate(value: string): void {
    setReportRangeEndDate(value);

    if (value && reportRangeStartDate && value < reportRangeStartDate) {
      setReportRangeStartDate(value);
    }
  }

  return (
    <section className="space-y-5">
      <Panel className="p-5">
        <SectionTitle eyebrow="Reportes" title="Liquidaciones" />
        <div className={filtersGridClass}>
          {selectedPeriod === 'range' ? (
            <>
              <Field label="Desde">
                <Input
                  max={reportRangeEndDate || undefined}
                  onChange={(event) => updateRangeStartDate(event.target.value)}
                  type="date"
                  value={reportRangeStartDate}
                />
              </Field>
              <Field label="Hasta">
                <Input
                  min={reportRangeStartDate || undefined}
                  onChange={(event) => updateRangeEndDate(event.target.value)}
                  type="date"
                  value={reportRangeEndDate}
                />
              </Field>
            </>
          ) : (
            <Field label="Fecha base">
              <Input
                onChange={(event) => setReportDate(event.target.value)}
                type="date"
                value={reportDate}
              />
            </Field>
          )}
          <Field label="Sucursal">
            <Select onChange={(event) => setReportBranchId(event.target.value)} value={reportBranchId}>
              <option value="">Todas</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Periodo">
            <Select
              onChange={(event) => setSelectedPeriod(event.target.value as ReportPeriod)}
              value={selectedPeriod}
            >
              {REPORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>

      <DailySalesDetails
        branchName={selectedBranchName}
        filenameDate={selectedFilenameDate}
        formatDate={formatDate}
        formatMoney={formatMoney}
        periodDisplay={selectedPeriodDisplay}
        periodLabel={selectedPeriodLabel}
        report={selectedReport}
        showBranchColumn={showBranchColumn}
      />
    </section>
  );
}
