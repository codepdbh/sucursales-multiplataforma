import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import type {
  Branch,
  InventoryMovement,
  Product,
  StockItem,
} from '../../../lib/types';
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

interface StockAdjustFormState {
  branchId: string;
  currentQuantity: string;
  notes: string;
  productId: string;
  productName: string;
  stockId: string;
  targetQuantity: string;
  unitPrice: string;
}

interface InventorySectionProps {
  branches: Branch[];
  buildUploadsUrl: (path: string | null) => string | undefined;
  canManage: boolean;
  formatDate: (value: string) => string;
  isOwner: boolean;
  movementBranchId: string;
  movements: InventoryMovement[];
  onAdjustStock: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  productPhotoById: Map<string, string | null>;
  products: Product[];
  setMovementBranchId: Dispatch<SetStateAction<string>>;
  setStockAdjustForm: Dispatch<SetStateAction<StockAdjustFormState>>;
  setStockBranchId: Dispatch<SetStateAction<string>>;
  startStockAdjust: (item: StockItem) => void;
  startStockAdjustForSelection: (branchId: string, productId: string) => void;
  stock: StockItem[];
  stockAdjustForm: StockAdjustFormState;
  stockBranchId: string;
}

function stockTone(quantity: number): 'green' | 'amber' | 'red' {
  if (quantity <= 0) {
    return 'red';
  }

  if (quantity <= 5) {
    return 'amber';
  }

  return 'green';
}

export function InventorySection({
  branches,
  buildUploadsUrl,
  canManage,
  formatDate,
  isOwner,
  movementBranchId,
  movements,
  onAdjustStock,
  productPhotoById,
  products,
  setMovementBranchId,
  setStockAdjustForm,
  setStockBranchId,
  startStockAdjust,
  startStockAdjustForSelection,
  stock,
  stockAdjustForm,
  stockBranchId,
}: InventorySectionProps) {
  const activeBranches = branches.filter((branch) => branch.isActive);
  const selectableBranches = stockBranchId
    ? activeBranches.filter((branch) => branch.id === stockBranchId)
    : activeBranches;
  const selectableProducts = products
    .filter((product) => product.isActive)
    .sort((left, right) => left.name.localeCompare(right.name, 'es'));

  const selectedBranchId =
    stockAdjustForm.branchId || selectableBranches[0]?.id || '';

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_420px]">
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle
            actions={
              canManage ? (
                <Select
                  className="w-56"
                  onChange={(event) => setStockBranchId(event.target.value)}
                  value={stockBranchId}
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              ) : null
            }
            eyebrow="Stock"
            title="Existencias por sucursal"
          />

          <p className="mt-3 text-sm text-[color:var(--text-muted)]">
            Los productos aparecen aqui cuando ya tienen existencias registradas.
            Si acabas de crearlo, usa el panel de ajuste para cargar su primer stock.
          </p>

          <div className="mt-4">
            {stock.length ? (
              <DataTable>
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Sucursal</th>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Cantidad</th>
                    {canManage ? <th>Acciones</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <ProductImage
                          alt={item.productName}
                          src={buildUploadsUrl(productPhotoById.get(item.productId) ?? null)}
                        />
                      </td>
                      <td>{item.branchName}</td>
                      <td className="font-bold text-[color:var(--text-strong)]">
                        {item.productName}
                      </td>
                      <td>{item.brandName}</td>
                      <td>
                        <Badge tone={stockTone(item.quantity)}>{item.quantity}</Badge>
                      </td>
                      {canManage ? (
                        <td>
                          <Button icon={<SlidersHorizontal />} onClick={() => startStockAdjust(item)}>
                            Ajustar
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState>No hay stock para mostrar.</EmptyState>
            )}
          </div>
        </Panel>

        {isOwner ? (
          <Panel className="p-5">
            <SectionTitle
              actions={
                <Select
                  className="w-56"
                  onChange={(event) => setMovementBranchId(event.target.value)}
                  value={movementBranchId}
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              }
              eyebrow="Auditoria"
              title="Movimientos"
            />
            <div className="mt-4 max-h-96 overflow-auto">
              {movements.length ? (
                <DataTable>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{formatDate(movement.createdAt)}</td>
                        <td>
                          <Badge tone={movement.type === 'IN' ? 'green' : 'amber'}>
                            {movement.type}
                          </Badge>
                        </td>
                        <td className="font-bold text-[color:var(--text-strong)]">
                          {movement.productName}
                        </td>
                        <td>{movement.quantity}</td>
                        <td>{movement.refType ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              ) : (
                <EmptyState>No hay movimientos con los filtros actuales.</EmptyState>
              )}
            </div>
          </Panel>
        ) : null}
      </div>

      {canManage ? (
        <Panel className="h-fit p-5">
          <SectionTitle eyebrow="Ajuste" title="Cantidad final" />
          <form className="mt-4 grid gap-3" onSubmit={(event) => void onAdjustStock(event)}>
            <Field label="Sucursal">
              <Select
                onChange={(event) => {
                  const branchId = event.target.value;
                  if (stockAdjustForm.productId) {
                    startStockAdjustForSelection(branchId, stockAdjustForm.productId);
                    return;
                  }

                  setStockAdjustForm((prev) => ({
                    ...prev,
                    branchId,
                    stockId: '',
                    currentQuantity: '0',
                    targetQuantity: prev.targetQuantity || '0',
                  }));
                }}
                required
                value={selectedBranchId}
              >
                <option value="">Seleccionar</option>
                {selectableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Producto">
              <Select
                onChange={(event) => {
                  const productId = event.target.value;
                  if (!productId || !selectedBranchId) {
                    setStockAdjustForm((prev) => ({
                      ...prev,
                      productId,
                      productName:
                        selectableProducts.find((product) => product.id === productId)?.name ?? '',
                      stockId: '',
                      currentQuantity: '0',
                      targetQuantity: '0',
                    }));
                    return;
                  }

                  startStockAdjustForSelection(selectedBranchId, productId);
                }}
                required
                value={stockAdjustForm.productId}
              >
                <option value="">Seleccionar</option>
                {selectableProducts.map((product) => {
                  const quantity =
                    stock.find(
                      (item) =>
                        item.branchId === selectedBranchId &&
                        item.productId === product.id,
                    )?.quantity ?? 0;

                  return (
                    <option key={product.id} value={product.id}>
                      {product.name} ({quantity})
                    </option>
                  );
                })}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Actual">
                <Input readOnly value={stockAdjustForm.currentQuantity} />
              </Field>
              <Field label="Cantidad final">
                <Input
                  min="0"
                  onChange={(event) =>
                    setStockAdjustForm((prev) => ({
                      ...prev,
                      targetQuantity: event.target.value,
                    }))
                  }
                  required
                  step="0.001"
                  type="number"
                  value={stockAdjustForm.targetQuantity}
                />
              </Field>
            </div>
            <Field label="Precio unitario">
              <Input
                min="0"
                onChange={(event) =>
                  setStockAdjustForm((prev) => ({
                    ...prev,
                    unitPrice: event.target.value,
                  }))
                }
                step="0.01"
                type="number"
                value={stockAdjustForm.unitPrice}
              />
            </Field>
            <Field label="Motivo">
              <Textarea
                onChange={(event) =>
                  setStockAdjustForm((prev) => ({
                    ...prev,
                    notes: event.target.value,
                  }))
                }
                value={stockAdjustForm.notes}
              />
            </Field>
            <Button icon={<SlidersHorizontal />} type="submit" variant="primary">
              Aplicar ajuste
            </Button>
          </form>
        </Panel>
      ) : null}
    </section>
  );
}
