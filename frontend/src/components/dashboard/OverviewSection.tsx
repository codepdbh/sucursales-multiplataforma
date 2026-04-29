import type { CSSProperties, ReactNode } from 'react';
import { AlertTriangle, Boxes, ReceiptText, ShoppingBag, WalletCards } from 'lucide-react';

import type { StockItem } from '../../lib/types';
import { Badge, DataTable, EmptyState, Panel, SectionTitle } from './ui';

export interface OverviewPieSlice {
  label: string;
  value: number;
  color: string;
}

interface TopProductItem {
  income: number;
  name: string;
  quantity: number;
}

interface OverviewSectionProps {
  averageTicketToday: number;
  branchPieSlices: OverviewPieSlice[];
  formatMoney: (value: number) => string;
  lowStockRows: StockItem[];
  productPieSlices: OverviewPieSlice[];
  topBranchTodayName?: string;
  topProductsToday: TopProductItem[];
  totalProducts: number;
  totalSalesToday: number;
  totalStockItems: number;
  totalTicketsToday: number;
  unitsSoldToday: number;
}

function buildPieGradient(slices: OverviewPieSlice[]): string {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (!total) {
    return 'conic-gradient(var(--surface-strong) 0% 100%)';
  }

  let current = 0;
  const ranges = slices.map((slice) => {
    const start = (current / total) * 100;
    current += slice.value;
    const end = (current / total) * 100;
    return `${slice.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${ranges.join(',')})`;
}

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  meta: string;
  value: string;
}

function MetricCard({ icon, label, meta, value }: MetricCardProps) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[color:var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-[color:var(--text-strong)]">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold text-[color:var(--text-muted)]">{meta}</p>
    </Panel>
  );
}

function DonutChart({ slices }: { slices: OverviewPieSlice[] }) {
  const style: CSSProperties = {
    background: buildPieGradient(slices),
  };

  return (
    <div className="flex items-center gap-4">
      <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full" style={style}>
        <div className="h-16 w-16 rounded-full bg-[color:var(--surface)]" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {slices.length ? (
          slices.map((slice) => (
            <div className="flex items-center gap-2 text-xs font-semibold" key={slice.label}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="truncate text-[color:var(--text)]">{slice.label}</span>
              <span className="ml-auto text-[color:var(--text-muted)]">{slice.value}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[color:var(--text-muted)]">Sin datos</p>
        )}
      </div>
    </div>
  );
}

export function OverviewSection({
  averageTicketToday,
  branchPieSlices,
  formatMoney,
  lowStockRows,
  productPieSlices,
  topBranchTodayName,
  topProductsToday,
  totalProducts,
  totalSalesToday,
  totalStockItems,
  totalTicketsToday,
  unitsSoldToday,
}: OverviewSectionProps) {
  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Productos"
          meta="Catalogo visible"
          value={String(totalProducts)}
        />
        <MetricCard
          icon={<Boxes className="h-5 w-5" />}
          label="Registros de stock"
          meta="Segun filtros activos"
          value={String(totalStockItems)}
        />
        <MetricCard
          icon={<WalletCards className="h-5 w-5" />}
          label="Ventas del dia"
          meta={`${totalTicketsToday} tickets`}
          value={formatMoney(totalSalesToday)}
        />
        <MetricCard
          icon={<ReceiptText className="h-5 w-5" />}
          label="Ticket promedio"
          meta={`${unitsSoldToday} unidades vendidas`}
          value={formatMoney(averageTicketToday)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.95fr_0.95fr]">
        <Panel className="p-5">
          <SectionTitle eyebrow="Ventas" title="Productos con mas movimiento" />
          {topProductsToday.length ? (
            <div className="mt-4 space-y-2">
              {topProductsToday.map((item, index) => (
                <div
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2"
                  key={item.name}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--surface)] text-xs font-extrabold text-[color:var(--brand-strong)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[color:var(--text-strong)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[color:var(--text-muted)]">
                      {formatMoney(item.income)}
                    </p>
                  </div>
                  <Badge tone="blue">{item.quantity} u</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState>No hay ventas registradas para el dia.</EmptyState>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <SectionTitle eyebrow="Sucursales" title="Ingresos del dia" />
          <div className="mt-4">
            <DonutChart slices={branchPieSlices} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-[color:var(--surface-muted)] px-3 py-2">
            <span className="text-sm font-bold text-[color:var(--text-muted)]">Lider</span>
            <span className="text-sm font-extrabold text-[color:var(--text-strong)]">
              {topBranchTodayName ?? 'N/A'}
            </span>
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle eyebrow="Mix" title="Unidades por producto" />
          <div className="mt-4">
            <DonutChart slices={productPieSlices} />
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionTitle
          actions={<Badge tone={lowStockRows.length ? 'amber' : 'green'}>{lowStockRows.length}</Badge>}
          eyebrow="Inventario"
          title="Alertas de stock bajo"
        />
        {lowStockRows.length ? (
          <div className="mt-4">
            <DataTable>
              <thead>
                <tr>
                  <th>Sucursal</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {lowStockRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.branchName}</td>
                    <td className="font-bold text-[color:var(--text-strong)]">{row.productName}</td>
                    <td>
                      <Badge tone="amber">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {row.quantity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState>Sin alertas con los datos actuales.</EmptyState>
          </div>
        )}
      </Panel>
    </section>
  );
}
