/* eslint-disable @typescript-eslint/no-explicit-any */
export function SalesSection(props: any) {
  const {
    addProductToSale,
    apiRequest,
    branches,
    buildUploadsUrl,
    canManage,
    enableEditForm,
    formatDate,
    formatMoney,
    getAvailableStockInfo,
    isOwner,
    lastEditControl,
    loadSalesToday,
    onCreateSale,
    onEnableEditWindow,
    onFindSaleById,
    onPatchSale,
    removeSaleItem,
    resolveLookupCandidate,
    saleDetailId,
    saleDiscountPreview,
    saleForm,
    saleLookup,
    salePatchForm,
    saleSearchLoading,
    saleSearchMode,
    saleSearchResults,
    saleSubtotalPreview,
    saleTotalPreview,
    salesBranchId,
    salesToday,
    selectedSale,
    setEnableEditForm,
    setSaleDetailId,
    setSaleForm,
    setSaleLookup,
    setSalePatchForm,
    setSaleSearchMode,
    setSaleSearchResults,
    setSalesBranchId,
    setSelectedSale,
    updateSaleItem,
    withLoader,
  } = props;

  return (
    <section className={`grid gap-4 ${canManage ? 'xl:grid-cols-[1.3fr_1fr]' : ''}`}>
      <div className="space-y-4">
        <form
          className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
          onSubmit={(event) => void onCreateSale(event)}
        >
          <h3 className="text-lg font-semibold">Registrar venta</h3>
          {canManage ? (
            <select
              value={saleForm.branchId}
              onChange={(event) =>
                setSaleForm((prev: any) => ({ ...prev, branchId: event.target.value }))
              }
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            >
              <option value="">Sucursal</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-slate-400">
              Sucursal forzada por token: {props.auth?.user?.branch?.name ?? 'N/A'}
            </p>
          )}
          <div className="space-y-3 rounded-2xl border border-slate-700 p-3">
            <label className="text-sm font-medium text-slate-300">
              Buscar producto por ID, codigo de barras o nombre
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'ALL', label: 'Todos' },
                { value: 'NAME', label: 'Nombre' },
                { value: 'BARCODE', label: 'Codigo de barras' },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    saleSearchMode === mode.value
                      ? 'bg-cyan-500 text-slate-950'
                      : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                  onClick={() => setSaleSearchMode(mode.value as 'ALL' | 'NAME' | 'BARCODE')}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <input
              value={saleLookup}
              onChange={(event) => setSaleLookup(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') {
                  return;
                }

                event.preventDefault();
                const candidate = resolveLookupCandidate(saleLookup, saleSearchResults);
                if (candidate) {
                  addProductToSale(candidate);
                  setSaleLookup('');
                  setSaleSearchResults([]);
                }
              }}
              placeholder={
                saleSearchMode === 'NAME'
                  ? 'Buscar por nombre...'
                  : saleSearchMode === 'BARCODE'
                    ? 'Buscar por codigo de barras...'
                    : 'Buscar por nombre o codigo de barras...'
              }
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            {saleSearchLoading ? <p className="text-xs text-slate-400">Buscando productos...</p> : null}
            {saleSearchResults.length ? (
              <div className="grid gap-2">
                {saleSearchResults.slice(0, 6).map((product: any) => {
                  const stockInfo = getAvailableStockInfo(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-2 text-left hover:bg-slate-800"
                      onClick={() => {
                        addProductToSale(product);
                        setSaleLookup('');
                        setSaleSearchResults([]);
                      }}
                    >
                      <img
                        src={buildUploadsUrl(product.photoUrl)}
                        alt={product.name}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {product.brand.name} â€¢ {product.barcode ?? 'Sin barcode'}
                        </p>
                        <p
                          className={`truncate text-xs ${
                            stockInfo.currentBranchStock > 0 ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          Stock en sucursal: {stockInfo.currentBranchStock}
                          {stockInfo.otherBranchesStock > 0
                            ? ` (otras sucursales: ${stockInfo.otherBranchesStock})`
                            : ''}
                        </p>
                        {stockInfo.currentBranchStock <= 0 && stockInfo.otherBranchesStock > 0 ? (
                          <span className="mt-1 inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            Disponible en otra sucursal
                          </span>
                        ) : null}
                      </div>
                      <span className="ml-auto text-sm font-semibold text-cyan-300">
                        {formatMoney(product.defaultPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300">Lista de venta</h4>
            {saleForm.items.length ? (
              saleForm.items.map((item: any, index: number) => {
                const stockInfo = getAvailableStockInfo(item.productId);
                return (
                  <div
                    key={`${item.productId}-${index}`}
                    className="grid gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3 md:grid-cols-[64px_1fr_auto]"
                  >
                    <img
                      src={buildUploadsUrl(item.photoUrl)}
                      alt={item.productName}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.productName}</p>
                      <p className="truncate text-xs text-slate-400">Barcode: {item.barcode ?? 'N/A'}</p>
                      <p
                        className={`truncate text-xs ${
                          stockInfo.currentBranchStock > 0 ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        Stock en sucursal: {stockInfo.currentBranchStock}
                        {stockInfo.otherBranchesStock > 0
                          ? ` (otras sucursales: ${stockInfo.otherBranchesStock})`
                          : ''}
                      </p>
                      {stockInfo.currentBranchStock <= 0 && stockInfo.otherBranchesStock > 0 ? (
                        <span className="mt-1 inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          Disponible en otra sucursal
                        </span>
                      ) : null}
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <input
                          value={item.quantity}
                          onChange={(event) =>
                            updateSaleItem(index, { quantity: event.target.value })
                          }
                          type="number"
                          step="1"
                          min="1"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Cantidad"
                          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                          required
                        />
                        <input
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateSaleItem(index, { unitPrice: event.target.value })
                          }
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Precio unitario"
                          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <p className="text-sm font-semibold text-cyan-300">
                        {formatMoney(
                          (Number(item.quantity || '0') || 0) * (Number(item.unitPrice || '0') || 0),
                        )}
                      </p>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                        onClick={() => removeSaleItem(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl border border-dashed border-slate-700 p-3 text-sm text-slate-400">
                Aun no agregaste productos. Usa el buscador o escanea un codigo.
              </p>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={saleForm.discount}
              onChange={(event) =>
                setSaleForm((prev: any) => ({ ...prev, discount: event.target.value }))
              }
              type="number"
              step="0.01"
              placeholder="Descuento"
              className="ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={saleForm.invoiceEnabled}
                onChange={(event) =>
                  setSaleForm((prev: any) => ({
                    ...prev,
                    invoiceEnabled: event.target.checked,
                  }))
                }
              />
              Factura habilitada
            </label>
          </div>
          <textarea
            value={saleForm.notes}
            onChange={(event) =>
              setSaleForm((prev: any) => ({ ...prev, notes: event.target.value }))
            }
            placeholder="Notas de la venta"
            className="h-20 w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(saleSubtotalPreview)}</span>
            </p>
            <p className="mt-1 flex justify-between">
              <span>Descuento</span>
              <span>{formatMoney(saleDiscountPreview)}</span>
            </p>
            <p className="mt-2 flex justify-between text-base font-semibold text-cyan-300">
              <span>Total</span>
              <span>{formatMoney(saleTotalPreview)}</span>
            </p>
          </div>
          <button
            type="submit"
            className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Confirmar venta
          </button>
        </form>

        {canManage ? (
          <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">Ventas de hoy</h3>
              <select
                value={salesBranchId}
                onChange={(event) => setSalesBranchId(event.target.value)}
                className="ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                onClick={() => void withLoader(loadSalesToday)}
              >
                Recargar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Sucursal</th>
                    <th className="pb-2">Usuario</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {salesToday.map((sale: any) => (
                    <tr key={sale.id} className="border-t border-slate-800">
                      <td className="py-2">{sale.id.slice(0, 8)}...</td>
                      <td>{sale.branchName}</td>
                      <td>{sale.username}</td>
                      <td>{formatMoney(sale.total)}</td>
                      <td>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
                          onClick={() =>
                            void withLoader(async () => {
                              const data = await apiRequest(`/sales/${sale.id}`);
                              setSelectedSale(data);
                            })
                          }
                        >
                          Ver
                        </button>
                      </td>
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
            onSubmit={(event) => void onFindSaleById(event)}
          >
            <h3 className="text-lg font-semibold">Buscar venta por ID</h3>
            <input
              value={saleDetailId}
              onChange={(event) => setSaleDetailId(event.target.value)}
              placeholder="ID de venta"
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Buscar
            </button>
          </form>

          <form
            className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) => void onPatchSale(event)}
          >
            <h3 className="text-lg font-semibold">Correccion de venta</h3>
            <input
              value={salePatchForm.saleId}
              onChange={(event) =>
                setSalePatchForm((prev: any) => ({ ...prev, saleId: event.target.value }))
              }
              placeholder="ID de venta"
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            />
            <textarea
              value={salePatchForm.notes}
              onChange={(event) =>
                setSalePatchForm((prev: any) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Notas"
              className="h-20 w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={salePatchForm.invoiceEnabled}
                onChange={(event) =>
                  setSalePatchForm((prev: any) => ({
                    ...prev,
                    invoiceEnabled: event.target.checked,
                  }))
                }
              />
              Factura habilitada
            </label>
            <button
              type="submit"
              className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Aplicar correccion
            </button>
          </form>

          {isOwner ? (
            <form
              className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
              onSubmit={(event) => void onEnableEditWindow(event)}
            >
              <h3 className="text-lg font-semibold">Habilitar ventana de correccion</h3>
              <select
                value={enableEditForm.branchId}
                onChange={(event) =>
                  setEnableEditForm((prev: any) => ({ ...prev, branchId: event.target.value }))
                }
                className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                required
              >
                <option value="">Sucursal</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <input
                value={enableEditForm.expiresAt}
                onChange={(event) =>
                  setEnableEditForm((prev: any) => ({ ...prev, expiresAt: event.target.value }))
                }
                type="datetime-local"
                className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Habilitar
              </button>
              {lastEditControl ? (
                <p className="text-xs text-slate-400">
                  Ultima ventana creada: {formatDate(lastEditControl.createdAt)} | Expira:{' '}
                  {lastEditControl.expiresAt
                    ? formatDate(lastEditControl.expiresAt)
                    : 'Sin expiracion'}
                </p>
              ) : null}
            </form>
          ) : null}

          {selectedSale ? (
            <article className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="text-lg font-semibold">Detalle de venta</h3>
              <p className="mt-2 text-sm text-slate-300">
                {selectedSale.id} | {selectedSale.branchName} | {formatDate(selectedSale.createdAt)}
              </p>
              <p className="text-sm text-slate-400">
                Total: {formatMoney(selectedSale.total)} | Subtotal:{' '}
                {formatMoney(selectedSale.subtotal)} | Descuento:{' '}
                {formatMoney(selectedSale.discount)}
              </p>
              <div className="mt-3 space-y-1 text-sm">
                {selectedSale.items.map((item: any) => (
                  <p key={item.id}>
                    {item.productName} - {item.quantity} x {formatMoney(item.unitPrice)} ={' '}
                    {formatMoney(item.total)}
                  </p>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
