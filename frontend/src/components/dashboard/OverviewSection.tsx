import type { CSSProperties } from 'react';

import type { StockItem } from '../../lib/types';

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
    return 'conic-gradient(rgba(148,163,184,0.25) 0% 100%)';
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
  const branchPieStyle: CSSProperties = {
    background: buildPieGradient(branchPieSlices),
  };
  const productPieStyle: CSSProperties = {
    background: buildPieGradient(productPieSlices),
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Productos</p>
          <h3 className="mt-2 text-3xl font-bold">{totalProducts}</h3>
          <p className="text-xs text-slate-500">Productos visibles en el sistema.</p>
        </article>
        <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Registros de stock</p>
          <h3 className="mt-2 text-3xl font-bold">{totalStockItems}</h3>
          <p className="text-xs text-slate-500">Stock actual segun filtros de sucursal.</p>
        </article>
        <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Ventas del dia</p>
          <h3 className="mt-2 text-3xl font-bold">{formatMoney(totalSalesToday)}</h3>
          <p className="text-xs text-slate-500">{totalTicketsToday} tickets emitidos hoy.</p>
        </article>
        <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Ticket promedio</p>
          <h3 className="mt-2 text-3xl font-bold">{formatMoney(averageTicketToday)}</h3>
          <p className="text-xs text-slate-500">Unidades vendidas hoy: {unitsSoldToday}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Top productos vendidos (hoy)</h3>
            <span className="text-xs text-slate-400">Por cantidad</span>
          </div>
          {topProductsToday.length ? (
            <div className="mt-3 space-y-2">
              {topProductsToday.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2"
                >
                  <p className="truncate text-sm">
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-300">
                      {index + 1}
                    </span>
                    {item.name}
                  </p>
                  <p className="text-right text-sm font-semibold text-cyan-300">{item.quantity} u</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              Aun no hay ventas para calcular productos mas vendidos.
            </p>
          )}
        </article>

        <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-lg font-semibold">Ventas por sucursal</h3>
          <p className="text-xs text-slate-400">Distribucion de ingresos del dia</p>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="h-32 w-32 rounded-full border border-slate-700"
              style={branchPieStyle}
              aria-label="Grafico de torta de ventas por sucursal"
            />
            <div className="min-w-0 flex-1 space-y-1">
              {branchPieSlices.length ? (
                branchPieSlices.map((slice) => (
                  <div key={slice.label} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate text-slate-300">{slice.label}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Sin datos de ventas hoy.</p>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Sucursal lider: <span className="font-semibold text-cyan-300">{topBranchTodayName ?? 'N/A'}</span>
          </p>
        </article>

        <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-lg font-semibold">Mix de productos (hoy)</h3>
          <p className="text-xs text-slate-400">Participacion por unidades vendidas</p>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="h-32 w-32 rounded-full border border-slate-700"
              style={productPieStyle}
              aria-label="Grafico de torta de productos vendidos"
            />
            <div className="min-w-0 flex-1 space-y-1">
              {productPieSlices.length ? (
                productPieSlices.map((slice) => (
                  <div key={slice.label} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate text-slate-300">{slice.label}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Sin productos vendidos hoy.</p>
              )}
            </div>
          </div>
        </article>
      </div>

      <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-lg font-semibold">Alertas de stock bajo</h3>
        <p className="text-xs text-slate-400">Productos con 5 unidades o menos</p>
        {lowStockRows.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-2">Sucursal</th>
                  <th className="pb-2">Producto</th>
                  <th className="pb-2">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {lowStockRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-800">
                    <td className="py-2">{row.branchName}</td>
                    <td>{row.productName}</td>
                    <td className="font-semibold text-amber-300">{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No hay alertas de stock bajo con los datos actuales.</p>
        )}
      </article>
    </section>
  );
}
