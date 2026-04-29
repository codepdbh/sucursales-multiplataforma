import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { FileUp, ImageUp, Pencil, RotateCcw, Search, Trash2, X } from 'lucide-react';

import type { Branch, ImportProductsResult, Product } from '../../../lib/types';
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
} from '../ui';

type BooleanFilter = 'ALL' | 'YES' | 'NO';

interface ProductFormState {
  barcode: string;
  brandName: string;
  defaultPrice: string;
  isActive: boolean;
  name: string;
  requiresWeight: boolean;
  siatEnabled: boolean;
}

interface ProductsSectionProps {
  branches: Branch[];
  buildUploadsUrl: (path: string | null) => string | undefined;
  canManage: boolean;
  csvBranchId: string;
  csvResult: ImportProductsResult | null;
  editingProductId: string | null;
  formatMoney: (value: number) => string;
  onDeleteProduct: (product: Product) => Promise<void>;
  onImportCsv: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onProductSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRestoreProduct: (product: Product) => Promise<void>;
  onUploadPhoto: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  photoUploadProductId: string;
  productActiveFilter: BooleanFilter;
  productForm: ProductFormState;
  productSearch: string;
  productSiatFilter: BooleanFilter;
  products: Product[];
  setCsvBranchId: Dispatch<SetStateAction<string>>;
  setCsvFile: Dispatch<SetStateAction<File | null>>;
  setEditingProductId: Dispatch<SetStateAction<string | null>>;
  setPhotoUploadFile: Dispatch<SetStateAction<File | null>>;
  setPhotoUploadProductId: Dispatch<SetStateAction<string>>;
  setProductActiveFilter: Dispatch<SetStateAction<BooleanFilter>>;
  setProductForm: Dispatch<SetStateAction<ProductFormState>>;
  setProductSearch: Dispatch<SetStateAction<string>>;
  setProductSiatFilter: Dispatch<SetStateAction<BooleanFilter>>;
  startProductEdit: (product: Product) => void;
  visibleProducts: Product[];
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
  barcode: '',
  brandName: '',
  defaultPrice: '',
  isActive: true,
  name: '',
  requiresWeight: false,
  siatEnabled: false,
};

export function ProductsSection({
  branches,
  buildUploadsUrl,
  canManage,
  csvBranchId,
  csvResult,
  editingProductId,
  formatMoney,
  onDeleteProduct,
  onImportCsv,
  onProductSubmit,
  onRestoreProduct,
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
}: ProductsSectionProps) {
  const productsWithPhoto = products.filter((product) => !!product.photoUrl).slice(0, 6);

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_420px]">
      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle
            eyebrow="Catalogo"
            title="Productos"
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
            <Field label="Buscar">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                <Input
                  className="ui-input-with-icon"
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Nombre, marca o codigo"
                  value={productSearch}
                />
              </div>
            </Field>
            <Field label="SIAT">
              <Select
                onChange={(event) => setProductSiatFilter(event.target.value as BooleanFilter)}
                value={productSiatFilter}
              >
                <option value="ALL">Todos</option>
                <option value="YES">Habilitado</option>
                <option value="NO">Deshabilitado</option>
              </Select>
            </Field>
            <Field label="Estado">
              <Select
                onChange={(event) => setProductActiveFilter(event.target.value as BooleanFilter)}
                value={productActiveFilter}
              >
                <option value="ALL">Todos</option>
                <option value="YES">Activos</option>
                <option value="NO">Inactivos</option>
              </Select>
            </Field>
          </div>

          <div className="mt-4">
            {visibleProducts.length ? (
              <DataTable>
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Precio</th>
                    <th>SIAT</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <ProductImage alt={product.name} src={buildUploadsUrl(product.photoUrl)} />
                      </td>
                      <td>
                        <p className="font-bold text-[color:var(--text-strong)]">{product.name}</p>
                        <p className="text-xs text-[color:var(--text-muted)]">
                          {product.barcode ?? 'Sin codigo'}
                        </p>
                      </td>
                      <td>{product.brand.name}</td>
                      <td className="font-bold">{formatMoney(product.defaultPrice)}</td>
                      <td>
                        <Badge tone={product.siatEnabled ? 'blue' : 'neutral'}>
                          {product.siatEnabled ? 'SIAT' : 'No'}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={product.isActive ? 'green' : 'red'}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td>
                        {canManage ? (
                          <div className="flex flex-wrap gap-2">
                            <Button icon={<Pencil />} onClick={() => startProductEdit(product)}>
                              Editar
                            </Button>
                            {product.isActive ? (
                              <Button
                                icon={<Trash2 />}
                                onClick={() => {
                                  if (window.confirm(`Eliminar ${product.name} del catalogo activo?`)) {
                                    void onDeleteProduct(product);
                                  }
                                }}
                                variant="danger"
                              >
                                Eliminar
                              </Button>
                            ) : (
                              <Button
                                icon={<RotateCcw />}
                                onClick={() => void onRestoreProduct(product)}
                                variant="primary"
                              >
                                Restaurar
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[color:var(--text-muted)]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState>No hay productos con los filtros actuales.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle eyebrow="Media" title="Productos con foto" />
          {productsWithPhoto.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {productsWithPhoto.map((product) => (
                <article
                  className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2"
                  key={product.id}
                >
                  <img
                    alt={product.name}
                    className="h-28 w-full rounded-lg object-cover"
                    src={buildUploadsUrl(product.photoUrl)}
                  />
                  <p className="mt-2 truncate text-sm font-bold text-[color:var(--text-strong)]">
                    {product.name}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState>No hay fotos cargadas.</EmptyState>
            </div>
          )}
        </Panel>
      </div>

      {canManage ? (
        <div className="space-y-5">
          <Panel className="p-5">
            <SectionTitle
              actions={
                editingProductId ? (
                  <Button
                    icon={<X />}
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm(EMPTY_PRODUCT_FORM);
                    }}
                    variant="ghost"
                  >
                    Cancelar
                  </Button>
                ) : null
              }
              eyebrow="Gestion"
              title={editingProductId ? 'Editar producto' : 'Nuevo producto'}
            />
            <form className="mt-4 grid gap-3" onSubmit={(event) => void onProductSubmit(event)}>
              <Field label="Marca">
                <Input
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, brandName: event.target.value }))
                  }
                  required
                  value={productForm.brandName}
                />
              </Field>
              <Field label="Producto">
                <Input
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                  value={productForm.name}
                />
              </Field>
              <Field label="Codigo de barras">
                <Input
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, barcode: event.target.value }))
                  }
                  value={productForm.barcode}
                />
              </Field>
              <Field label="Precio">
                <Input
                  min="0"
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, defaultPrice: event.target.value }))
                  }
                  required
                  step="0.01"
                  type="number"
                  value={productForm.defaultPrice}
                />
              </Field>
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm font-bold text-[color:var(--text)]">
                  <input
                    checked={productForm.requiresWeight}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        requiresWeight: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Requiere peso
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-[color:var(--text)]">
                  <input
                    checked={productForm.siatEnabled}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        siatEnabled: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  SIAT habilitado
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-[color:var(--text)]">
                  <input
                    checked={productForm.isActive}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Producto activo
                </label>
              </div>
              <Button icon={<Pencil />} type="submit" variant="primary">
                {editingProductId ? 'Guardar cambios' : 'Crear producto'}
              </Button>
            </form>
          </Panel>

          <Panel className="p-5">
            <SectionTitle eyebrow="Imagen" title="Foto de producto" />
            <form className="mt-4 grid gap-3" onSubmit={(event) => void onUploadPhoto(event)}>
              <Field label="Producto">
                <Select
                  onChange={(event) => setPhotoUploadProductId(event.target.value)}
                  required
                  value={photoUploadProductId}
                >
                  <option value="">Seleccionar</option>
                  {visibleProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Archivo">
                <Input
                  accept="image/*"
                  onChange={(event) => setPhotoUploadFile(event.target.files?.[0] ?? null)}
                  required
                  type="file"
                />
              </Field>
              <Button icon={<ImageUp />} type="submit" variant="primary">
                Subir foto
              </Button>
            </form>
          </Panel>

          <Panel className="p-5">
            <SectionTitle eyebrow="Importacion" title="CSV de productos" />
            <form className="mt-4 grid gap-3" onSubmit={(event) => void onImportCsv(event)}>
              <Field label="Archivo CSV">
                <Input
                  accept=".csv,text/csv"
                  onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
                  required
                  type="file"
                />
              </Field>
              <Field label="Sucursal">
                <Select
                  onChange={(event) => setCsvBranchId(event.target.value)}
                  required
                  value={csvBranchId}
                >
                  <option value="">Seleccionar</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button icon={<FileUp />} type="submit" variant="primary">
                Importar
              </Button>
            </form>
            {csvResult ? (
              <div className="mt-4 grid gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-sm">
                <p>Productos nuevos: {csvResult.createdProducts}</p>
                <p>Productos actualizados: {csvResult.updatedProducts}</p>
                <p>Filas de stock: {csvResult.stockRowsProcessed}</p>
              </div>
            ) : null}
          </Panel>
        </div>
      ) : null}
    </section>
  );
}
