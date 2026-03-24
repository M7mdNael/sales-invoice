import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface Company {
  id: string;
  name: string;
  notes: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface SalesInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  customerName: string;
  date: string;
  items: SalesInvoiceItem[];
  total: number;
}

export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ReturnInvoice {
  id: string;
  returnNumber: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  companyId: string;
  companyName: string;
  customerName: string;
  date: string;
  items: ReturnItem[];
  total: number;
}

interface AppContextValue {
  companies: Company[];
  products: Product[];
  salesInvoices: SalesInvoice[];
  returnInvoices: ReturnInvoice[];
  trashedInvoices: SalesInvoice[];
  trashedReturns: ReturnInvoice[];
  isLoading: boolean;
  addCompany: (name: string, notes: string) => Company;
  updateCompany: (id: string, name: string, notes: string) => void;
  deleteCompany: (id: string) => void;
  addProduct: (name: string, price: number) => void;
  updateProduct: (id: string, name: string, price: number) => void;
  deleteProduct: (id: string) => void;
  addSalesInvoice: (
    company: Company,
    customerName: string,
    items: Omit<SalesInvoiceItem, "id">[]
  ) => SalesInvoice;
  updateSalesInvoice: (
    id: string,
    company: Company,
    customerName: string,
    items: Omit<SalesInvoiceItem, "id">[]
  ) => SalesInvoice;
  addReturnInvoice: (
    originalInvoice: SalesInvoice,
    items: Omit<ReturnItem, "id">[]
  ) => ReturnInvoice;
  deleteSalesInvoice: (id: string) => void;
  deleteReturnInvoice: (id: string) => void;
  restoreSalesInvoice: (id: string) => void;
  restoreReturnInvoice: (id: string) => void;
  permanentlyDeleteInvoice: (id: string) => void;
  permanentlyDeleteReturn: (id: string) => void;
  emptyTrash: () => void;
  getNextInvoiceNumber: () => string;
  getNextReturnNumber: () => string;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  companies: "@invoice_app/companies",
  products: "@invoice_app/products",
  salesInvoices: "@invoice_app/sales_invoices",
  returnInvoices: "@invoice_app/return_invoices",
  trashedInvoices: "@invoice_app/trashed_invoices",
  trashedReturns: "@invoice_app/trashed_returns",
  invoiceCounter: "@invoice_app/invoice_counter",
  returnCounter: "@invoice_app/return_counter",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function migrateSalesInvoice(raw: Record<string, unknown>): SalesInvoice {
  return {
    id: raw.id as string,
    invoiceNumber: raw.invoiceNumber as string,
    companyId: (raw.companyId as string) ?? "",
    companyName: (raw.companyName as string) ?? (raw.customerName as string) ?? "",
    customerName: (raw.customerName as string) ?? "",
    date: raw.date as string,
    items: (raw.items as SalesInvoiceItem[]) ?? [],
    total: raw.total as number,
  };
}

function migrateReturnInvoice(raw: Record<string, unknown>): ReturnInvoice {
  return {
    id: raw.id as string,
    returnNumber: raw.returnNumber as string,
    originalInvoiceId: raw.originalInvoiceId as string,
    originalInvoiceNumber: raw.originalInvoiceNumber as string,
    companyId: (raw.companyId as string) ?? "",
    companyName: (raw.companyName as string) ?? (raw.customerName as string) ?? "",
    customerName: (raw.customerName as string) ?? "",
    date: raw.date as string,
    items: (raw.items as ReturnItem[]) ?? [],
    total: raw.total as number,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [returnInvoices, setReturnInvoices] = useState<ReturnInvoice[]>([]);
  const [trashedInvoices, setTrashedInvoices] = useState<SalesInvoice[]>([]);
  const [trashedReturns, setTrashedReturns] = useState<ReturnInvoice[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState(0);
  const [returnCounter, setReturnCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, s, r, ti, tr, ic, rc] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.companies),
          AsyncStorage.getItem(STORAGE_KEYS.products),
          AsyncStorage.getItem(STORAGE_KEYS.salesInvoices),
          AsyncStorage.getItem(STORAGE_KEYS.returnInvoices),
          AsyncStorage.getItem(STORAGE_KEYS.trashedInvoices),
          AsyncStorage.getItem(STORAGE_KEYS.trashedReturns),
          AsyncStorage.getItem(STORAGE_KEYS.invoiceCounter),
          AsyncStorage.getItem(STORAGE_KEYS.returnCounter),
        ]);
        if (c) setCompanies(JSON.parse(c));
        if (p) setProducts(JSON.parse(p));
        if (s) {
          const parsed = JSON.parse(s);
          setSalesInvoices(parsed.map(migrateSalesInvoice));
        }
        if (r) {
          const parsed = JSON.parse(r);
          setReturnInvoices(parsed.map(migrateReturnInvoice));
        }
        if (ti) setTrashedInvoices(JSON.parse(ti).map(migrateSalesInvoice));
        if (tr) setTrashedReturns(JSON.parse(tr).map(migrateReturnInvoice));
        if (ic) setInvoiceCounter(parseInt(ic, 10));
        if (rc) setReturnCounter(parseInt(rc, 10));
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const saveCompanies = useCallback(async (data: Company[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(data));
  }, []);

  const saveProducts = useCallback(async (data: Product[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.products, JSON.stringify(data));
  }, []);

  const saveSalesInvoices = useCallback(async (data: SalesInvoice[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.salesInvoices, JSON.stringify(data));
  }, []);

  const saveReturnInvoices = useCallback(async (data: ReturnInvoice[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.returnInvoices, JSON.stringify(data));
  }, []);

  const saveTrashedInvoices = useCallback(async (data: SalesInvoice[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.trashedInvoices, JSON.stringify(data));
  }, []);

  const saveTrashedReturns = useCallback(async (data: ReturnInvoice[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.trashedReturns, JSON.stringify(data));
  }, []);

  const addCompany = useCallback(
    (name: string, notes: string): Company => {
      const company: Company = { id: generateId(), name: name.trim(), notes: notes.trim() };
      const updated = [...companies, company];
      setCompanies(updated);
      saveCompanies(updated);
      return company;
    },
    [companies, saveCompanies]
  );

  const updateCompany = useCallback(
    (id: string, name: string, notes: string) => {
      const updated = companies.map((c) =>
        c.id === id ? { ...c, name: name.trim(), notes: notes.trim() } : c
      );
      setCompanies(updated);
      saveCompanies(updated);
    },
    [companies, saveCompanies]
  );

  const deleteCompany = useCallback(
    (id: string) => {
      const updated = companies.filter((c) => c.id !== id);
      setCompanies(updated);
      saveCompanies(updated);
    },
    [companies, saveCompanies]
  );

  const addProduct = useCallback(
    (name: string, price: number) => {
      const product: Product = { id: generateId(), name, price };
      const updated = [...products, product];
      setProducts(updated);
      saveProducts(updated);
    },
    [products, saveProducts]
  );

  const updateProduct = useCallback(
    (id: string, name: string, price: number) => {
      const updated = products.map((p) =>
        p.id === id ? { ...p, name, price } : p
      );
      setProducts(updated);
      saveProducts(updated);
    },
    [products, saveProducts]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      saveProducts(updated);
    },
    [products, saveProducts]
  );

  const getNextInvoiceNumber = useCallback(() => {
    const next = invoiceCounter + 1;
    return `INV-${String(next).padStart(4, "0")}`;
  }, [invoiceCounter]);

  const getNextReturnNumber = useCallback(() => {
    const next = returnCounter + 1;
    return `RET-${String(next).padStart(4, "0")}`;
  }, [returnCounter]);

  const addSalesInvoice = useCallback(
    (company: Company, customerName: string, items: Omit<SalesInvoiceItem, "id">[]) => {
      const next = invoiceCounter + 1;
      const invoice: SalesInvoice = {
        id: generateId(),
        invoiceNumber: `INV-${String(next).padStart(4, "0")}`,
        companyId: company.id,
        companyName: company.name,
        customerName: customerName.trim(),
        date: new Date().toISOString(),
        items: items.map((item) => ({ ...item, id: generateId() })),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
      const updated = [...salesInvoices, invoice];
      setSalesInvoices(updated);
      saveSalesInvoices(updated);
      setInvoiceCounter(next);
      AsyncStorage.setItem(STORAGE_KEYS.invoiceCounter, String(next));
      return invoice;
    },
    [invoiceCounter, salesInvoices, saveSalesInvoices]
  );

  const updateSalesInvoice = useCallback(
    (id: string, company: Company, customerName: string, items: Omit<SalesInvoiceItem, "id">[]) => {
      const existing = salesInvoices.find((inv) => inv.id === id);
      if (!existing) throw new Error("Invoice not found");
      const updated_invoice: SalesInvoice = {
        ...existing,
        companyId: company.id,
        companyName: company.name,
        customerName: customerName.trim(),
        items: items.map((item) => ({ ...item, id: generateId() })),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
      const updated = salesInvoices.map((inv) =>
        inv.id === id ? updated_invoice : inv
      );
      setSalesInvoices(updated);
      saveSalesInvoices(updated);
      return updated_invoice;
    },
    [salesInvoices, saveSalesInvoices]
  );

  const addReturnInvoice = useCallback(
    (originalInvoice: SalesInvoice, items: Omit<ReturnItem, "id">[]) => {
      const next = returnCounter + 1;
      const returnInv: ReturnInvoice = {
        id: generateId(),
        returnNumber: `RET-${String(next).padStart(4, "0")}`,
        originalInvoiceId: originalInvoice.id,
        originalInvoiceNumber: originalInvoice.invoiceNumber,
        companyId: originalInvoice.companyId,
        companyName: originalInvoice.companyName,
        customerName: originalInvoice.customerName,
        date: new Date().toISOString(),
        items: items.map((item) => ({ ...item, id: generateId() })),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      };
      const updated = [...returnInvoices, returnInv];
      setReturnInvoices(updated);
      saveReturnInvoices(updated);
      setReturnCounter(next);
      AsyncStorage.setItem(STORAGE_KEYS.returnCounter, String(next));
      return returnInv;
    },
    [returnCounter, returnInvoices, saveReturnInvoices]
  );

  const deleteSalesInvoice = useCallback(
    (id: string) => {
      const item = salesInvoices.find((inv) => inv.id === id);
      if (!item) return;
      const updatedActive = salesInvoices.filter((inv) => inv.id !== id);
      const updatedTrash = [...trashedInvoices, item];
      setSalesInvoices(updatedActive);
      setTrashedInvoices(updatedTrash);
      saveSalesInvoices(updatedActive);
      saveTrashedInvoices(updatedTrash);
    },
    [salesInvoices, trashedInvoices, saveSalesInvoices, saveTrashedInvoices]
  );

  const deleteReturnInvoice = useCallback(
    (id: string) => {
      const item = returnInvoices.find((r) => r.id === id);
      if (!item) return;
      const updatedActive = returnInvoices.filter((r) => r.id !== id);
      const updatedTrash = [...trashedReturns, item];
      setReturnInvoices(updatedActive);
      setTrashedReturns(updatedTrash);
      saveReturnInvoices(updatedActive);
      saveTrashedReturns(updatedTrash);
    },
    [returnInvoices, trashedReturns, saveReturnInvoices, saveTrashedReturns]
  );

  const restoreSalesInvoice = useCallback(
    (id: string) => {
      const item = trashedInvoices.find((inv) => inv.id === id);
      if (!item) return;
      const updatedTrash = trashedInvoices.filter((inv) => inv.id !== id);
      const updatedActive = [...salesInvoices, item];
      setTrashedInvoices(updatedTrash);
      setSalesInvoices(updatedActive);
      saveTrashedInvoices(updatedTrash);
      saveSalesInvoices(updatedActive);
    },
    [trashedInvoices, salesInvoices, saveTrashedInvoices, saveSalesInvoices]
  );

  const restoreReturnInvoice = useCallback(
    (id: string) => {
      const item = trashedReturns.find((r) => r.id === id);
      if (!item) return;
      const updatedTrash = trashedReturns.filter((r) => r.id !== id);
      const updatedActive = [...returnInvoices, item];
      setTrashedReturns(updatedTrash);
      setReturnInvoices(updatedActive);
      saveTrashedReturns(updatedTrash);
      saveReturnInvoices(updatedActive);
    },
    [trashedReturns, returnInvoices, saveTrashedReturns, saveReturnInvoices]
  );

  const permanentlyDeleteInvoice = useCallback(
    (id: string) => {
      const updated = trashedInvoices.filter((inv) => inv.id !== id);
      setTrashedInvoices(updated);
      saveTrashedInvoices(updated);
    },
    [trashedInvoices, saveTrashedInvoices]
  );

  const permanentlyDeleteReturn = useCallback(
    (id: string) => {
      const updated = trashedReturns.filter((r) => r.id !== id);
      setTrashedReturns(updated);
      saveTrashedReturns(updated);
    },
    [trashedReturns, saveTrashedReturns]
  );

  const emptyTrash = useCallback(() => {
    setTrashedInvoices([]);
    setTrashedReturns([]);
    saveTrashedInvoices([]);
    saveTrashedReturns([]);
  }, [saveTrashedInvoices, saveTrashedReturns]);

  const value = useMemo(
    () => ({
      companies,
      products,
      salesInvoices,
      returnInvoices,
      trashedInvoices,
      trashedReturns,
      isLoading,
      addCompany,
      updateCompany,
      deleteCompany,
      addProduct,
      updateProduct,
      deleteProduct,
      addSalesInvoice,
      updateSalesInvoice,
      addReturnInvoice,
      deleteSalesInvoice,
      deleteReturnInvoice,
      restoreSalesInvoice,
      restoreReturnInvoice,
      permanentlyDeleteInvoice,
      permanentlyDeleteReturn,
      emptyTrash,
      getNextInvoiceNumber,
      getNextReturnNumber,
    }),
    [
      companies,
      products,
      salesInvoices,
      returnInvoices,
      trashedInvoices,
      trashedReturns,
      isLoading,
      addCompany,
      updateCompany,
      deleteCompany,
      addProduct,
      updateProduct,
      deleteProduct,
      addSalesInvoice,
      updateSalesInvoice,
      addReturnInvoice,
      deleteSalesInvoice,
      deleteReturnInvoice,
      restoreSalesInvoice,
      restoreReturnInvoice,
      permanentlyDeleteInvoice,
      permanentlyDeleteReturn,
      emptyTrash,
      getNextInvoiceNumber,
      getNextReturnNumber,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
