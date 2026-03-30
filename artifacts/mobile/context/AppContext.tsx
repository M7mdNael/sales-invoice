import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { UserContext } from "./UserContext";
import { getApiBase } from "@/utils/api";

export interface Company {
  id: string;
  name: string;
  notes: string;
  ownerId: string;
  members: string[];
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
  creatorEmail: string;
  creatorName: string;
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
  creatorEmail: string;
  creatorName: string;
}

interface AppContextValue {
  companies: Company[];
  products: Product[];
  salesInvoices: SalesInvoice[];
  returnInvoices: ReturnInvoice[];
  trashedInvoices: SalesInvoice[];
  trashedReturns: ReturnInvoice[];
  isLoading: boolean;
  isSyncing: boolean;
  addCompany: (name: string, notes: string, ownerId: string) => Company;
  updateCompany: (id: string, name: string, notes: string) => void;
  deleteCompany: (id: string) => void;
  inviteMember: (companyId: string, phoneNumber: string) => boolean;
  removeMember: (companyId: string, phoneNumber: string) => void;
  addProduct: (name: string, price: number) => void;
  updateProduct: (id: string, name: string, price: number) => void;
  deleteProduct: (id: string) => void;
  addSalesInvoice: (
    company: Company,
    customerName: string,
    items: Omit<SalesInvoiceItem, "id">[]
  ) => Promise<SalesInvoice>;
  updateSalesInvoice: (
    id: string,
    company: Company,
    customerName: string,
    items: Omit<SalesInvoiceItem, "id">[]
  ) => Promise<SalesInvoice>;
  addReturnInvoice: (
    originalInvoice: SalesInvoice,
    items: Omit<ReturnItem, "id">[]
  ) => Promise<ReturnInvoice>;
  addStandaloneReturn: (
    company: Company,
    items: Omit<ReturnItem, "id">[]
  ) => Promise<ReturnInvoice>;
  updateReturnInvoice: (
    id: string,
    company: Company,
    items: Omit<ReturnItem, "id">[]
  ) => Promise<ReturnInvoice>;
  deleteSalesInvoice: (id: string) => Promise<void>;
  deleteReturnInvoice: (id: string) => Promise<void>;
  restoreSalesInvoice: (id: string) => Promise<void>;
  restoreReturnInvoice: (id: string) => Promise<void>;
  permanentlyDeleteInvoice: (id: string) => Promise<void>;
  permanentlyDeleteReturn: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  getNextInvoiceNumber: () => string;
  getNextReturnNumber: () => string;
  refreshFromServer: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  companies: "@invoice_app/companies",
  products: "@invoice_app/products",
  invoiceCounter: "@invoice_app/invoice_counter",
  returnCounter: "@invoice_app/return_counter",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function migrateCompany(raw: Record<string, unknown>): Company {
  return {
    id: raw.id as string,
    name: raw.name as string,
    notes: (raw.notes as string) ?? "",
    ownerId: (raw.ownerId as string) ?? "",
    members: (raw.members as string[]) ?? [],
  };
}

function migrateSalesInvoice(raw: Record<string, unknown>): SalesInvoice {
  return {
    id: raw.id as string,
    invoiceNumber: (raw.invoiceNumber as string) ?? "",
    companyId: (raw.companyId as string) ?? "",
    companyName: (raw.companyName as string) ?? "",
    customerName: (raw.customerName as string) ?? "",
    date: (raw.date as string) ?? new Date().toISOString(),
    items: (raw.items as SalesInvoiceItem[]) ?? [],
    total: (raw.total as number) ?? 0,
    creatorEmail: (raw.creatorEmail as string) ?? "",
    creatorName: (raw.creatorName as string) ?? "",
  };
}

function migrateReturnInvoice(raw: Record<string, unknown>): ReturnInvoice {
  return {
    id: raw.id as string,
    returnNumber: (raw.returnNumber as string) ?? "",
    originalInvoiceId: (raw.originalInvoiceId as string) ?? "",
    originalInvoiceNumber: (raw.originalInvoiceNumber as string) ?? "",
    companyId: (raw.companyId as string) ?? "",
    companyName: (raw.companyName as string) ?? "",
    customerName: (raw.customerName as string) ?? "",
    date: (raw.date as string) ?? new Date().toISOString(),
    items: (raw.items as ReturnItem[]) ?? [],
    total: (raw.total as number) ?? 0,
    creatorEmail: (raw.creatorEmail as string) ?? "",
    creatorName: (raw.creatorName as string) ?? "",
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const userCtx = useContext(UserContext);
  const user = userCtx?.user ?? null;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [returnInvoices, setReturnInvoices] = useState<ReturnInvoice[]>([]);
  const [trashedInvoices, setTrashedInvoices] = useState<SalesInvoice[]>([]);
  const [trashedReturns, setTrashedReturns] = useState<ReturnInvoice[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState(0);
  const [returnCounter, setReturnCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastFetchedEmail = useRef<string | null>(null);
  const invoiceCounterRef = useRef(0);
  const returnCounterRef = useRef(0);
  const isFetchingRef = useRef(false);

  const fetchFromServer = useCallback(async () => {
    if (!user?.email) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsSyncing(true);
    try {
      const emailParam = encodeURIComponent(user.email);
      const [invRes, retRes, trashInvRes, trashRetRes, compRes, prodRes] = await Promise.all([
        fetch(`${getApiBase()}/api/invoices?email=${emailParam}`),
        fetch(`${getApiBase()}/api/returns?email=${emailParam}`),
        fetch(`${getApiBase()}/api/invoices?email=${emailParam}&deleted=true`),
        fetch(`${getApiBase()}/api/returns?email=${emailParam}&deleted=true`),
        fetch(`${getApiBase()}/api/companies?email=${emailParam}`),
        fetch(`${getApiBase()}/api/products?email=${emailParam}`),
      ]);
      const [invData, retData, trashInvData, trashRetData, compData, prodData] = await Promise.all([
        invRes.json(), retRes.json(), trashInvRes.json(), trashRetRes.json(),
        compRes.json(), prodRes.json(),
      ]);

      if (invData.invoices) setSalesInvoices(invData.invoices.map(migrateSalesInvoice));
      if (retData.returns) setReturnInvoices(retData.returns.map(migrateReturnInvoice));
      if (trashInvData.invoices) setTrashedInvoices(trashInvData.invoices.map(migrateSalesInvoice));
      if (trashRetData.returns) setTrashedReturns(trashRetData.returns.map(migrateReturnInvoice));

      if (compData.companies) {
        const serverCompanies: Company[] = compData.companies.map((c: any) => ({
          id: c.id,
          name: c.name,
          notes: c.notes ?? "",
          ownerId: c.ownerEmail ?? "",
          members: c.members ?? [],
        }));
        setCompanies(serverCompanies);
        AsyncStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(serverCompanies));
      }

      if (prodData.products) {
        const serverProducts: Product[] = prodData.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
        }));
        setProducts(serverProducts);
        AsyncStorage.setItem(STORAGE_KEYS.products, JSON.stringify(serverProducts));
      }

      const allInvNums = [...(invData.invoices ?? []), ...(trashInvData.invoices ?? [])]
        .map((inv: any) => {
          const m = inv.invoiceNumber?.match(/INV-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        });
      if (allInvNums.length > 0) {
        const maxInv = Math.max(...allInvNums);
        if (maxInv > invoiceCounterRef.current) {
          invoiceCounterRef.current = maxInv;
          setInvoiceCounter(maxInv);
          AsyncStorage.setItem(STORAGE_KEYS.invoiceCounter, String(maxInv));
        }
      }

      const allRetNums = [...(retData.returns ?? []), ...(trashRetData.returns ?? [])]
        .map((r: any) => {
          const m = r.returnNumber?.match(/RET-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        });
      if (allRetNums.length > 0) {
        const maxRet = Math.max(...allRetNums);
        if (maxRet > returnCounterRef.current) {
          returnCounterRef.current = maxRet;
          setReturnCounter(maxRet);
          AsyncStorage.setItem(STORAGE_KEYS.returnCounter, String(maxRet));
        }
      }
    } catch (e) {
      console.error("fetchFromServer error:", e);
    } finally {
      setIsSyncing(false);
      isFetchingRef.current = false;
    }
  }, [user?.email]);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, ic, rc] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.companies),
          AsyncStorage.getItem(STORAGE_KEYS.products),
          AsyncStorage.getItem(STORAGE_KEYS.invoiceCounter),
          AsyncStorage.getItem(STORAGE_KEYS.returnCounter),
        ]);
        if (c) setCompanies(JSON.parse(c).map(migrateCompany));
        if (p) setProducts(JSON.parse(p));
        if (ic) {
          const n = parseInt(ic, 10);
          setInvoiceCounter(n);
          invoiceCounterRef.current = n;
        }
        if (rc) {
          const n = parseInt(rc, 10);
          setReturnCounter(n);
          returnCounterRef.current = n;
        }
      } catch (e) {
        console.error("Failed to load local data", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoading && user?.email && user.email !== lastFetchedEmail.current) {
      lastFetchedEmail.current = user.email;
      fetchFromServer();
    }
  }, [isLoading, user?.email, fetchFromServer]);

  useEffect(() => {
    if (!user?.email) return;
    const interval = setInterval(() => {
      fetchFromServer();
    }, 30_000);
    return () => clearInterval(interval);
  }, [user?.email, fetchFromServer]);

  useEffect(() => {
    if (!user?.email) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        fetchFromServer();
      }
    });
    return () => sub.remove();
  }, [user?.email, fetchFromServer]);

  const saveCompanies = useCallback(async (data: Company[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(data));
  }, []);

  const saveProducts = useCallback(async (data: Product[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.products, JSON.stringify(data));
  }, []);

  const pushCompanyToServer = useCallback((company: Company) => {
    if (!user?.email) return;
    fetch(`${getApiBase()}/api/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, company: {
        id: company.id, name: company.name, notes: company.notes,
        ownerEmail: company.ownerId, members: company.members,
      }}),
    }).catch((e) => console.warn("pushCompanyToServer error:", e));
  }, [user?.email]);

  const deleteCompanyFromServer = useCallback((id: string) => {
    if (!user?.email) return;
    fetch(`${getApiBase()}/api/companies/${id}?email=${encodeURIComponent(user.email)}`, {
      method: "DELETE",
    }).catch((e) => console.warn("deleteCompanyFromServer error:", e));
  }, [user?.email]);

  const pushProductToServer = useCallback((product: Product) => {
    if (!user?.email) return;
    fetch(`${getApiBase()}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, product }),
    }).catch((e) => console.warn("pushProductToServer error:", e));
  }, [user?.email]);

  const deleteProductFromServer = useCallback((id: string) => {
    if (!user?.email) return;
    fetch(`${getApiBase()}/api/products/${id}?email=${encodeURIComponent(user.email)}`, {
      method: "DELETE",
    }).catch((e) => console.warn("deleteProductFromServer error:", e));
  }, [user?.email]);

  const addCompany = useCallback(
    (name: string, notes: string, ownerId: string): Company => {
      const company: Company = {
        id: generateId(),
        name: name.trim(),
        notes: notes.trim(),
        ownerId,
        members: [ownerId],
      };
      const updated = [...companies, company];
      setCompanies(updated);
      saveCompanies(updated);
      pushCompanyToServer(company);
      return company;
    },
    [companies, saveCompanies, pushCompanyToServer]
  );

  const inviteMember = useCallback(
    (companyId: string, phoneNumber: string): boolean => {
      const phone = phoneNumber.trim();
      if (!phone) return false;
      const updated = companies.map((c) => {
        if (c.id !== companyId) return c;
        if (c.members.includes(phone)) return c;
        return { ...c, members: [...c.members, phone] };
      });
      setCompanies(updated);
      saveCompanies(updated);
      const changed = updated.find((c) => c.id === companyId);
      if (changed) pushCompanyToServer(changed);
      return true;
    },
    [companies, saveCompanies, pushCompanyToServer]
  );

  const removeMember = useCallback(
    (companyId: string, phoneNumber: string) => {
      const updated = companies.map((c) => {
        if (c.id !== companyId) return c;
        return { ...c, members: c.members.filter((m) => m !== phoneNumber) };
      });
      setCompanies(updated);
      saveCompanies(updated);
      const changed = updated.find((c) => c.id === companyId);
      if (changed) pushCompanyToServer(changed);
    },
    [companies, saveCompanies, pushCompanyToServer]
  );

  const updateCompany = useCallback(
    (id: string, name: string, notes: string) => {
      const updated = companies.map((c) =>
        c.id === id ? { ...c, name: name.trim(), notes: notes.trim() } : c
      );
      setCompanies(updated);
      saveCompanies(updated);
      const changed = updated.find((c) => c.id === id);
      if (changed) pushCompanyToServer(changed);
    },
    [companies, saveCompanies, pushCompanyToServer]
  );

  const deleteCompany = useCallback(
    (id: string) => {
      const updated = companies.filter((c) => c.id !== id);
      setCompanies(updated);
      saveCompanies(updated);
      deleteCompanyFromServer(id);
    },
    [companies, saveCompanies, deleteCompanyFromServer]
  );

  const addProduct = useCallback(
    (name: string, price: number) => {
      const product: Product = { id: generateId(), name, price };
      const updated = [...products, product];
      setProducts(updated);
      saveProducts(updated);
      pushProductToServer(product);
    },
    [products, saveProducts, pushProductToServer]
  );

  const updateProduct = useCallback(
    (id: string, name: string, price: number) => {
      const updated = products.map((p) =>
        p.id === id ? { ...p, name, price } : p
      );
      setProducts(updated);
      saveProducts(updated);
      const changed = updated.find((p) => p.id === id);
      if (changed) pushProductToServer(changed);
    },
    [products, saveProducts, pushProductToServer]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      saveProducts(updated);
      deleteProductFromServer(id);
    },
    [products, saveProducts, deleteProductFromServer]
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
    async (company: Company, customerName: string, items: Omit<SalesInvoiceItem, "id">[]): Promise<SalesInvoice> => {
      const next = invoiceCounter + 1;
      const creatorName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
      const creatorEmail = user?.email ?? "";
      const invoice: SalesInvoice = {
        id: generateId(),
        invoiceNumber: `INV-${String(next).padStart(4, "0")}`,
        companyId: company.id,
        companyName: company.name,
        customerName: customerName.trim(),
        date: new Date().toISOString(),
        items: items.map((item) => ({ ...item, id: generateId() })),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        creatorEmail,
        creatorName,
      };

      setSalesInvoices((prev) => [...prev, invoice]);
      setInvoiceCounter(next);
      invoiceCounterRef.current = next;
      AsyncStorage.setItem(STORAGE_KEYS.invoiceCounter, String(next));

      if (user?.email) {
        await fetch(`${getApiBase()}/api/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, invoice }),
        });
        fetchFromServer();
      }

      return invoice;
    },
    [invoiceCounter, user, fetchFromServer]
  );

  const updateSalesInvoice = useCallback(
    async (id: string, company: Company, customerName: string, items: Omit<SalesInvoiceItem, "id">[]): Promise<SalesInvoice> => {
      let updated_invoice: SalesInvoice | null = null;

      setSalesInvoices((prev) => {
        const existing = prev.find((inv) => inv.id === id);
        if (!existing) return prev;
        updated_invoice = {
          ...existing,
          companyId: company.id,
          companyName: company.name,
          customerName: customerName.trim(),
          items: items.map((item) => ({ ...item, id: generateId() })),
          total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        };
        return prev.map((inv) => inv.id === id ? updated_invoice! : inv);
      });

      if (user?.email && updated_invoice) {
        await fetch(`${getApiBase()}/api/invoices/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            invoice: {
              companyId: company.id,
              companyName: company.name,
              customerName: customerName.trim(),
              items: items.map((item) => ({ ...item, id: generateId() })),
              total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            },
          }),
        });
      }

      if (!updated_invoice) throw new Error("Invoice not found");
      return updated_invoice;
    },
    [user]
  );

  const addReturnInvoice = useCallback(
    async (originalInvoice: SalesInvoice, items: Omit<ReturnItem, "id">[]): Promise<ReturnInvoice> => {
      const next = returnCounter + 1;
      const creatorName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
      const creatorEmail = user?.email ?? "";
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
        creatorEmail,
        creatorName,
      };

      setReturnInvoices((prev) => [...prev, returnInv]);
      setReturnCounter(next);
      returnCounterRef.current = next;
      AsyncStorage.setItem(STORAGE_KEYS.returnCounter, String(next));

      if (user?.email) {
        await fetch(`${getApiBase()}/api/returns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, ret: returnInv }),
        });
        fetchFromServer();
      }

      return returnInv;
    },
    [returnCounter, user, fetchFromServer]
  );

  const addStandaloneReturn = useCallback(
    async (company: Company, items: Omit<ReturnItem, "id">[]): Promise<ReturnInvoice> => {
      const next = returnCounter + 1;
      const creatorName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
      const creatorEmail = user?.email ?? "";
      const returnInv: ReturnInvoice = {
        id: generateId(),
        returnNumber: `RET-${String(next).padStart(4, "0")}`,
        originalInvoiceId: "",
        originalInvoiceNumber: "",
        companyId: company.id,
        companyName: company.name,
        customerName: company.name,
        date: new Date().toISOString(),
        items: items.map((item) => ({ ...item, id: generateId() })),
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        creatorEmail,
        creatorName,
      };

      setReturnInvoices((prev) => [...prev, returnInv]);
      setReturnCounter(next);
      returnCounterRef.current = next;
      AsyncStorage.setItem(STORAGE_KEYS.returnCounter, String(next));

      if (user?.email) {
        await fetch(`${getApiBase()}/api/returns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, ret: returnInv }),
        });
        fetchFromServer();
      }

      return returnInv;
    },
    [returnCounter, user, fetchFromServer]
  );

  const updateReturnInvoice = useCallback(
    async (id: string, company: Company, items: Omit<ReturnItem, "id">[]): Promise<ReturnInvoice> => {
      let updated_return: ReturnInvoice | null = null;

      setReturnInvoices((prev) => {
        const existing = prev.find((r) => r.id === id);
        if (!existing) return prev;
        updated_return = {
          ...existing,
          companyId: company.id,
          companyName: company.name,
          items: items.map((item) => ({ ...item, id: generateId() })),
          total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        };
        return prev.map((r) => r.id === id ? updated_return! : r);
      });

      if (user?.email && updated_return) {
        await fetch(`${getApiBase()}/api/returns/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            ret: {
              companyId: company.id,
              companyName: company.name,
              customerName: (updated_return as ReturnInvoice).customerName,
              items: items.map((item) => ({ ...item, id: generateId() })),
              total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            },
          }),
        });
      }

      if (!updated_return) throw new Error("Return not found");
      return updated_return;
    },
    [user]
  );

  const deleteSalesInvoice = useCallback(
    async (id: string) => {
      setSalesInvoices((prev) => {
        const item = prev.find((inv) => inv.id === id);
        if (!item) return prev;
        setTrashedInvoices((t) => [...t, item]);
        return prev.filter((inv) => inv.id !== id);
      });

      if (user?.email) {
        await fetch(`${getApiBase()}/api/invoices/${id}?email=${encodeURIComponent(user.email)}`, {
          method: "DELETE",
        });
      }
    },
    [user]
  );

  const deleteReturnInvoice = useCallback(
    async (id: string) => {
      setReturnInvoices((prev) => {
        const item = prev.find((r) => r.id === id);
        if (!item) return prev;
        setTrashedReturns((t) => [...t, item]);
        return prev.filter((r) => r.id !== id);
      });

      if (user?.email) {
        await fetch(`${getApiBase()}/api/returns/${id}?email=${encodeURIComponent(user.email)}`, {
          method: "DELETE",
        });
      }
    },
    [user]
  );

  const restoreSalesInvoice = useCallback(
    async (id: string) => {
      setTrashedInvoices((prev) => {
        const item = prev.find((inv) => inv.id === id);
        if (!item) return prev;
        setSalesInvoices((a) => [...a, item]);
        return prev.filter((inv) => inv.id !== id);
      });

      if (user?.email) {
        await fetch(`${getApiBase()}/api/invoices/${id}/restore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
      }
    },
    [user]
  );

  const restoreReturnInvoice = useCallback(
    async (id: string) => {
      setTrashedReturns((prev) => {
        const item = prev.find((r) => r.id === id);
        if (!item) return prev;
        setReturnInvoices((a) => [...a, item]);
        return prev.filter((r) => r.id !== id);
      });

      if (user?.email) {
        await fetch(`${getApiBase()}/api/returns/${id}/restore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });
      }
    },
    [user]
  );

  const permanentlyDeleteInvoice = useCallback(
    async (id: string) => {
      setTrashedInvoices((prev) => prev.filter((inv) => inv.id !== id));

      if (user?.email) {
        await fetch(`${getApiBase()}/api/invoices/${id}?email=${encodeURIComponent(user.email)}&permanent=true`, {
          method: "DELETE",
        });
      }
    },
    [user]
  );

  const permanentlyDeleteReturn = useCallback(
    async (id: string) => {
      setTrashedReturns((prev) => prev.filter((r) => r.id !== id));

      if (user?.email) {
        await fetch(`${getApiBase()}/api/returns/${id}?email=${encodeURIComponent(user.email)}&permanent=true`, {
          method: "DELETE",
        });
      }
    },
    [user]
  );

  const emptyTrash = useCallback(async () => {
    const invIds = trashedInvoices.map((i) => i.id);
    const retIds = trashedReturns.map((r) => r.id);
    setTrashedInvoices([]);
    setTrashedReturns([]);

    if (user?.email) {
      await Promise.all([
        ...invIds.map((id) =>
          fetch(`${getApiBase()}/api/invoices/${id}?email=${encodeURIComponent(user.email!)}&permanent=true`, { method: "DELETE" })
        ),
        ...retIds.map((id) =>
          fetch(`${getApiBase()}/api/returns/${id}?email=${encodeURIComponent(user.email!)}&permanent=true`, { method: "DELETE" })
        ),
      ]);
    }
  }, [trashedInvoices, trashedReturns, user]);

  const value = useMemo(
    () => ({
      companies,
      products,
      salesInvoices,
      returnInvoices,
      trashedInvoices,
      trashedReturns,
      isLoading,
      isSyncing,
      addCompany,
      updateCompany,
      deleteCompany,
      inviteMember,
      removeMember,
      addProduct,
      updateProduct,
      deleteProduct,
      addSalesInvoice,
      updateSalesInvoice,
      addReturnInvoice,
      addStandaloneReturn,
      updateReturnInvoice,
      deleteSalesInvoice,
      deleteReturnInvoice,
      restoreSalesInvoice,
      restoreReturnInvoice,
      permanentlyDeleteInvoice,
      permanentlyDeleteReturn,
      emptyTrash,
      getNextInvoiceNumber,
      getNextReturnNumber,
      refreshFromServer: fetchFromServer,
    }),
    [
      companies,
      products,
      salesInvoices,
      returnInvoices,
      trashedInvoices,
      trashedReturns,
      isLoading,
      isSyncing,
      addCompany,
      updateCompany,
      deleteCompany,
      inviteMember,
      removeMember,
      addProduct,
      updateProduct,
      deleteProduct,
      addSalesInvoice,
      updateSalesInvoice,
      addReturnInvoice,
      addStandaloneReturn,
      updateReturnInvoice,
      deleteSalesInvoice,
      deleteReturnInvoice,
      restoreSalesInvoice,
      restoreReturnInvoice,
      permanentlyDeleteInvoice,
      permanentlyDeleteReturn,
      emptyTrash,
      getNextInvoiceNumber,
      getNextReturnNumber,
      fetchFromServer,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
