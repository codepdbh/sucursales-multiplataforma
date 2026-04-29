import type { Dispatch, SetStateAction } from 'react';

import type { Branch, LiquidationReport } from '../../../lib/types';
import { Badge, Field, Input, Panel, SectionTitle, Select } from '../ui';

interface ReportsSectionProps {
  branches: Branch[];
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  reportBranchId: string;
  reportDaily: LiquidationReport | null;
  reportDate: string;
  reportMonthly: LiquidationReport | null;
  reportWeekly: LiquidationReport | null;
  setReportBranchId: Dispatch<SetStateAction<string>>;
  setReportDate: Dispatch<SetStateAction<string>>;
}

interface ReportCardProps {
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  label: string;
  report: LiquidationReport | null;
}

function ReportCard({ formatDate, formatMoney, label, report }: ReportCardProps) {
  return (
    <Panel className="p-5">
      <SectionTitle
        actions={report ? <Badge tone={report.netTotal >= 0 ? 'green' : 'red'}>{formatMoney(report.netTotal)}</Badge> : null}
        eyebrow="Liquidacion"
        title={label}
      />
      {report ? (
        <div className="mt-4 grid gap-3 text-sm">
          <div className="rounded-lg bg-[color:var(--surface-muted)] p-3">
            <p className="font-bold text-[color:var(--text-strong)]">
              {formatDate(report.periodStart)} / {formatDate(report.periodEnd)}
            </p>
          </div>
          <dl className="grid gap-2">
            <div className="flex justify-between">
              <dt>Ingresos</dt>
              <dd className="font-bold">{formatMoney(report.incomeTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Salidas valorizadas</dt>
              <dd className="font-bold">{formatMoney(report.outputTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Ventas</dt>
              <dd className="font-bold">{report.salesCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Movimientos OUT</dt>
              <dd className="font-bold">{report.movementsCount}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
          Sin reporte cargado.
        </p>
      )}
    </Panel>
  );
}

export function ReportsSection({
  branches,
  formatDate,
  formatMoney,
  reportBranchId,
  reportDaily,
  reportDate,
  reportMonthly,
  reportWeekly,
  setReportBranchId,
  setReportDate,
}: ReportsSectionProps) {
  return (
    <section className="space-y-5">
      <Panel className="p-5">
        <SectionTitle eyebrow="Reportes" title="Liquidaciones" />
        <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,260px)] lg:items-end">
          <Field label="Fecha">
            <Input
              onChange={(event) => setReportDate(event.target.value)}
              type="date"
              value={reportDate}
            />
          </Field>
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
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <ReportCard
          formatDate={formatDate}
          formatMoney={formatMoney}
          label="Diario"
          report={reportDaily}
        />
        <ReportCard
          formatDate={formatDate}
          formatMoney={formatMoney}
          label="Semanal"
          report={reportWeekly}
        />
        <ReportCard
          formatDate={formatDate}
          formatMoney={formatMoney}
          label="Mensual"
          report={reportMonthly}
        />
      </div>
    </section>
  );
}
