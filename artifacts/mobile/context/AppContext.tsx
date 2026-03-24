import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  customerName: string;
  date: string;
  items: ReturnItem[];
  total: number;
}

interface AppContextValue {
  products: Product[];
  salesInvoices: SalesInvoice[];
  returnInvoices: ReturnInvoice[];
  isLoading: boolean;
  addProduct: (name: string, price: number) => void;
  updateProduct: (id: string, name: string, price: number) => void;
  deleteProduct: (id: string) => void;
  addSalesInvoice: (
    customerName: string,
    items: Omit<SalesInvoiceItem, "id">[]
  ) => SalesInvoice;
  addReturnInvoice: (
    originalInvoice: SalesInvoice,
    items: Omit<ReturnItem, "id">[]
  ) => ReturnInvoice;
  getNextInvoiceNumber: () => string;
  getNextReturnNumber: () => string;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  products: "@invoice_app/products",
  salesInvoices: "@invoice_app/sales_invoices",
  returnInvoices: "@invoice_app/return_invoices",
  invoiceCounter: "@invoice_app/invoice_counter",
  returnCounter: "@invoice_app/return_counter",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [returnInvoices, setReturnInvoices] = useState<ReturnInvoice[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState(0);
  const [returnCounter, setReturnCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s, r, ic, rc] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.products),
          AsyncStorage.getItem(STORAGE_KEYS.salesInvoices),
          AsyncStorage.getItem(STORAGE_KEYS.returnInvoices),
          AsyncStorage.getItem(STORAGE_KEYS.invoiceCounter),
          AsyncStorage.getItem(STORAGE_KEYS.returnCounter),
        ]);
        if (p) setProducts(JSON.parse(p));
        if (s) setSalesInvoices(JSON.parse(s));
        if (r) setReturnInvoices(JSON.parse(r));
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

  const saveProducts = useCallback(async (data: Product[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.products, JSON.stringify(data));
  }, []);

  const saveSalesInvoices = useCallback(async (data: SalesInvoice[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.salesInvoices,
      JSON.stringify(data)
    );
  }, []);

  const saveReturnInvoices = useCallback(async (data: ReturnInvoice[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.returnInvoices,
      JSON.stringify(data)
    );
  }, []);

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
    (customerName: string, items: Omit<SalesInvoiceItem, "id">[]) => {
      const next = invoiceCounter + 1;
      const invoice: SalesInvoice = {
        id: generateId(),
        invoiceNumber: `INV-${String(next).padStart(4, "0")}`,
        customerName,
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

  const addReturnInvoice = useCallback(
    (originalInvoice: SalesInvoice, items: Omit<ReturnItem, "id">[]) => {
      const next = returnCounter + 1;
      const returnInv: ReturnInvoice = {
        id: generateId(),
        returnNumber: `RET-${String(next).padStart(4, "0")}`,
        originalInvoiceId: originalInvoice.id,
        originalInvoiceNumber: originalInvoice.invoiceNumber,
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

  const value = useMemo(
    () => ({
      products,
      salesInvoices,
      returnInvoices,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      addSalesInvoice,
      addReturnInvoice,
      getNextInvoiceNumber,
      getNextReturnNumber,
    }),
    [
      products,
      salesInvoices,
      returnInvoices,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      addSalesInvoice,
      addReturnInvoice,
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
