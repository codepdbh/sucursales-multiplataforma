import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Eye, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';

import type { AuthContextValue } from '../../../auth/auth-context';
import type { apiRequest as apiRequestFn } from '../../../lib/api';
import type { Branch, Product, Sale, SalesEditControl } from '../../../lib/types';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Field,
  Input,
  Panel,
  ProductImage,
  SectionTitle,
  Select,
  Textarea,
} from '../ui';

type SaleSearchMode = 'ALL' | 'NAME' | 'BARCODE';

interface SaleCartItem {
  barcode: string | null;
  photoUrl: string | null;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
}

interface SaleFormState {
  branchId: string;
  discount: string;
  invoiceEnabled: boolean;
  items: SaleCartItem[];
  notes: string;
}

interface SalePatchFormState {
  invoiceEnabled: boolean;
  notes: string;
  saleId: string;
}

interface EnableEditFormState {
  branchId: string;
  expiresAt: string;
}

interface StockInfo {
  currentBranchStock: number;
  hasCurrentBranchRecord: boolean;
  otherBranchesStock: number;
}

interface SalesSectionProps {
  addProductToSale: (product: Product) => void;
  apiRequest: typeof apiRequestFn;
  auth: AuthContextValue;
  branches: Branch[];
  buildUploadsUrl: (path: string | null) => string | undefined;
  canManage: boolean;
  enableEditForm: EnableEditFormState;
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  findSaleProductCandidate: (value: string) => Product | undefined;
  getAvailableStockInfo: (productId: string) => StockInfo;
  isOwner: boolean;
  lastEditControl: SalesEditControl | null;
  onCreateSale: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onEnableEditWindow: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onFindSaleById: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onPatchSale: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  removeSaleItem: (index: number) => void;
  resolveLookupCandidate: (value: string, results: Product[]) => Product | undefined;
  saleDetailId: string;
  saleDiscountPreview: number;
  saleForm: SaleFormState;
  saleLookup: string;
  salePatchForm: SalePatchFormState;
  saleSearchLoading: boolean;
  saleSearchMode: SaleSearchMode;
  saleSearchResults: Product[];
  saleSubtotalPreview: number;
  saleTotalPreview: number;
  salesBranchId: string;
  salesToday: Sale[];
  selectedSale: Sale | null;
  setEnableEditForm: Dispatch<SetStateAction<EnableEditFormState>>;
  setSaleDetailId: Dispatch<SetStateAction<string>>;
  setSaleForm: Dispatch<SetStateAction<SaleFormState>>;
  setSaleLookup: Dispatch<SetStateAction<string>>;
  setSalePatchForm: Dispatch<SetStateAction<SalePatchFormState>>;
  setSaleSearchMode: Dispatch<SetStateAction<SaleSearchMode>>;
  setSaleSearchResults: Dispatch<SetStateAction<Product[]>>;
  setSalesBranchId: Dispatch<SetStateAction<string>>;
  setSelectedSale: Dispatch<SetStateAction<Sale | null>>;
  updateSaleItem: (index: number, patch: Partial<SaleCartItem>) => void;
  withLoader: (task: () => Promise<void>, successMessage?: string) => Promise<void>;
}

function StockBadge({ stockInfo }: { stockInfo: StockInfo }) {
  if (stockInfo.currentBranchStock > 0) {
    return <Badge tone="green">Stock {stockInfo.currentBranchStock}</Badge>;
  }

  if (stockInfo.otherBranchesStock > 0) {
    return <Badge tone="amber">Otra sucursal {stockInfo.otherBranchesStock}</Badge>;
  }

  return <Badge tone="red">Sin stock</Badge>;
}

export function SalesSection({
  addProductToSale,
  apiRequest,
  auth,
  branches,
  buildUploadsUrl,
  canManage,
  enableEditForm,
  formatDate,
  formatMoney,
  findSaleProductCandidate,
  getAvailableStockInfo,
  isOwner,
  lastEditControl,
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
}: SalesSectionProps) {
  return (
    <section className={`grid gap-5 ${canManage ? 'xl:grid-cols-[minmax(0,1.35fr)_420px]' : ''}`}>
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle
            actions={!canManage ? <Badge tone="blue">{auth.user?.branch?.name ?? 'Sucursal'}</Badge> : null}
            eyebrow="Venta"
            title="Registrar venta"
          />
          <form className="mt-4 grid gap-4" onSubmit={(event) => void onCreateSale(event)}>
            {canManage ? (
              <Field label="Sucursal">
                <Select
                  onChange={(event) =>
                    setSaleForm((prev) => ({ ...prev, branchId: event.target.value }))
                  }
                  required
                  value={saleForm.branchId}
                >
                  <option value="">Seleccionar</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { label: 'Todo', value: 'ALL' },
                  { label: 'Nombre', value: 'NAME' },
                  { label: 'Codigo', value: 'BARCODE' },
                ].map((mode) => (
                  <Button
                    key={mode.value}
                    onClick={() => setSaleSearchMode(mode.value as SaleSearchMode)}
                    variant={saleSearchMode === mode.value ? 'primary' : 'secondary'}
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
              <Field label="Buscar producto">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                  <Input
                    className="ui-input-with-icon"
                    onChange={(event) => setSaleLookup(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') {
                        return;
                      }

                      event.preventDefault();
                      const candidate =
                        findSaleProductCandidate(saleLookup) ??
                        resolveLookupCandidate(saleLookup, saleSearchResults);
                      if (candidate) {
                        addProductToSale(candidate);
                        setSaleLookup('');
                        setSaleSearchResults([]);
                      }
                    }}
                    placeholder="Nombre, codigo o ID"
                    value={saleLookup}
                  />
                </div>
              </Field>
              {saleSearchLoading ? (
                <p className="mt-2 text-xs font-semibold text-[color:var(--text-muted)]">Buscando...</p>
              ) : null}
              {saleSearchResults.length ? (
                <div className="mt-3 grid gap-2">
                  {saleSearchResults.slice(0, 6).map((product) => {
                    const stockInfo = getAvailableStockInfo(product.id);

                    return (
                      <button
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-left hover:bg-[color:var(--surface-muted)]"
                        key={product.id}
                        onClick={() => {
                          addProductToSale(product);
                          setSaleLookup('');
                          setSaleSearchResults([]);
                        }}
                        type="button"
                      >
                        <ProductImage alt={product.name} src={buildUploadsUrl(product.photoUrl)} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[color:var(--text-strong)]">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-[color:var(--text-muted)]">
                            {product.brand.name} / {product.barcode ?? 'Sin codigo'}
                          </p>
                        </div>
                        <div className="grid justify-items-end gap-1">
                          <span className="text-sm font-extrabold text-[color:var(--text-strong)]">
                            {formatMoney(product.defaultPrice)}
                          </span>
                          <StockBadge stockInfo={stockInfo} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <Panel className="p-3 shadow-none">
              <SectionTitle eyebrow="Detalle" title="Productos en venta" />
              <div className="mt-3 grid gap-3">
                {saleForm.items.length ? (
                  saleForm.items.map((item, index) => {
                    const stockInfo = getAvailableStockInfo(item.productId);

                    return (
                      <div
                        className="grid gap-3 rounded-lg border border-[color:var(--border)] p-3 md:grid-cols-[auto_minmax(0,1fr)_auto]"
                        key={`${item.productId}-${index}`}
                      >
                        <ProductImage alt={item.productName} src={buildUploadsUrl(item.photoUrl)} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-extrabold text-[color:var(--text-strong)]">
                              {item.productName}
                            </p>
                            <StockBadge stockInfo={stockInfo} />
                          </div>
                          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                            {item.barcode ?? 'Sin codigo'}
                          </p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <Field label="Cantidad">
                              <Input
                                inputMode="numeric"
                                min="1"
                                onChange={(event) =>
                                  updateSaleItem(index, { quantity: event.target.value })
                                }
                                pattern="[0-9]*"
                                required
                                step="1"
                                type="number"
                                value={item.quantity}
                              />
                            </Field>
                            <Field label="Precio">
                              <Input
                                min="0"
                                onChange={(event) =>
                                  updateSaleItem(index, { unitPrice: event.target.value })
                                }
                                step="0.01"
                                type="number"
                                value={item.unitPrice}
                              />
                            </Field>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-2">
                          <p className="text-sm font-extrabold text-[color:var(--brand-strong)]">
                            {formatMoney(
                              (Number(item.quantity || '0') || 0) *
                                (Number(item.unitPrice || '0') || 0),
                            )}
                          </p>
                          <Button icon={<Trash2 />} onClick={() => removeSaleItem(index)} variant="ghost">
                            Quitar
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState>No hay productos agregados.</EmptyState>
                )}
              </div>
            </Panel>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Descuento">
                <Input
                  min="0"
                  onChange={(event) =>
                    setSaleForm((prev) => ({ ...prev, discount: event.target.value }))
                  }
                  step="0.01"
                  type="number"
                  value={saleForm.discount}
                />
              </Field>
              <label className="flex items-center gap-2 self-end rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-3 text-sm font-bold text-[color:var(--text)]">
                <input
                  checked={saleForm.invoiceEnabled}
                  onChange={(event) =>
                    setSaleForm((prev) => ({
                      ...prev,
                      invoiceEnabled: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Factura habilitada
              </label>
            </div>
            <Field label="Notas">
              <Textarea
                onChange={(event) => setSaleForm((prev) => ({ ...prev, notes: event.target.value }))}
                value={saleForm.notes}
              />
            </Field>
            <div className="grid gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-sm">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <strong>{formatMoney(saleSubtotalPreview)}</strong>
              </p>
              <p className="flex justify-between">
                <span>Descuento</span>
                <strong>{formatMoney(saleDiscountPreview)}</strong>
              </p>
              <p className="flex justify-between text-base text-[color:var(--brand-strong)]">
                <span>Total</span>
                <strong>{formatMoney(saleTotalPreview)}</strong>
              </p>
            </div>
            <Button icon={<Plus />} type="submit" variant="primary">
              Confirmar venta
            </Button>
          </form>
        </Panel>

        {canManage ? (
          <Panel className="p-5">
            <SectionTitle
              actions={
                <Select
                  className="w-56"
                  onChange={(event) => setSalesBranchId(event.target.value)}
                  value={salesBranchId}
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              }
              eyebrow="Hoy"
              title="Ventas registradas"
            />
            <div className="mt-4">
              {salesToday.length ? (
                <DataTable>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Sucursal</th>
                      <th>Usuario</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesToday.map((sale) => (
                      <tr key={sale.id}>
                        <td className="font-mono text-xs">{sale.id.slice(0, 10)}</td>
                        <td>{sale.branchName}</td>
                        <td>{sale.username}</td>
                        <td className="font-extrabold">{formatMoney(sale.total)}</td>
                        <td>
                          <Button
                            icon={<Eye />}
                            onClick={() =>
                              void withLoader(async () => {
                                const data = await apiRequest<Sale>(`/sales/${sale.id}`);
                                setSelectedSale(data);
                              })
                            }
                          >
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <EmptyState>No hay ventas cargadas para hoy.</EmptyState>
              )}
            </div>
          </Panel>
        ) : null}
      </div>

      {canManage ? (
        <div className="space-y-5">
          <Panel className="p-5">
            <SectionTitle eyebrow="Consulta" title="Buscar venta" />
            <form className="mt-4 grid gap-3" onSubmit={(event) => void onFindSaleById(event)}>
              <Field label="ID de venta">
                <Input onChange={(event) => setSaleDetailId(event.target.value)} value={saleDetailId} />
              </Field>
              <Button icon={<Search />} type="submit" variant="primary">
                Buscar
              </Button>
            </form>
          </Panel>

          <Panel className="p-5">
            <SectionTitle eyebrow="Correccion" title="Venta" />
            <form className="mt-4 grid gap-3" onSubmit={(event) => void onPatchSale(event)}>
              <Field label="ID de venta">
                <Input
                  onChange={(event) =>
                    setSalePatchForm((prev) => ({ ...prev, saleId: event.target.value }))
                  }
                  required
                  value={salePatchForm.saleId}
                />
              </Field>
              <Field label="Notas">
                <Textarea
                  onChange={(event) =>
                    setSalePatchForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  value={salePatchForm.notes}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-bold text-[color:var(--text)]">
                <input
                  checked={salePatchForm.invoiceEnabled}
                  onChange={(event) =>
                    setSalePatchForm((prev) => ({
                      ...prev,
                      invoiceEnabled: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Factura habilitada
              </label>
              <Button icon={<ShieldCheck />} type="submit" variant="primary">
                Aplicar
              </Button>
            </form>
          </Panel>

          {isOwner ? (
            <Panel className="p-5">
              <SectionTitle eyebrow="Permiso" title="Ventana de correccion" />
              <form className="mt-4 grid gap-3" onSubmit={(event) => void onEnableEditWindow(event)}>
                <Field label="Sucursal">
                  <Select
                    onChange={(event) =>
                      setEnableEditForm((prev) => ({ ...prev, branchId: event.target.value }))
                    }
                    required
                    value={enableEditForm.branchId}
                  >
                    <option value="">Seleccionar</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Expira">
                  <Input
                    onChange={(event) =>
                      setEnableEditForm((prev) => ({ ...prev, expiresAt: event.target.value }))
                    }
                    type="datetime-local"
                    value={enableEditForm.expiresAt}
                  />
                </Field>
                <Button icon={<ShieldCheck />} type="submit" variant="primary">
                  Habilitar
                </Button>
              </form>
              {lastEditControl ? (
                <p className="mt-3 rounded-lg bg-[color:var(--surface-muted)] p-3 text-xs font-semibold text-[color:var(--text-muted)]">
                  Creada: {formatDate(lastEditControl.createdAt)} / Expira:{' '}
                  {lastEditControl.expiresAt ? formatDate(lastEditControl.expiresAt) : 'Sin expiracion'}
                </p>
              ) : null}
            </Panel>
          ) : null}

          {selectedSale ? (
            <Panel className="p-5">
              <SectionTitle actions={<Badge tone="green">{formatMoney(selectedSale.total)}</Badge>} eyebrow="Detalle" title="Venta seleccionada" />
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-mono text-xs text-[color:var(--text-muted)]">{selectedSale.id}</p>
                <p className="font-bold text-[color:var(--text-strong)]">
                  {selectedSale.branchName} / {formatDate(selectedSale.createdAt)}
                </p>
                <div className="grid gap-2">
                  {selectedSale.items.map((item) => (
                    <div
                      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2"
                      key={item.id}
                    >
                      <p className="font-bold text-[color:var(--text-strong)]">{item.productName}</p>
                      <p className="text-xs text-[color:var(--text-muted)]">
                        {item.quantity} x {formatMoney(item.unitPrice)} = {formatMoney(item.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
