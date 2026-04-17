/* eslint-disable @typescript-eslint/no-explicit-any */
export function InventorySection(props: any) {
  const {
    branches,
    buildUploadsUrl,
    canManage,
    formatDate,
    isOwner,
    loadMovements,
    loadStock,
    movementBranchId,
    movements,
    onAdjustStock,
    productPhotoById,
    setMovementBranchId,
    setStockAdjustForm,
    setStockBranchId,
    startStockAdjust,
    stock,
    stockAdjustForm,
    stockBranchId,
    withLoader,
  } = props;

  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {canManage ? (
              <select
                value={stockBranchId}
                onChange={(event) => setStockBranchId(event.target.value)}
                className="ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
              onClick={() => void withLoader(loadStock)}
            >
              Refrescar stock
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3">Foto</th>
                  <th className="pb-3">Sucursal</th>
                  <th className="pb-3">Producto</th>
                  <th className="pb-3">Marca</th>
                  <th className="pb-3">Cantidad</th>
                  {canManage ? <th className="pb-3">Accion</th> : null}
                </tr>
              </thead>
              <tbody>
                {stock.map((item: any) => (
                  <tr key={item.id} className="border-t border-slate-800">
                    <td className="py-3 pr-3">
                      {productPhotoById.get(item.productId) ? (
                        <img
                          src={buildUploadsUrl(productPhotoById.get(item.productId) ?? null)}
                          alt={item.productName}
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="grid h-11 w-11 place-items-center rounded-lg border border-slate-700 bg-slate-950 text-[10px] text-slate-500">
                          Sin foto
                        </div>
                      )}
                    </td>
                    <td className="py-3">{item.branchName}</td>
                    <td>{item.productName}</td>
                    <td>{item.brandName}</td>
                    <td>{item.quantity}</td>
                    {canManage ? (
                      <td>
                        <button
                          type="button"
                          className="rounded-lg border border-cyan-500/40 px-3 py-1 text-xs text-cyan-300 hover:bg-cyan-500/10"
                          onClick={() => startStockAdjust(item)}
                        >
                          Ajustar
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isOwner ? (
          <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <select
                value={movementBranchId}
                onChange={(event) => setMovementBranchId(event.target.value)}
                className="ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Movimientos globales</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                onClick={() => void withLoader(loadMovements)}
              >
                Ver movimientos
              </button>
            </div>
            <div className="max-h-80 overflow-auto rounded-xl border border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2">Cantidad</th>
                    <th className="px-3 py-2">Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement: any) => (
                    <tr key={movement.id} className="border-t border-slate-800">
                      <td className="px-3 py-2">{formatDate(movement.createdAt)}</td>
                      <td className="px-3 py-2">{movement.type}</td>
                      <td className="px-3 py-2">{movement.productName}</td>
                      <td className="px-3 py-2">{movement.quantity}</td>
                      <td className="px-3 py-2">{movement.refType ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {canManage ? (
        <div className="space-y-4">
          <form
            className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) => void onAdjustStock(event)}
          >
            <h3 className="text-lg font-semibold">Ajuste de stock (cantidad final)</h3>
            <p className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
              Define la cantidad final deseada. Si es menor al actual, descuenta.
              Si es mayor, incrementa stock.
            </p>
            <select
              value={stockAdjustForm.stockId}
              onChange={(event) => {
                const selected = stock.find((item: any) => item.id === event.target.value);
                if (!selected) {
                  return;
                }
                startStockAdjust(selected);
              }}
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona producto/sucursal</option>
              {stock.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.branchName} - {item.productName} (actual: {item.quantity})
                </option>
              ))}
            </select>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-400">
                  Stock actual (solo lectura)
                </span>
                <input
                  value={stockAdjustForm.currentQuantity}
                  readOnly
                  placeholder="Stock actual"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-400">
                  Cantidad final deseada
                </span>
                <input
                  value={stockAdjustForm.targetQuantity}
                  onChange={(event) =>
                    setStockAdjustForm((prev: any) => ({
                      ...prev,
                      targetQuantity: event.target.value,
                    }))
                  }
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="Ejemplo: 50"
                  className="ui-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                />
              </label>
            </div>
            <input
              value={stockAdjustForm.unitPrice}
              onChange={(event) =>
                setStockAdjustForm((prev: any) => ({
                  ...prev,
                  unitPrice: event.target.value,
                }))
              }
              type="number"
              step="0.01"
              min="0"
              placeholder="Costo/precio unitario (opcional)"
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <textarea
              value={stockAdjustForm.notes}
              onChange={(event) =>
                setStockAdjustForm((prev: any) => ({
                  ...prev,
                  notes: event.target.value,
                }))
              }
              placeholder="Motivo del ajuste"
              className="h-20 w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Aplicar ajuste
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
