/* eslint-disable @typescript-eslint/no-explicit-any */
export function ReportsSection(props: any) {
  const {
    branches,
    formatDate,
    formatMoney,
    loadReport,
    reportBranchId,
    reportDaily,
    reportDate,
    reportMonthly,
    reportWeekly,
    setReportBranchId,
    setReportDate,
  } = props;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-3">
        <input
          type="date"
          value={reportDate}
          onChange={(event) => setReportDate(event.target.value)}
          className="ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <select
          value={reportBranchId}
          onChange={(event) => setReportBranchId(event.target.value)}
          className="ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">Todas las sucursales</option>
          {branches.map((branch: any) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="ui-primary-btn rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
            onClick={() => void loadReport('daily')}
          >
            Diario
          </button>
          <button
            type="button"
            className="ui-primary-btn rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
            onClick={() => void loadReport('weekly')}
          >
            Semanal
          </button>
          <button
            type="button"
            className="ui-primary-btn rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950"
            onClick={() => void loadReport('monthly')}
          >
            Mensual
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[reportDaily, reportWeekly, reportMonthly].map((report, index) => {
          const label = index === 0 ? 'Diario' : index === 1 ? 'Semanal' : 'Mensual';
          return (
            <article
              key={label}
              className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5"
            >
              <h3 className="text-lg font-semibold">Reporte {label}</h3>
              {report ? (
                <div className="mt-3 space-y-1 text-sm">
                  <p>Inicio: {formatDate(report.periodStart)}</p>
                  <p>Fin: {formatDate(report.periodEnd)}</p>
                  <p>Ingresos: {formatMoney(report.incomeTotal)}</p>
                  <p>Salidas valorizadas: {formatMoney(report.outputTotal)}</p>
                  <p>Utilidad neta: {formatMoney(report.netTotal)}</p>
                  <p>Ventas: {report.salesCount}</p>
                  <p>Movimientos OUT: {report.movementsCount}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Aun no se cargo este periodo.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
