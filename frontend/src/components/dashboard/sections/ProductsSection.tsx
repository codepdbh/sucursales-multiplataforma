import { useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { ImageUp, Plus, Pencil, RotateCcw, Search, Trash2, X } from 'lucide-react';

import type { Product } from '../../../lib/types';
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
type ProductActionPanel = 'product' | 'photo' | null;

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
  buildUploadsUrl: (path: string | null) => string | undefined;
  canManage: boolean;
  editingProductId: string | null;
  formatMoney: (value: number) => string;
  onDeleteProduct: (product: Product) => Promise<void>;
  onProductSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onRestoreProduct: (product: Product) => Promise<void>;
  onUploadPhoto: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  photoUploadProductId: string;
  productActiveFilter: BooleanFilter;
  productForm: ProductFormState;
  productSearch: string;
  productSiatFilter: BooleanFilter;
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
  buildUploadsUrl,
  canManage,
  editingProductId,
  formatMoney,
  onDeleteProduct,
  onProductSubmit,
  onRestoreProduct,
  onUploadPhoto,
  photoUploadProductId,
  productActiveFilter,
  productForm,
  productSearch,
  productSiatFilter,
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
  const [activePanel, setActivePanel] = useState<ProductActionPanel>(null);

  function openNewProductForm(): void {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setPhotoUploadFile(null);
    setActivePanel('product');
  }

  function openEditProductForm(product: Product): void {
    startProductEdit(product);
    setPhotoUploadFile(null);
    setActivePanel('product');
  }

  function closeActionPanel(): void {
    setActivePanel(null);
    setEditingProductId(null);
    setPhotoUploadFile(null);
    setProductForm(EMPTY_PRODUCT_FORM);
  }

  return (
    <section className="space-y-5">
      {canManage && activePanel === 'product' ? (
        <Panel className="p-5">
          <SectionTitle
            actions={
              <Button icon={<X />} onClick={closeActionPanel} variant="ghost">
                Cerrar
              </Button>
            }
            eyebrow="Gestion"
            title={editingProductId ? 'Editar producto' : 'Nuevo producto'}
          />
          <form className="mt-4 grid gap-3 lg:grid-cols-2" onSubmit={(event) => void onProductSubmit(event)}>
            <Field label="Producto">
              <Input
                onChange={(event) =>
                  setProductForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
                value={productForm.name}
              />
            </Field>
            <Field label="Marca">
              <Input
                onChange={(event) =>
                  setProductForm((prev) => ({ ...prev, brandName: event.target.value }))
                }
                required
                value={productForm.brandName}
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
            <Field label="Codigo de barras">
              <Input
                onChange={(event) =>
                  setProductForm((prev) => ({ ...prev, barcode: event.target.value }))
                }
                value={productForm.barcode}
              />
            </Field>
            <Field className="lg:col-span-2" label="Foto opcional">
              <Input
                accept="image/*"
                onChange={(event) => setPhotoUploadFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </Field>
            <div className="grid gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 lg:col-span-2 sm:grid-cols-3">
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
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Button icon={<Pencil />} type="submit" variant="primary">
                {editingProductId ? 'Guardar cambios' : 'Crear producto'}
              </Button>
              <Button icon={<X />} onClick={closeActionPanel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {canManage && activePanel === 'photo' ? (
        <Panel className="p-5">
          <SectionTitle
            actions={
              <Button icon={<X />} onClick={() => setActivePanel(null)} variant="ghost">
                Cerrar
              </Button>
            }
            eyebrow="Imagen"
            title="Foto de producto"
          />
          <form className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end" onSubmit={(event) => void onUploadPhoto(event)}>
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
      ) : null}

      <Panel className="p-5">
        <SectionTitle
          actions={
            canManage ? (
              <>
                <Button icon={<Plus />} onClick={openNewProductForm} variant="primary">
                  Nuevo producto
                </Button>
                <Button
                  icon={<ImageUp />}
                  onClick={() => {
                    setPhotoUploadFile(null);
                    setActivePanel('photo');
                  }}
                >
                  Subir foto
                </Button>
              </>
            ) : null
          }
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
                    <th>Precio</th>
                    <th>Estado</th>
                    {canManage ? <th>Acciones</th> : null}
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
                          {product.brand.name} / {product.barcode ?? 'Sin codigo'}
                        </p>
                        {product.siatEnabled ? (
                          <Badge tone="blue">SIAT</Badge>
                        ) : null}
                      </td>
                      <td className="font-bold">{formatMoney(product.defaultPrice)}</td>
                      <td>
                        <Badge tone={product.isActive ? 'green' : 'red'}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      {canManage ? (
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <Button icon={<Pencil />} onClick={() => openEditProductForm(product)}>
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
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState>No hay productos con los filtros actuales.</EmptyState>
            )}
          </div>
        </Panel>
    </section>
  );
}
