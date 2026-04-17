import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

import { useAuth } from '../auth/auth-context';
import logo from '../assets/logo.png';
import { ThemeSwitch } from '../components/ThemeSwitch';
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

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

const PIE_COLORS = ['#06b6d4', '#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

function buildPieGradient(slices: PieSlice[]): string {
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
  const branchPieSlices = useMemo<PieSlice[]>(
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
  const productPieSlices = useMemo<PieSlice[]>(
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
  const branchPieStyle: CSSProperties = {
    background: buildPieGradient(branchPieSlices),
  };
  const productPieStyle: CSSProperties = {
    background: buildPieGradient(productPieSlices),
  };
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
        <header className="dashboard-hero -mx-4 border-y border-slate-700/80 bg-slate-900/85 px-4 py-5 shadow-xl backdrop-blur-md md:-mx-6 md:px-6 md:py-6 lg:-mx-8 lg:px-8">
          <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_auto] xl:items-center">
            <div className="flex justify-center xl:justify-start">
              <img
                src={logo}
                alt="Logo del sistema"
                className="h-16 w-full max-w-[240px] object-contain object-left"
              />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Panel operativo</p>
              <h1 className="text-3xl font-bold md:text-4xl">Sistema Inventario y Ventas</h1>
              <p className="text-sm text-slate-300">Gestion operativa por roles y sucursales</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 xl:justify-end">
              <ThemeSwitch
                isLight={isLight}
                onToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              />
              <button
                type="button"
                className="ui-secondary-btn rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                onClick={() => void loadInitialData()}
              >
                Recargar datos
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-cyan-500/25 text-cyan-300">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c1.8-4 5-6 8-6s6.2 2 8 6" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-100">{auth.user?.username}</p>
                  <p className="text-xs text-slate-400">
                    {auth.user?.role} | {auth.user?.branch?.name ?? 'Sin sucursal'}
                  </p>
                </div>
                <button
                  type="button"
                  className="ui-danger-btn rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-400"
                  onClick={auth.logout}
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-center">
            <div className="inline-flex flex-wrap justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/40 p-2 shadow-[0_16px_35px_-24px_rgba(8,47,73,0.7)]">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_10px_24px_-14px_rgba(6,182,212,0.85)]'
                      : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-3xl rounded-full border border-slate-700/80 bg-slate-950/50 px-4 py-2 text-center text-sm text-slate-300">
            {activeTabHint}
          </p>
        </header>

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
                        <p className="text-right text-sm font-semibold text-cyan-300">
                          {item.quantity} u
                        </p>
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
                  Sucursal lider:{' '}
                  <span className="font-semibold text-cyan-300">
                    {topBranchToday ? topBranchToday.branchName : 'N/A'}
                  </span>
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
                <p className="mt-3 text-sm text-slate-400">
                  No hay alertas de stock bajo con los datos actuales.
                </p>
              )}
            </article>
          </section>
        ) : null}

        {activeTab === 'products' ? (
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
                      {visibleProducts.map((product) => (
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
                      setProductForm((prev) => ({ ...prev, brandName: event.target.value }))
                    }
                    placeholder="Marca"
                    className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
                    required
                  />
                  <input
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Nombre del producto"
                    className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
                    required
                  />
                  <input
                    value={productForm.barcode}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, barcode: event.target.value }))
                    }
                    placeholder="Codigo de barras (opcional)"
                    className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none"
                  />
                  <input
                    value={productForm.defaultPrice}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, defaultPrice: event.target.value }))
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
                        setProductForm((prev) => ({
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
                        setProductForm((prev) => ({
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
                        setProductForm((prev) => ({
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
                    {visibleProducts.map((product) => (
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
                      {branches.map((branch) => (
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
                      .filter((product) => !!product.photoUrl)
                      .slice(0, 6)
                      .map((product) => (
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
        ) : null}

        {activeTab === 'inventory' ? (
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
                      {branches.map((branch) => (
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
                      {stock.map((item) => (
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
                      {branches.map((branch) => (
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
                        {movements.map((movement) => (
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
                      const selected = stock.find((item) => item.id === event.target.value);
                      if (!selected) {
                        return;
                      }
                      startStockAdjust(selected);
                    }}
                    className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Selecciona producto/sucursal</option>
                    {stock.map((item) => (
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
                          setStockAdjustForm((prev) => ({
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
                      setStockAdjustForm((prev) => ({
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
                      setStockAdjustForm((prev) => ({
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
        ) : null}

        {activeTab === 'sales' ? (
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
                      setSaleForm((prev) => ({ ...prev, branchId: event.target.value }))
                    }
                    className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sucursal</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-slate-400">
                    Sucursal forzada por token: {auth.user?.branch?.name ?? 'N/A'}
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
                        onClick={() =>
                          setSaleSearchMode(mode.value as 'ALL' | 'NAME' | 'BARCODE')
                        }
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
                      const candidate = resolveLookupCandidate(
                        saleLookup,
                        saleSearchResults,
                      );
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
                  {saleSearchLoading ? (
                    <p className="text-xs text-slate-400">Buscando productos...</p>
                  ) : null}
                  {saleSearchResults.length ? (
                    <div className="grid gap-2">
                      {saleSearchResults.slice(0, 6).map((product) => {
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
                              {product.brand.name} • {product.barcode ?? 'Sin barcode'}
                            </p>
                            <p
                              className={`truncate text-xs ${
                                stockInfo.currentBranchStock > 0
                                  ? 'text-emerald-300'
                                  : 'text-amber-300'
                              }`}
                            >
                              Stock en sucursal: {stockInfo.currentBranchStock}
                              {stockInfo.otherBranchesStock > 0
                                ? ` (otras sucursales: ${stockInfo.otherBranchesStock})`
                                : ''}
                            </p>
                            {stockInfo.currentBranchStock <= 0 &&
                            stockInfo.otherBranchesStock > 0 ? (
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
                    saleForm.items.map((item, index) => {
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
                          <p className="truncate text-xs text-slate-400">
                            Barcode: {item.barcode ?? 'N/A'}
                          </p>
                          <p
                            className={`truncate text-xs ${
                              stockInfo.currentBranchStock > 0
                                ? 'text-emerald-300'
                                : 'text-amber-300'
                            }`}
                          >
                            Stock en sucursal: {stockInfo.currentBranchStock}
                            {stockInfo.otherBranchesStock > 0
                              ? ` (otras sucursales: ${stockInfo.otherBranchesStock})`
                              : ''}
                          </p>
                          {stockInfo.currentBranchStock <= 0 &&
                          stockInfo.otherBranchesStock > 0 ? (
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
                              (Number(item.quantity || '0') || 0) *
                                (Number(item.unitPrice || '0') || 0),
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
                      setSaleForm((prev) => ({ ...prev, discount: event.target.value }))
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
                        setSaleForm((prev) => ({
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
                    setSaleForm((prev) => ({ ...prev, notes: event.target.value }))
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
                      {branches.map((branch) => (
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
                        {salesToday.map((sale) => (
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
                                    const data = await apiRequest<Sale>(`/sales/${sale.id}`);
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

            {canManage ? <div className="space-y-4">
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
                    setSalePatchForm((prev) => ({ ...prev, saleId: event.target.value }))
                  }
                  placeholder="ID de venta"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                />
                <textarea
                  value={salePatchForm.notes}
                  onChange={(event) =>
                    setSalePatchForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Notas"
                  className="h-20 w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={salePatchForm.invoiceEnabled}
                    onChange={(event) =>
                      setSalePatchForm((prev) => ({
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
                      setEnableEditForm((prev) => ({ ...prev, branchId: event.target.value }))
                    }
                    className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sucursal</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={enableEditForm.expiresAt}
                    onChange={(event) =>
                      setEnableEditForm((prev) => ({ ...prev, expiresAt: event.target.value }))
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
                    {selectedSale.id} | {selectedSale.branchName} |{' '}
                    {formatDate(selectedSale.createdAt)}
                  </p>
                  <p className="text-sm text-slate-400">
                    Total: {formatMoney(selectedSale.total)} | Subtotal:{' '}
                    {formatMoney(selectedSale.subtotal)} | Descuento:{' '}
                    {formatMoney(selectedSale.discount)}
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    {selectedSale.items.map((item) => (
                      <p key={item.id}>
                        {item.productName} - {item.quantity} x {formatMoney(item.unitPrice)} ={' '}
                        {formatMoney(item.total)}
                      </p>
                    ))}
                  </div>
                </article>
              ) : null}
            </div> : null}
          </section>
        ) : null}

        {activeTab === 'users' && canManage ? (
          <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-3 text-lg font-semibold">Usuarios</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="pb-2">Usuario</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Rol</th>
                      <th className="pb-2">Sucursal</th>
                      <th className="pb-2">Estado</th>
                      <th className="pb-2">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const canManageThisUser = canManageTargetUser(user);
                      return (
                        <tr key={user.id} className="border-t border-slate-800">
                          <td className="py-2">{user.username}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>{user.branch?.name ?? '-'}</td>
                          <td>{user.isActive ? 'Activo' : 'Inactivo'}</td>
                          <td className="flex gap-2 py-2">
                            <button
                              type="button"
                              className="rounded-lg border border-cyan-500/40 px-3 py-1 text-xs text-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-45"
                              onClick={() => startUserEdit(user)}
                              disabled={!canManageThisUser}
                              title={!canManageThisUser ? 'Solo OWNER puede editar OWNER' : undefined}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                              onClick={() => void toggleUserStatus(user)}
                              disabled={!canManageThisUser}
                              title={!canManageThisUser ? 'Solo OWNER puede activar/desactivar OWNER' : undefined}
                            >
                              {user.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-4">
              <form
                className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
                onSubmit={(event) => void onCreateUser(event)}
              >
                <h3 className="text-lg font-semibold">Crear usuario</h3>
                <input
                  value={userForm.username}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="Username"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                />
                <input
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  type="email"
                  placeholder="Email"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                />
                <input
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  type="password"
                  placeholder="Password"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                />
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
                  }
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  {isOwner ? <option value="OWNER">OWNER</option> : null}
                  <option value="ADMIN">ADMIN</option>
                  <option value="REGISTRADOR">REGISTRADOR</option>
                </select>
                {userForm.role === 'REGISTRADOR' ? (
                  <select
                    value={userForm.branchId}
                    onChange={(event) =>
                      setUserForm((prev) => ({ ...prev, branchId: event.target.value }))
                    }
                    className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sucursal</option>
                    {branches.map((branch) => (
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
                  Crear usuario
                </button>
              </form>

              <form
                className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
                onSubmit={(event) => void onUpdateUser(event)}
              >
                <h3 className="text-lg font-semibold">Editar usuario</h3>
                <select
                  value={userEditForm.id}
                  onChange={(event) => {
                    const selected = users.find((item) => item.id === event.target.value);
                    if (!selected) {
                      return;
                    }

                    startUserEdit(selected);
                  }}
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecciona usuario</option>
                  {users
                    .filter((item) => canManageTargetUser(item))
                    .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.username} ({item.role})
                    </option>
                    ))}
                </select>
                <input
                  value={userEditForm.username}
                  onChange={(event) =>
                    setUserEditForm((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="Username"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                />
                <input
                  value={userEditForm.email}
                  onChange={(event) =>
                    setUserEditForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  type="email"
                  placeholder="Email"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                />
                <input
                  value={userEditForm.password}
                  onChange={(event) =>
                    setUserEditForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  type="password"
                  placeholder="Nuevo password (opcional)"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <select
                  value={userEditForm.role}
                  onChange={(event) =>
                    setUserEditForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
                  }
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  {isOwner ? <option value="OWNER">OWNER</option> : null}
                  <option value="ADMIN">ADMIN</option>
                  <option value="REGISTRADOR">REGISTRADOR</option>
                </select>
                {userEditForm.role === 'REGISTRADOR' ? (
                  <select
                    value={userEditForm.branchId}
                    onChange={(event) =>
                      setUserEditForm((prev) => ({ ...prev, branchId: event.target.value }))
                    }
                    className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sucursal</option>
                    {branches.map((branch) => (
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
                  Guardar cambios
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {activeTab === 'branches' && canManage ? (
          <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-3 text-lg font-semibold">Sucursales</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="pb-2">Nombre</th>
                      <th className="pb-2">Estado</th>
                      <th className="pb-2">Actualizado</th>
                      <th className="pb-2">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((branch) => (
                      <tr key={branch.id} className="border-t border-slate-800">
                        <td className="py-2">{branch.name}</td>
                        <td>{branch.isActive ? 'Activa' : 'Inactiva'}</td>
                        <td>{formatDate(branch.updatedAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
                            onClick={() =>
                              setBranchEdit({
                                id: branch.id,
                                name: branch.name,
                                isActive: branch.isActive,
                              })
                            }
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-4">
              <form
                className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
                onSubmit={(event) => void onCreateBranch(event)}
              >
                <h3 className="text-lg font-semibold">Nueva sucursal</h3>
                <input
                  value={branchForm.name}
                  onChange={(event) =>
                    setBranchForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Nombre"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Crear sucursal
                </button>
              </form>

              <form
                className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
                onSubmit={(event) => void onEditBranch(event)}
              >
                <h3 className="text-lg font-semibold">Editar sucursal</h3>
                <select
                  value={branchEdit.id}
                  onChange={(event) => {
                    const selected = branches.find(
                      (branch) => branch.id === event.target.value,
                    );
                    setBranchEdit({
                      id: selected?.id ?? '',
                      name: selected?.name ?? '',
                      isActive: selected?.isActive ?? true,
                    });
                  }}
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="">Selecciona sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <input
                  value={branchEdit.name}
                  onChange={(event) =>
                    setBranchEdit((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Nuevo nombre"
                  className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={branchEdit.isActive}
                    onChange={(event) =>
                      setBranchEdit((prev) => ({ ...prev, isActive: event.target.checked }))
                    }
                  />
                  Sucursal activa
                </label>
                <button
                  type="submit"
                  className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Guardar cambios
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {activeTab === 'reports' && isOwner ? (
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
                {branches.map((branch) => (
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
                      <p className="mt-3 text-sm text-slate-400">
                        Aun no se cargo este periodo.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};



