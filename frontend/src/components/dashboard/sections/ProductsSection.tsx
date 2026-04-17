/* eslint-disable @typescript-eslint/no-explicit-any */
export function ProductsSection(props: any) {
  const {
    branches,
    buildUploadsUrl,
    canManage,
    csvBranchId,
    csvResult,
    editingProductId,
    formatMoney,
    loadProducts,
    onImportCsv,
    onProductSubmit,
    onUploadPhoto,
    photoUploadProductId,
    productActiveFilter,
    productForm,
    productSearch,
    productSiatFilter,
    products,
    setCsvBranchId,
    setCsvFile,
    setEditingProductId,
    setPhotoUploadFile,
    setPhotoUploadProductId,
    setProductActiveFilter,
    setProductForm,
    setProductSearch,
    setProductSiatFilter,
    startProductEdit,
    visibleProducts,
    withLoader,
  } = props;

  return (
    <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Buscar producto..."
              className="min-w-56 flex-1 ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            <select
              value={productSiatFilter}
              onChange={(event) =>
                setProductSiatFilter(event.target.value as 'ALL' | 'YES' | 'NO')
              }
              className="ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
            >
              <option value="ALL">SIAT: todos</option>
              <option value="YES">SIAT habilitado</option>
              <option value="NO">SIAT deshabilitado</option>
            </select>
            <select
              value={productActiveFilter}
              onChange={(event) =>
                setProductActiveFilter(event.target.value as 'ALL' | 'YES' | 'NO')
              }
              className="ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
            >
              <option value="ALL">Estado: todos</option>
              <option value="YES">Activos</option>
              <option value="NO">Inactivos</option>
            </select>
            <button
              type="button"
              className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
              onClick={() => void withLoader(loadProducts)}
            >
              Filtrar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3">Foto</th>
                  <th className="pb-3">Producto</th>
                  <th className="pb-3">Marca</th>
                  <th className="pb-3">Precio</th>
                  <th className="pb-3">SIAT</th>
                  <th className="pb-3">Activo</th>
                  <th className="pb-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product: any) => (
                  <tr key={product.id} className="border-t border-slate-800">
                    <td className="py-3 pr-3">
                      {product.photoUrl ? (
                        <img
                          src={buildUploadsUrl(product.photoUrl)}
                          alt={product.name}
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="grid h-11 w-11 place-items-center rounded-lg border border-slate-700 bg-slate-950 text-[10px] text-slate-500">
                          Sin foto
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-slate-500">
                        Barcode: {product.barcode ?? 'N/A'}
                      </p>
                    </td>
                    <td>{product.brand.name}</td>
                    <td>{formatMoney(product.defaultPrice)}</td>
                    <td>{product.siatEnabled ? 'Si' : 'No'}</td>
                    <td>{product.isActive ? 'Si' : 'No'}</td>
                    <td>
                      {canManage ? (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
                          onClick={() => startProductEdit(product)}
                        >
                          Editar
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {canManage ? (
        <div className="space-y-4">
          <form
            className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) => void onProductSubmit(event)}
          >
            <h3 className="text-lg font-semibold">
              {editingProductId ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <input
              value={productForm.brandName}
              onChange={(event) =>
                setProductForm((prev: any) => ({ ...prev, brandName: event.target.value }))
              }
              placeholder="Marca"
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
              required
            />
            <input
              value={productForm.name}
              onChange={(event) =>
                setProductForm((prev: any) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Nombre del producto"
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
              required
            />
            <input
              value={productForm.barcode}
              onChange={(event) =>
                setProductForm((prev: any) => ({ ...prev, barcode: event.target.value }))
              }
              placeholder="Codigo de barras (opcional)"
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
            />
            <input
              value={productForm.defaultPrice}
              onChange={(event) =>
                setProductForm((prev: any) => ({ ...prev, defaultPrice: event.target.value }))
              }
              placeholder="Precio"
              type="number"
              step="0.01"
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={productForm.requiresWeight}
                onChange={(event) =>
                  setProductForm((prev: any) => ({
                    ...prev,
                    requiresWeight: event.target.checked,
                  }))
                }
              />
              Requiere peso
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={productForm.siatEnabled}
                onChange={(event) =>
                  setProductForm((prev: any) => ({
                    ...prev,
                    siatEnabled: event.target.checked,
                  }))
                }
              />
              SIAT habilitado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={productForm.isActive}
                onChange={(event) =>
                  setProductForm((prev: any) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Producto activo
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                {editingProductId ? 'Guardar cambios' : 'Crear producto'}
              </button>
              {editingProductId ? (
                <button
                  type="button"
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm"
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm({
                      brandName: '',
                      name: '',
                      barcode: '',
                      defaultPrice: '',
                      requiresWeight: false,
                      siatEnabled: false,
                      isActive: true,
                    });
                  }}
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <form
            className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) => void onUploadPhoto(event)}
          >
            <h3 className="text-lg font-semibold">Subir foto de producto</h3>
            <select
              value={photoUploadProductId}
              onChange={(event) => setPhotoUploadProductId(event.target.value)}
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar producto</option>
              {visibleProducts.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhotoUploadFile(event.target.files?.[0] ?? null)}
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Subir
            </button>
          </form>

          <form
            className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
            onSubmit={(event) => void onImportCsv(event)}
          >
            <h3 className="text-lg font-semibold">Importar productos por CSV</h3>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            />
            {canManage ? (
              <select
                value={csvBranchId}
                onChange={(event) => setCsvBranchId(event.target.value)}
                className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecciona sucursal</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="submit"
              className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Importar CSV
            </button>
            {csvResult ? (
              <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm">
                <p>Productos nuevos: {csvResult.createdProducts}</p>
                <p>Productos actualizados: {csvResult.updatedProducts}</p>
                <p>Filas de stock procesadas: {csvResult.stockRowsProcessed}</p>
              </div>
            ) : null}
          </form>

          <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-3 text-lg font-semibold">Vista rapida de fotos</h3>
            <div className="grid grid-cols-2 gap-3">
              {products
                .filter((product: any) => !!product.photoUrl)
                .slice(0, 6)
                .map((product: any) => (
                  <article key={product.id} className="rounded-xl border border-slate-700 p-2">
                    <img
                      src={buildUploadsUrl(product.photoUrl)}
                      alt={product.name}
                      className="h-24 w-full rounded-lg object-cover"
                    />
                    <p className="mt-2 truncate text-xs">{product.name}</p>
                  </article>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
