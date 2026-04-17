import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { useAuth } from '../auth/auth-context';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import type { OverviewPieSlice } from '../components/dashboard/OverviewSection';
import { BranchesSection } from '../components/dashboard/sections/BranchesSection';
import { InventorySection } from '../components/dashboard/sections/InventorySection';
import { ProductsSection } from '../components/dashboard/sections/ProductsSection';
import { ReportsSection } from '../components/dashboard/sections/ReportsSection';
import { SalesSection } from '../components/dashboard/sections/SalesSection';
import { UsersSection } from '../components/dashboard/sections/UsersSection';
import { ApiError, apiRequest, getApiBaseUrl } from '../lib/api';
import { applyTheme, getInitialTheme } from '../lib/theme';
import type {
  Branch,
  ImportProductsResult,
  InventoryMovement,
  LiquidationReport,
  Product,
  Sale,
  SalesEditControl,
  StockItem,
  User,
  UserRole,
} from '../lib/types';

type DashboardTab =
  | 'overview'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'users'
  | 'branches'
  | 'reports';

const TAB_HINTS: Record<DashboardTab, string> = {
  overview: 'Resumen rapido de productos, stock y ventas del dia.',
  products: 'Crea, edita e importa productos; usa filtros para encontrar mas rapido.',
  inventory: 'Registra entradas, salidas y ajustes para mantener stock confiable.',
  sales: 'Busca productos, arma la venta y confirma en un solo flujo.',
  users: 'Gestiona accesos por rol y sucursal para cada usuario.',
  branches: 'Administra sucursales activas y su configuracion operativa.',
  reports: 'Consulta liquidaciones diarias, semanales y mensuales por sucursal.',
};

interface SaleCartItem {
  productId: string;
  productName: string;
  barcode: string | null;
  photoUrl: string | null;
  quantity: string;
  unitPrice: string;
}

const PIE_COLORS = ['#06b6d4', '#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toNumber(input: string): number | undefined {
  if (!input.trim()) {
    return undefined;
  }

  const asNumber = Number(input);
  return Number.isNaN(asNumber) ? undefined : asNumber;
}

function normalizeIntegerInput(value: string): string {
  return value.replace(/\D+/g, '');
}

function buildUploadsUrl(path: string | null): string | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl().replace(/\/api$/, '');
  return `${base}${cleanPath}`;
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export const Dashboard = () => {
  const auth = useAuth();
  const stockFilterHydrated = useRef(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [salesToday, setSalesToday] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [reportDaily, setReportDaily] = useState<LiquidationReport | null>(null);
  const [reportWeekly, setReportWeekly] = useState<LiquidationReport | null>(null);
  const [reportMonthly, setReportMonthly] = useState<LiquidationReport | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [productSiatFilter, setProductSiatFilter] = useState<'ALL' | 'YES' | 'NO'>(
    'ALL',
  );
  const [productActiveFilter, setProductActiveFilter] = useState<'ALL' | 'YES' | 'NO'>(
    'ALL',
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    brandName: '',
    name: '',
    barcode: '',
    defaultPrice: '',
    requiresWeight: false,
    siatEnabled: false,
    isActive: true,
  });
  const [photoUploadProductId, setPhotoUploadProductId] = useState('');
  const [photoUploadFile, setPhotoUploadFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvBranchId, setCsvBranchId] = useState('');
  const [csvResult, setCsvResult] = useState<ImportProductsResult | null>(null);

  const [stockBranchId, setStockBranchId] = useState(auth.user?.branch?.id ?? '');
  const [movementBranchId, setMovementBranchId] = useState('');
  const [stockAdjustForm, setStockAdjustForm] = useState({
    stockId: '',
    branchId: '',
    productId: '',
    productName: '',
    currentQuantity: '',
    targetQuantity: '',
    unitPrice: '',
    notes: '',
  });

  const [salesBranchId, setSalesBranchId] = useState(auth.user?.branch?.id ?? '');
  const [saleForm, setSaleForm] = useState({
    branchId: '',
    discount: '',
    invoiceEnabled: false,
    notes: '',
    items: [] as SaleCartItem[],
  });
  const [saleLookup, setSaleLookup] = useState('');
  const [saleSearchResults, setSaleSearchResults] = useState<Product[]>([]);
  const [saleSearchLoading, setSaleSearchLoading] = useState(false);
  const [saleSearchMode, setSaleSearchMode] = useState<'ALL' | 'NAME' | 'BARCODE'>(
    'ALL',
  );
  const [saleDetailId, setSaleDetailId] = useState('');
  const [salePatchForm, setSalePatchForm] = useState({
    saleId: '',
    notes: '',
    invoiceEnabled: false,
  });
  const [enableEditForm, setEnableEditForm] = useState({
    branchId: '',
    expiresAt: '',
  });
  const [lastEditControl, setLastEditControl] = useState<SalesEditControl | null>(null);

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'REGISTRADOR' as UserRole,
    branchId: '',
  });
  const [userEditForm, setUserEditForm] = useState({
    id: '',
    username: '',
    email: '',
    password: '',
    role: 'REGISTRADOR' as UserRole,
    branchId: '',
  });
  const [branchForm, setBranchForm] = useState({
    name: '',
  });
  const [branchEdit, setBranchEdit] = useState({
    id: '',
    name: '',
    isActive: true,
  });
  const [reportDate, setReportDate] = useState(getTodayDateString());
  const [reportBranchId, setReportBranchId] = useState('');

  const role = auth.user?.role ?? 'REGISTRADOR';
  const isOwner = role === 'OWNER';
  const canManage = role === 'OWNER' || role === 'ADMIN';
  const canManageTargetUser = useCallback((targetUser: User | null | undefined): boolean => {
    if (!targetUser) {
      return false;
    }

    return isOwner || targetUser.role !== 'OWNER';
  }, [isOwner]);
  const registradorProductIds = useMemo(
    () =>
      new Set(
        stock
          .filter((item) => Number(item.quantity) > 0)
          .map((item) => item.productId),
      ),
    [stock],
  );
  const visibleProducts = useMemo(() => {
    if (role !== 'REGISTRADOR') {
      return products;
    }

    return products.filter((product) => registradorProductIds.has(product.id));
  }, [products, registradorProductIds, role]);
  const productPhotoById = useMemo(
    () => new Map(products.map((product) => [product.id, product.photoUrl])),
    [products],
  );

  const tabs = useMemo(() => {
    const base: { key: DashboardTab; label: string }[] = [
      { key: 'overview', label: 'Resumen' },
      { key: 'products', label: 'Productos' },
      { key: 'inventory', label: 'Inventario' },
      { key: 'sales', label: 'Ventas' },
    ];

    if (canManage) {
      base.push({ key: 'users', label: 'Usuarios' });
      base.push({ key: 'branches', label: 'Sucursales' });
    }

    if (isOwner) {
      base.push({ key: 'reports', label: 'Reportes' });
    }

    return base;
  }, [canManage, isOwner]);
  const selectedUserForEdit = useMemo(
    () => users.find((item) => item.id === userEditForm.id) ?? null,
    [users, userEditForm.id],
  );

  const activeTabHint = TAB_HINTS[activeTab];

  function resetFlashMessages(): void {
    setError(null);
    setSuccess(null);
  }

  function getBranchValueForRole(branchId: string): string | undefined {
    if (role === 'REGISTRADOR') {
      return undefined;
    }

    return branchId || undefined;
  }

  const getActiveSaleBranchId = useCallback((): string | undefined => {
    if (role === 'REGISTRADOR') {
      return auth.user?.branch?.id ?? undefined;
    }

    return saleForm.branchId || salesBranchId || undefined;
  }, [role, auth.user?.branch?.id, saleForm.branchId, salesBranchId]);

  const getAvailableStockInfo = useCallback((productId: string): {
    currentBranchStock: number;
    otherBranchesStock: number;
    hasCurrentBranchRecord: boolean;
  } => {
    const activeBranchId = getActiveSaleBranchId();
    const rows = stock.filter((item) => item.productId === productId);

    if (!rows.length) {
      return {
        currentBranchStock: 0,
        otherBranchesStock: 0,
        hasCurrentBranchRecord: false,
      };
    }

    if (!activeBranchId) {
      return {
        currentBranchStock: rows.reduce((sum, row) => sum + Number(row.quantity), 0),
        otherBranchesStock: 0,
        hasCurrentBranchRecord: true,
      };
    }

    const currentBranchRow = rows.find((row) => row.branchId === activeBranchId);
    const otherBranchesStock = rows
      .filter((row) => row.branchId !== activeBranchId)
      .reduce((sum, row) => sum + Number(row.quantity), 0);

    return {
      currentBranchStock: currentBranchRow ? Number(currentBranchRow.quantity) : 0,
      otherBranchesStock,
      hasCurrentBranchRecord: !!currentBranchRow,
    };
  }, [getActiveSaleBranchId, stock]);

  const getBranchWithHighestStock = useCallback((productId: string): StockItem | undefined => {
    const rows = stock
      .filter((item) => item.productId === productId)
      .filter((item) => Number(item.quantity) > 0)
      .sort((a, b) => Number(b.quantity) - Number(a.quantity));

    return rows[0];
  }, [stock]);

  async function withLoader(
    task: () => Promise<void>,
    successMessage?: string,
  ): Promise<void> {
    resetFlashMessages();
    setLoading(true);

    try {
      await task();
      if (successMessage) {
        setSuccess(successMessage);
      }
    } catch (taskError) {
      if (taskError instanceof ApiError || taskError instanceof Error) {
        setError(taskError.message);
      } else {
        setError('Ocurrio un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(): Promise<void> {
    const query = {
      search: productSearch || undefined,
      siatEnabled:
        productSiatFilter === 'ALL'
          ? undefined
          : productSiatFilter === 'YES'
            ? true
            : false,
      isActive:
        productActiveFilter === 'ALL'
          ? undefined
          : productActiveFilter === 'YES'
            ? true
            : false,
    };
    const data = await apiRequest<Product[]>('/products', { query });
    setProducts(data);
  }

  async function loadBranches(): Promise<void> {
    if (!canManage) {
      return;
    }

    const data = await apiRequest<Branch[]>('/branches');
    setBranches(data);
  }

  async function loadStock(): Promise<void> {
    const query = {
      branchId: getBranchValueForRole(stockBranchId),
    };
    const data = await apiRequest<StockItem[]>('/inventory/stock', { query });
    setStock(data);
  }

  async function loadSalesToday(): Promise<void> {
    if (!canManage) {
      setSalesToday([]);
      return;
    }

    const query = {
      branchId: getBranchValueForRole(salesBranchId),
      date: getTodayDateString(),
    };

    const data = await apiRequest<Sale[]>('/sales/today', { query });
    setSalesToday(data);
  }

  async function loadUsers(): Promise<void> {
    if (!canManage) {
      setUsers([]);
      return;
    }

    const data = await apiRequest<User[]>('/users');
    setUsers(data);
  }

  async function loadMovements(): Promise<void> {
    if (!isOwner) {
      setMovements([]);
      return;
    }

    const query = {
      branchId: movementBranchId || undefined,
    };

    const data = await apiRequest<InventoryMovement[]>('/inventory/movements', {
      query,
    });
    setMovements(data);
  }

  async function loadInitialData(): Promise<void> {
    await withLoader(async () => {
      await Promise.all([
        loadProducts(),
        loadBranches(),
        loadStock(),
        loadSalesToday(),
        loadUsers(),
        loadMovements(),
      ]);
    });
  }

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    setCsvBranchId((prev) => prev || branches[0]?.id || '');
    setSalesBranchId((prev) => prev || branches[0]?.id || '');
    setSaleForm((prev) => ({ ...prev, branchId: prev.branchId || branches[0]?.id || '' }));
    setEnableEditForm((prev) => ({ ...prev, branchId: prev.branchId || branches[0]?.id || '' }));
    setReportBranchId((prev) => prev || branches[0]?.id || '');
    setUserForm((prev) => ({ ...prev, branchId: prev.branchId || branches[0]?.id || '' }));
    setUserEditForm((prev) => ({ ...prev, branchId: prev.branchId || branches[0]?.id || '' }));
  }, [branches, canManage]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    if (!stockFilterHydrated.current) {
      stockFilterHydrated.current = true;
      return;
    }

    void withLoader(loadStock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockBranchId, canManage]);

  useEffect(() => {
    const lookup = saleLookup.trim().toLowerCase();
    if (!lookup) {
      setSaleSearchResults([]);
      return;
    }

    setSaleSearchLoading(true);
    const timerId = setTimeout(() => {
      const saleSearchBaseProducts =
        role === 'REGISTRADOR'
          ? products.filter((product) => registradorProductIds.has(product.id))
          : products;

      const filtered = saleSearchBaseProducts
        .filter((product) => product.isActive)
        .filter((product) => {
          const byName = product.name.toLowerCase().includes(lookup);
          const byBarcode = (product.barcode ?? '').toLowerCase().includes(lookup);

          if (saleSearchMode === 'NAME') {
            return byName;
          }
          if (saleSearchMode === 'BARCODE') {
            return byBarcode;
          }
          return byName || byBarcode;
        });

      setSaleSearchResults(filtered);
      setSaleSearchLoading(false);

      if (saleSearchMode !== 'NAME' && /^\d{8,}$/.test(lookup)) {
        const exact = resolveLookupCandidate(lookup, filtered);
        if (exact) {
          setSaleForm((prev) => {
            const existingIndex = prev.items.findIndex(
              (item) => item.productId === exact.id,
            );
            if (existingIndex >= 0) {
              const current = prev.items[existingIndex];
              const nextQuantity = (Number(current.quantity || '0') + 1).toString();
              const updated = [...prev.items];
              updated[existingIndex] = { ...current, quantity: nextQuantity };
              return { ...prev, items: updated };
            }

            return {
              ...prev,
              items: [
                ...prev.items,
                {
                  productId: exact.id,
                  productName: exact.name,
                  barcode: exact.barcode,
                  photoUrl: exact.photoUrl,
                  quantity: '1',
                  unitPrice: String(exact.defaultPrice),
                },
              ],
            };
          });
          setSaleLookup('');
          setSaleSearchResults([]);
        }
      }
    }, 150);

    return () => clearTimeout(timerId);
  }, [saleLookup, saleSearchMode, products, role, registradorProductIds]);

  async function onProductSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await withLoader(async () => {
      const payload = {
        brandName: productForm.brandName || undefined,
        name: productForm.name,
        barcode: productForm.barcode || undefined,
        defaultPrice: Number(productForm.defaultPrice),
        requiresWeight: productForm.requiresWeight,
        siatEnabled: productForm.siatEnabled,
        isActive: productForm.isActive,
      };

      if (editingProductId) {
        await apiRequest<Product>(`/products/${editingProductId}`, {
          method: 'PATCH',
          body: payload,
        });
      } else {
        await apiRequest<Product>('/products', { method: 'POST', body: payload });
      }

      setProductForm({
        brandName: '',
        name: '',
        barcode: '',
        defaultPrice: '',
        requiresWeight: false,
        siatEnabled: false,
        isActive: true,
      });
      setEditingProductId(null);
      await loadProducts();
    }, editingProductId ? 'Producto actualizado.' : 'Producto creado.');
  }

  function startProductEdit(product: Product): void {
    setEditingProductId(product.id);
    setProductForm({
      brandName: product.brand.name,
      name: product.name,
      barcode: product.barcode ?? '',
      defaultPrice: String(product.defaultPrice),
      requiresWeight: product.requiresWeight,
      siatEnabled: product.siatEnabled,
      isActive: product.isActive,
    });
    setActiveTab('products');
  }

  async function onUploadPhoto(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!photoUploadProductId || !photoUploadFile) {
      setError('Selecciona producto y archivo para subir foto.');
      return;
    }

    await withLoader(async () => {
      const formData = new FormData();
      formData.append('file', photoUploadFile);
      await apiRequest<Product>(`/products/${photoUploadProductId}/photo`, {
        method: 'POST',
        body: formData,
        isMultipart: true,
      });
      setPhotoUploadFile(null);
      await loadProducts();
    }, 'Foto de producto subida.');
  }

  async function onImportCsv(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!csvFile) {
      setError('Selecciona un archivo CSV para importar.');
      return;
    }

    if (canManage && !csvBranchId) {
      setError('Selecciona una sucursal para importar el CSV.');
      return;
    }

    await withLoader(async () => {
      const formData = new FormData();
      formData.append('file', csvFile);
      if (canManage && csvBranchId) {
        formData.append('branchId', csvBranchId);
      }

      const result = await apiRequest<ImportProductsResult>('/products/import/csv', {
        method: 'POST',
        body: formData,
        isMultipart: true,
      });
      setCsvResult(result);
      await Promise.all([loadProducts(), loadStock()]);
    }, 'CSV importado correctamente.');
  }

  function startStockAdjust(item: StockItem): void {
    setStockAdjustForm({
      stockId: item.id,
      branchId: item.branchId,
      productId: item.productId,
      productName: item.productName,
      currentQuantity: String(item.quantity),
      targetQuantity: String(item.quantity),
      unitPrice: '',
      notes: '',
    });
  }

  async function onAdjustStock(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!stockAdjustForm.stockId) {
      setError('Selecciona un registro de stock para ajustar.');
      return;
    }

    const current = Number(stockAdjustForm.currentQuantity);
    const target = Number(stockAdjustForm.targetQuantity);
    if (Number.isNaN(current) || Number.isNaN(target) || target < 0) {
      setError('La cantidad objetivo debe ser un numero valido mayor o igual a 0.');
      return;
    }

    if (target === current) {
      setSuccess('No hay cambios de stock para aplicar.');
      return;
    }

    await withLoader(async () => {
      const delta = target - current;
      const basePayload = {
        branchId: stockAdjustForm.branchId,
        productId: stockAdjustForm.productId,
        unitPrice: toNumber(stockAdjustForm.unitPrice),
        notes:
          stockAdjustForm.notes ||
          `Ajuste manual de stock: ${current} -> ${target}`,
      };

      if (delta > 0) {
        await apiRequest('/inventory/in', {
          method: 'POST',
          body: {
            ...basePayload,
            quantity: delta,
          },
        });
      } else {
        await apiRequest('/inventory/out', {
          method: 'POST',
          body: {
            ...basePayload,
            quantity: Math.abs(delta),
          },
        });
      }

      setStockAdjustForm((prev) => ({
        ...prev,
        currentQuantity: String(target),
      }));
      await Promise.all([loadStock(), loadMovements()]);
    }, 'Stock ajustado correctamente.');
  }

  function updateSaleItem(index: number, patch: Partial<SaleCartItem>): void {
    const normalizedPatch =
      typeof patch.quantity === 'string'
        ? { ...patch, quantity: normalizeIntegerInput(patch.quantity) }
        : patch;

    setSaleForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], ...normalizedPatch };
      return { ...prev, items: updated };
    });
  }

  function removeSaleItem(index: number): void {
    setSaleForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const addProductToSale = useCallback((product: Product): void => {
    const stockInfo = getAvailableStockInfo(product.id);
    if (
      canManage &&
      saleForm.items.length === 0 &&
      stockInfo.currentBranchStock <= 0 &&
      stockInfo.otherBranchesStock > 0
    ) {
      const suggestedBranch = getBranchWithHighestStock(product.id);
      if (suggestedBranch) {
        setSaleForm((prev) => ({ ...prev, branchId: suggestedBranch.branchId }));
        setSalesBranchId(suggestedBranch.branchId);
        setSuccess(
          `Sucursal de venta cambiada a ${suggestedBranch.branchName} para usar stock disponible.`,
        );
      }
    }

    setSaleForm((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const current = prev.items[existingIndex];
        const nextQuantity = (Number(current.quantity || '0') + 1).toString();
        const updated = [...prev.items];
        updated[existingIndex] = { ...current, quantity: nextQuantity };
        return { ...prev, items: updated };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product.id,
            productName: product.name,
            barcode: product.barcode,
            photoUrl: product.photoUrl,
            quantity: '1',
            unitPrice: String(product.defaultPrice),
          },
        ],
      };
    });
  }, [canManage, saleForm.items.length, getAvailableStockInfo, getBranchWithHighestStock]);

  function resolveLookupCandidate(
    value: string,
    results: Product[],
  ): Product | undefined {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    return (
      results.find((item) => item.id.toLowerCase() === normalized) ??
      results.find((item) => item.barcode?.toLowerCase() === normalized) ??
      results.find((item) => item.name.toLowerCase() === normalized) ??
      (results.length === 1 ? results[0] : undefined)
    );
  }

  async function onCreateSale(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!saleForm.items.length) {
      setError('Agrega al menos un producto a la venta.');
      return;
    }

    for (const item of saleForm.items) {
      const qty = Number(item.quantity || '0');
      if (!Number.isInteger(qty) || qty <= 0) {
        setError(
          `La cantidad para ${item.productName} debe ser un numero entero mayor a 0.`,
        );
        return;
      }
      const stockInfo = getAvailableStockInfo(item.productId);
      if (qty > stockInfo.currentBranchStock) {
        setError(
          `Stock insuficiente para ${item.productName} en esta sucursal. Disponible: ${stockInfo.currentBranchStock}.`,
        );
        return;
      }
    }

    await withLoader(async () => {
      const payload = {
        branchId: getBranchValueForRole(saleForm.branchId),
        discount: toNumber(saleForm.discount) ?? 0,
        invoiceEnabled: saleForm.invoiceEnabled,
        notes: saleForm.notes || undefined,
        items: saleForm.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: toNumber(item.unitPrice),
        })),
      };

      await apiRequest<Sale>('/sales', { method: 'POST', body: payload });
      setSaleForm((prev) => ({
        ...prev,
        discount: '',
        notes: '',
        items: [],
      }));
      setSaleLookup('');
      setSaleSearchResults([]);
      await Promise.all([loadStock(), loadSalesToday()]);
    }, 'Venta registrada.');
  }

  async function onFindSaleById(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!saleDetailId.trim()) {
      setError('Ingresa un ID de venta.');
      return;
    }

    await withLoader(async () => {
      const data = await apiRequest<Sale>(`/sales/${saleDetailId.trim()}`);
      setSelectedSale(data);
    });
  }

  async function onPatchSale(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!salePatchForm.saleId.trim()) {
      setError('Ingresa el ID de la venta a corregir.');
      return;
    }

    await withLoader(async () => {
      const updated = await apiRequest<Sale>(`/sales/${salePatchForm.saleId.trim()}`, {
        method: 'PATCH',
        body: {
          notes: salePatchForm.notes || undefined,
          invoiceEnabled: salePatchForm.invoiceEnabled,
        },
      });
      setSelectedSale(updated);
      await loadSalesToday();
    }, 'Venta corregida (si la ventana esta habilitada).');
  }

  async function onEnableEditWindow(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await withLoader(async () => {
      const payload = {
        branchId: enableEditForm.branchId,
        expiresAt: enableEditForm.expiresAt || undefined,
      };
      const result = await apiRequest<SalesEditControl>('/sales/edit/enable', {
        method: 'POST',
        body: payload,
      });
      setLastEditControl(result);
    }, 'Ventana de correccion habilitada.');
  }

  async function onCreateUser(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await withLoader(async () => {
      await apiRequest<User>('/users', {
        method: 'POST',
        body: {
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
          branchId: userForm.role === 'REGISTRADOR' ? userForm.branchId : undefined,
        },
      });
      setUserForm({
        username: '',
        email: '',
        password: '',
        role: 'REGISTRADOR',
        branchId: branches[0]?.id ?? '',
      });
      await loadUsers();
    }, 'Usuario creado.');
  }

  function startUserEdit(user: User): void {
    if (!canManageTargetUser(user)) {
      setError('Solo un OWNER puede editar otro OWNER.');
      return;
    }

    setUserEditForm({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      branchId: user.branch?.id ?? '',
    });
  }

  async function onUpdateUser(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!userEditForm.id) {
      setError('Selecciona un usuario para editar.');
      return;
    }

    if (!canManageTargetUser(selectedUserForEdit)) {
      setError('Solo un OWNER puede editar otro OWNER.');
      return;
    }

    await withLoader(async () => {
      const payload = {
        username: userEditForm.username,
        email: userEditForm.email,
        password: userEditForm.password || undefined,
        role: userEditForm.role,
        branchId: userEditForm.role === 'REGISTRADOR' ? userEditForm.branchId : undefined,
      };

      await apiRequest<User>(`/users/${userEditForm.id}`, {
        method: 'PATCH',
        body: payload,
      });
      await loadUsers();
    }, 'Usuario actualizado.');
  }

  async function toggleUserStatus(user: User): Promise<void> {
    if (!canManageTargetUser(user)) {
      setError('Solo un OWNER puede activar o desactivar un OWNER.');
      return;
    }

    await withLoader(async () => {
      await apiRequest<User>(`/users/${user.id}/status`, {
        method: 'PATCH',
        body: {
          isActive: !user.isActive,
        },
      });
      await loadUsers();
    }, 'Estado de usuario actualizado.');
  }

  async function onCreateBranch(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await withLoader(async () => {
      await apiRequest<Branch>('/branches', {
        method: 'POST',
        body: {
          name: branchForm.name,
        },
      });
      setBranchForm({ name: '' });
      await loadBranches();
    }, 'Sucursal creada.');
  }

  async function onEditBranch(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!branchEdit.id) {
      setError('Selecciona una sucursal para editar.');
      return;
    }

    await withLoader(async () => {
      await apiRequest<Branch>(`/branches/${branchEdit.id}`, {
        method: 'PATCH',
        body: {
          name: branchEdit.name || undefined,
          isActive: branchEdit.isActive,
        },
      });
      await loadBranches();
    }, 'Sucursal actualizada.');
  }

  async function loadReport(period: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    await withLoader(async () => {
      const query = {
        date: reportDate,
        branchId: reportBranchId || undefined,
      };
      const data = await apiRequest<LiquidationReport>(
        `/reports/liquidation/${period}`,
        { query },
      );

      if (period === 'daily') {
        setReportDaily(data);
      }
      if (period === 'weekly') {
        setReportWeekly(data);
      }
      if (period === 'monthly') {
        setReportMonthly(data);
      }
    });
  }

  const totalSalesToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);
  const totalStockItems = stock.length;
  const totalProducts = products.length;
  const totalTicketsToday = salesToday.length;
  const averageTicketToday = totalTicketsToday ? totalSalesToday / totalTicketsToday : 0;
  const unitsSoldToday = salesToday.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const salesByBranch = useMemo(
    () =>
      salesToday.reduce(
        (map, sale) => map.set(sale.branchName, (map.get(sale.branchName) ?? 0) + sale.total),
        new Map<string, number>(),
      ),
    [salesToday],
  );
  const topBranchToday = useMemo(
    () =>
      [...salesByBranch.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([branchName, total]) => ({ branchName, total }))[0],
    [salesByBranch],
  );
  const topProductsToday = useMemo(() => {
    const rows = new Map<string, { quantity: number; income: number }>();
    salesToday.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = rows.get(item.productName) ?? { quantity: 0, income: 0 };
        rows.set(item.productName, {
          quantity: current.quantity + item.quantity,
          income: current.income + item.total,
        });
      });
    });

    return [...rows.entries()]
      .map(([name, metrics]) => ({ name, ...metrics }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [salesToday]);
  const branchPieSlices = useMemo<OverviewPieSlice[]>(
    () =>
      [...salesByBranch.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value], index) => ({
          label,
          value,
          color: PIE_COLORS[index % PIE_COLORS.length],
        })),
    [salesByBranch],
  );
  const productPieSlices = useMemo<OverviewPieSlice[]>(
    () =>
      topProductsToday.map((item, index) => ({
        label: item.name,
        value: item.quantity,
        color: PIE_COLORS[index % PIE_COLORS.length],
      })),
    [topProductsToday],
  );
  const lowStockRows = useMemo(
    () =>
      stock
        .filter((item) => Number(item.quantity) <= 5)
        .sort((a, b) => Number(a.quantity) - Number(b.quantity))
        .slice(0, 5),
    [stock],
  );
  const saleSubtotalPreview = saleForm.items.reduce((sum, item) => {
    const qty = Number(item.quantity || '0');
    const price = Number(item.unitPrice || '0');
    return sum + qty * price;
  }, 0);
  const saleDiscountPreview = toNumber(saleForm.discount) ?? 0;
  const saleTotalPreview = Math.max(saleSubtotalPreview - saleDiscountPreview, 0);
  const isLight = theme === 'light';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div
      className={`dashboard-app relative min-h-screen overflow-hidden ${
        isLight
          ? 'bg-gradient-to-br from-slate-100 via-sky-100 to-cyan-100 text-slate-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_10%,rgba(14,165,233,0.3),transparent_34%),radial-gradient(circle_at_92%_4%,rgba(59,130,246,0.32),transparent_28%),radial-gradient(circle_at_50%_95%,rgba(6,182,212,0.22),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.05)_0%,transparent_40%,rgba(14,165,233,0.06)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.17] [background-image:linear-gradient(rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.28)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 top-28 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />

      <div className="relative mx-auto flex w-full flex-col gap-5 px-4 py-5 md:px-6 md:py-7 lg:px-8">
        <DashboardHeader
          activeTab={activeTab}
          activeTabHint={activeTabHint}
          isLight={isLight}
          onLogout={auth.logout}
          onReloadData={() => void loadInitialData()}
          onTabChange={(tabKey) => setActiveTab(tabKey as DashboardTab)}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          tabs={tabs}
          user={{
            branchName: auth.user?.branch?.name,
            role: auth.user?.role,
            username: auth.user?.username,
          }}
        />

        {error ? (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}
        {loading ? (
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            Procesando...
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <OverviewSection
            averageTicketToday={averageTicketToday}
            branchPieSlices={branchPieSlices}
            formatMoney={formatMoney}
            lowStockRows={lowStockRows}
            productPieSlices={productPieSlices}
            topBranchTodayName={topBranchToday?.branchName}
            topProductsToday={topProductsToday}
            totalProducts={totalProducts}
            totalSalesToday={totalSalesToday}
            totalStockItems={totalStockItems}
            totalTicketsToday={totalTicketsToday}
            unitsSoldToday={unitsSoldToday}
          />
        ) : null}

                {activeTab === 'products' ? (
          <ProductsSection
            branches={branches}
            buildUploadsUrl={buildUploadsUrl}
            canManage={canManage}
            csvBranchId={csvBranchId}
            csvResult={csvResult}
            editingProductId={editingProductId}
            formatMoney={formatMoney}
            loadProducts={loadProducts}
            onImportCsv={onImportCsv}
            onProductSubmit={onProductSubmit}
            onUploadPhoto={onUploadPhoto}
            photoUploadProductId={photoUploadProductId}
            productActiveFilter={productActiveFilter}
            productForm={productForm}
            productSearch={productSearch}
            productSiatFilter={productSiatFilter}
            products={products}
            setCsvBranchId={setCsvBranchId}
            setCsvFile={setCsvFile}
            setEditingProductId={setEditingProductId}
            setPhotoUploadFile={setPhotoUploadFile}
            setPhotoUploadProductId={setPhotoUploadProductId}
            setProductActiveFilter={setProductActiveFilter}
            setProductForm={setProductForm}
            setProductSearch={setProductSearch}
            setProductSiatFilter={setProductSiatFilter}
            startProductEdit={startProductEdit}
            visibleProducts={visibleProducts}
            withLoader={withLoader}
          />
        ) : null}

                {activeTab === 'inventory' ? (
          <InventorySection
            branches={branches}
            buildUploadsUrl={buildUploadsUrl}
            canManage={canManage}
            formatDate={formatDate}
            isOwner={isOwner}
            loadMovements={loadMovements}
            loadStock={loadStock}
            movementBranchId={movementBranchId}
            movements={movements}
            onAdjustStock={onAdjustStock}
            productPhotoById={productPhotoById}
            setMovementBranchId={setMovementBranchId}
            setStockAdjustForm={setStockAdjustForm}
            setStockBranchId={setStockBranchId}
            startStockAdjust={startStockAdjust}
            stock={stock}
            stockAdjustForm={stockAdjustForm}
            stockBranchId={stockBranchId}
            withLoader={withLoader}
          />
        ) : null}

                {activeTab === 'sales' ? (
          <SalesSection
            addProductToSale={addProductToSale}
            apiRequest={apiRequest}
            auth={auth}
            branches={branches}
            buildUploadsUrl={buildUploadsUrl}
            canManage={canManage}
            enableEditForm={enableEditForm}
            formatDate={formatDate}
            formatMoney={formatMoney}
            getAvailableStockInfo={getAvailableStockInfo}
            isOwner={isOwner}
            lastEditControl={lastEditControl}
            loadSalesToday={loadSalesToday}
            onCreateSale={onCreateSale}
            onEnableEditWindow={onEnableEditWindow}
            onFindSaleById={onFindSaleById}
            onPatchSale={onPatchSale}
            removeSaleItem={removeSaleItem}
            resolveLookupCandidate={resolveLookupCandidate}
            saleDetailId={saleDetailId}
            saleDiscountPreview={saleDiscountPreview}
            saleForm={saleForm}
            saleLookup={saleLookup}
            salePatchForm={salePatchForm}
            saleSearchLoading={saleSearchLoading}
            saleSearchMode={saleSearchMode}
            saleSearchResults={saleSearchResults}
            saleSubtotalPreview={saleSubtotalPreview}
            saleTotalPreview={saleTotalPreview}
            salesBranchId={salesBranchId}
            salesToday={salesToday}
            selectedSale={selectedSale}
            setEnableEditForm={setEnableEditForm}
            setSaleDetailId={setSaleDetailId}
            setSaleForm={setSaleForm}
            setSaleLookup={setSaleLookup}
            setSalePatchForm={setSalePatchForm}
            setSaleSearchMode={setSaleSearchMode}
            setSaleSearchResults={setSaleSearchResults}
            setSalesBranchId={setSalesBranchId}
            setSelectedSale={setSelectedSale}
            updateSaleItem={updateSaleItem}
            withLoader={withLoader}
          />
        ) : null}

                {activeTab === 'users' && canManage ? (
          <UsersSection
            branches={branches}
            canManageTargetUser={canManageTargetUser}
            isOwner={isOwner}
            onCreateUser={onCreateUser}
            onUpdateUser={onUpdateUser}
            setUserEditForm={setUserEditForm}
            setUserForm={setUserForm}
            startUserEdit={startUserEdit}
            toggleUserStatus={toggleUserStatus}
            userEditForm={userEditForm}
            userForm={userForm}
            users={users}
          />
        ) : null}

                {activeTab === 'branches' && canManage ? (
          <BranchesSection
            branchEdit={branchEdit}
            branchForm={branchForm}
            branches={branches}
            formatDate={formatDate}
            onCreateBranch={onCreateBranch}
            onEditBranch={onEditBranch}
            setBranchEdit={setBranchEdit}
            setBranchForm={setBranchForm}
          />
        ) : null}

                {activeTab === 'reports' && isOwner ? (
          <ReportsSection
            branches={branches}
            formatDate={formatDate}
            formatMoney={formatMoney}
            loadReport={loadReport}
            reportBranchId={reportBranchId}
            reportDaily={reportDaily}
            reportDate={reportDate}
            reportMonthly={reportMonthly}
            reportWeekly={reportWeekly}
            setReportBranchId={setReportBranchId}
            setReportDate={setReportDate}
          />
        ) : null}
      </div>
    </div>
  );
};









