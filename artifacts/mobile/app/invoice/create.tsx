import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import {
  Company,
  Product,
  SalesInvoiceItem,
  useApp,
} from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils/format";

const C = Colors.light;

interface CartItem {
  product: Product;
  quantity: number;
}

type View = "form" | "productPicker" | "companyPicker";

export default function CreateInvoiceScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ editId?: string }>();
  const { products, companies, salesInvoices, addSalesInvoice, updateSalesInvoice, getNextInvoiceNumber } = useApp();
  const { t, isRTL } = useLang();

  const isEditing = !!params.editId;
  const existingInvoice = isEditing ? salesInvoices.find((inv) => inv.id === params.editId) : null;

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(
    existingInvoice?.companyId
      ? (companies.find((c) => c.id === existingInvoice.companyId) ?? null)
      : null
  );
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (existingInvoice) {
      return existingInvoice.items.map((item) => {
        const product = products.find((p) => p.id === item.productId) ?? {
          id: item.productId,
          name: item.productName,
          price: item.price,
        };
        return { product, quantity: item.quantity };
      });
    }
    return [];
  });
  const [currentView, setCurrentView] = useState<View>("form");
  const [saving, setSaving] = useState(false);

  const invoiceNumber = isEditing ? existingInvoice?.invoiceNumber : getNextInvoiceNumber();
  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);

  const addToCart = (product: Product) => {
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) {
      setCart(cart.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setCurrentView("form");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.product.id !== productId));
    } else {
      setCart(cart.map((c) => c.product.id === productId ? { ...c, quantity: qty } : c));
    }
  };

  const handleSave = () => {
    if (!selectedCompany) {
      Alert.alert(t("missingInfo"), t("selectCompanyFirst"));
      return;
    }
    if (cart.length === 0) {
      Alert.alert(t("emptyInvoice"), t("addOneProduct"));
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const items: Omit<SalesInvoiceItem, "id">[] = cart.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      quantity: c.quantity,
      price: c.product.price,
    }));
    if (isEditing && existingInvoice) {
      const invoice = updateSalesInvoice(existingInvoice.id, selectedCompany, selectedCompany.name, items);
      router.dismissAll();
      router.push(`/invoice/${invoice.id}`);
    } else {
      const invoice = addSalesInvoice(selectedCompany, selectedCompany.name, items);
      router.dismissAll();
      router.push(`/invoice/${invoice.id}`);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (currentView === "companyPicker") {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{t("selectCompany")}</Text>
          <Pressable onPress={() => setCurrentView("form")}>
            <Feather name="x" size={24} color={C.text} />
          </Pressable>
        </View>
        {companies.length === 0 ? (
          <View style={styles.emptyPicker}>
            <Feather name="briefcase" size={40} color={C.textMuted} />
            <Text style={styles.emptyPickerText}>{t("noCompaniesYet")}</Text>
            <Pressable
              style={styles.goToBtn}
              onPress={() => {
                setCurrentView("form");
                router.push("/companies/");
              }}
            >
              <Text style={styles.goToBtnText}>{t("addCompany")}</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={companies}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.pickerItem, pressed && styles.pickerItemPressed]}
                onPress={() => {
                  setSelectedCompany(item);
                  setCurrentView("form");
                }}
              >
                <View style={styles.pickerItemIcon}>
                  <Feather name="briefcase" size={18} color="#7C3AED" />
                </View>
                <View style={styles.pickerItemInfo}>
                  <Text style={styles.pickerItemName}>{item.name}</Text>
                  {item.notes ? <Text style={styles.pickerItemSub}>{item.notes}</Text> : null}
                </View>
                {selectedCompany?.id === item.id && (
                  <Feather name="check" size={20} color={C.tint} />
                )}
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>
    );
  }

  if (currentView === "productPicker") {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{t("addProduct")}</Text>
          <Pressable onPress={() => setCurrentView("form")}>
            <Feather name="x" size={24} color={C.text} />
          </Pressable>
        </View>
        {products.length === 0 ? (
          <View style={styles.emptyPicker}>
            <Feather name="package" size={40} color={C.textMuted} />
            <Text style={styles.emptyPickerText}>{t("noProductsYet")}</Text>
            <Pressable
              style={styles.goToBtn}
              onPress={() => {
                setCurrentView("form");
                router.push("/products/");
              }}
            >
              <Text style={styles.goToBtnText}>{t("addProduct")}</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.pickerItem, pressed && styles.pickerItemPressed]}
                onPress={() => addToCart(item)}
              >
                <View style={styles.pickerItemInfo}>
                  <Text style={styles.pickerItemName}>{item.name}</Text>
                  <Text style={styles.pickerItemPrice}>{formatCurrency(item.price)}</Text>
                </View>
                <Feather name="plus-circle" size={22} color={C.tint} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.invoiceNumBadge}>
          <Feather name="hash" size={14} color={C.tint} />
          <Text style={styles.invoiceNumText}>{invoiceNumber}</Text>
          {isEditing && (
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>{t("editInvoice")}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.fieldLabel, isRTL && styles.textRTL]}>{t("company")} *</Text>
        <Pressable
          style={[styles.companySelector, selectedCompany && styles.companySelectorFilled]}
          onPress={() => setCurrentView("companyPicker")}
        >
          {selectedCompany ? (
            <View style={styles.companySelectorInner}>
              <View style={styles.companySelectorIcon}>
                <Feather name="briefcase" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.companySelectorName}>{selectedCompany.name}</Text>
              <Text style={styles.companySelectorChange}>{t("changeCompany")}</Text>
            </View>
          ) : (
            <View style={styles.companySelectorInner}>
              <Feather name="briefcase" size={18} color={C.textMuted} />
              <Text style={styles.companySelectorPlaceholder}>{t("selectCompany")}</Text>
              <Feather name="chevron-down" size={18} color={C.textMuted} />
            </View>
          )}
        </Pressable>

        <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
          <Text style={[styles.fieldLabel, isRTL && styles.textRTL, { marginBottom: 0 }]}>{t("products")}</Text>
          <Pressable style={styles.addProductBtn} onPress={() => setCurrentView("productPicker")}>
            <Feather name="plus" size={16} color={C.tint} />
            <Text style={styles.addProductBtnText}>{t("addProduct")}</Text>
          </Pressable>
        </View>

        {cart.length === 0 ? (
          <Pressable style={styles.emptyCart} onPress={() => setCurrentView("productPicker")}>
            <Feather name="shopping-cart" size={28} color={C.textMuted} />
            <Text style={styles.emptyCartText}>{t("addTapToAdd")}</Text>
          </Pressable>
        ) : (
          <View style={styles.cartCard}>
            {cart.map((item, i) => (
              <React.Fragment key={item.product.id}>
                {i > 0 && <View style={styles.sep} />}
                <CartRow item={item} onUpdateQty={updateQty} eachLabel={t("eachPrice")} />
              </React.Fragment>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("total")}</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable
          style={[styles.saveBtn, (saving || cart.length === 0) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || cart.length === 0}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>
            {isEditing ? t("saveChanges") : t("saveInvoice")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CartRow({
  item,
  onUpdateQty,
  eachLabel,
}: {
  item: CartItem;
  onUpdateQty: (id: string, qty: number) => void;
  eachLabel: string;
}) {
  return (
    <View style={styles.cartRow}>
      <View style={styles.cartInfo}>
        <Text style={styles.cartName}>{item.product.name}</Text>
        <Text style={styles.cartPrice}>{formatCurrency(item.product.price)} {eachLabel}</Text>
      </View>
      <View style={styles.qtyControl}>
        <Pressable
          style={styles.qtyBtn}
          onPress={() => onUpdateQty(item.product.id, item.quantity - 1)}
        >
          <Feather
            name={item.quantity === 1 ? "trash-2" : "minus"}
            size={14}
            color={item.quantity === 1 ? C.danger : C.tint}
          />
        </Pressable>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <Pressable
          style={styles.qtyBtn}
          onPress={() => onUpdateQty(item.product.id, item.quantity + 1)}
        >
          <Feather name="plus" size={14} color={C.tint} />
        </Pressable>
      </View>
      <Text style={styles.cartLineTotal}>
        {formatCurrency(item.product.price * item.quantity)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  invoiceNumBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.tintLight, alignSelf: "flex-start",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20,
  },
  invoiceNumText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.tint },
  editBadge: {
    backgroundColor: "#FEF3CD", paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, marginLeft: 4,
  },
  editBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#92400E" },
  fieldLabel: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary,
    letterSpacing: 0.3, marginBottom: 8, textTransform: "uppercase",
  },
  textRTL: { textAlign: "right" },
  companySelector: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: C.border, marginBottom: 20,
    borderStyle: "dashed",
  },
  companySelectorFilled: {
    borderStyle: "solid", borderColor: "#7C3AED",
    backgroundColor: "#F5F3FF",
  },
  companySelectorInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  companySelectorIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: "#EDE9FE",
    justifyContent: "center", alignItems: "center",
  },
  companySelectorName: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#5B21B6" },
  companySelectorChange: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.tint },
  companySelectorPlaceholder: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: C.textMuted },
  input: {
    backgroundColor: C.card, borderRadius: 14, padding: 16, fontSize: 16,
    fontFamily: "Inter_400Regular", color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 24,
  },
  inputRTL: { textAlign: "right" },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  sectionHeaderRTL: { flexDirection: "row-reverse" },
  addProductBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.tintLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  addProductBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.tint },
  emptyCart: {
    backgroundColor: C.card, borderRadius: 16, padding: 40, alignItems: "center",
    gap: 10, borderWidth: 2, borderColor: C.border, borderStyle: "dashed",
  },
  emptyCartText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textMuted },
  cartCard: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  cartRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  cartInfo: { flex: 1 },
  cartName: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  cartPrice: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  qtyControl: { flexDirection: "row", alignItems: "center", backgroundColor: C.borderLight, borderRadius: 10 },
  qtyBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
  qtyText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, minWidth: 24, textAlign: "center" },
  cartLineTotal: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.tint, minWidth: 80, textAlign: "right" },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16, backgroundColor: C.tintLight,
  },
  totalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.tint },
  sep: { height: 1, backgroundColor: C.borderLight },
  footer: {
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.backgroundSecondary,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  saveBtn: {
    backgroundColor: C.tint, borderRadius: 14, flexDirection: "row",
    justifyContent: "center", alignItems: "center", paddingVertical: 16, gap: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  pickerHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card,
  },
  pickerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  pickerItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 14, padding: 16, gap: 12,
  },
  pickerItemPressed: { opacity: 0.85 },
  pickerItemIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#EDE9FE",
    justifyContent: "center", alignItems: "center",
  },
  pickerItemInfo: { flex: 1 },
  pickerItemName: { fontSize: 15, fontFamily: "Inter_500Medium", color: C.text },
  pickerItemSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  pickerItemPrice: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.tint, marginTop: 2 },
  emptyPicker: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyPickerText: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
  goToBtn: { backgroundColor: C.tint, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  goToBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
