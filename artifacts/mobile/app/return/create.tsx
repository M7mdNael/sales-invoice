import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { ReturnItem, SalesInvoice, useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { formatCurrency, formatDate } from "@/utils/format";

const C = Colors.light;

export default function CreateReturnScreen() {
  const insets = useSafeAreaInsets();
  const { salesInvoices, addReturnInvoice, returnInvoices, getNextReturnNumber } = useApp();
  const { t, isRTL } = useLang();
  const params = useLocalSearchParams<{ invoiceId?: string }>();

  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(
    params.invoiceId ? salesInvoices.find((inv) => inv.id === params.invoiceId) ?? null : null
  );
  const [showInvoicePicker, setShowInvoicePicker] = useState(!params.invoiceId);
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const returnNumber = getNextReturnNumber();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const getReturnedQty = (invoiceId: string, productId: string) => {
    return returnInvoices
      .filter((r) => r.originalInvoiceId === invoiceId)
      .flatMap((r) => r.items)
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const totalReturn = selectedInvoice
    ? selectedInvoice.items.reduce((sum, item) => {
        const qty = parseInt(returnQtys[item.productId] ?? "0", 10) || 0;
        return sum + qty * item.price;
      }, 0)
    : 0;

  const handleSelectInvoice = (inv: SalesInvoice) => {
    setSelectedInvoice(inv);
    setReturnQtys({});
    setShowInvoicePicker(false);
  };

  const handleSave = () => {
    if (!selectedInvoice) return;
    const items: Omit<ReturnItem, "id">[] = selectedInvoice.items
      .map((item) => {
        const qty = parseInt(returnQtys[item.productId] ?? "0", 10) || 0;
        const alreadyReturned = getReturnedQty(selectedInvoice.id, item.productId);
        const maxReturn = item.quantity - alreadyReturned;
        if (qty > maxReturn) {
          Alert.alert(
            t("invalidQuantity"),
            `${t("exceedsLimit")} ${item.productName}: ${maxReturn}`
          );
          return null;
        }
        return qty > 0
          ? { productId: item.productId, productName: item.productName, quantity: qty, price: item.price }
          : null;
      })
      .filter(Boolean) as Omit<ReturnItem, "id">[];

    if (items.length === 0) {
      Alert.alert(t("noItems"), t("enterReturnQty"));
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const ret = addReturnInvoice(selectedInvoice, items);
    router.dismissAll();
    router.push(`/return/${ret.id}`);
  };

  if (showInvoicePicker || !selectedInvoice) {
    return (
      <View style={styles.container}>
        <View style={styles.pickerHeader}>
          <Text style={[styles.pickerTitle, isRTL && styles.textRTL]}>{t("selectInvoice")}</Text>
        </View>
        {salesInvoices.length === 0 ? (
          <View style={styles.emptyPicker}>
            <Feather name="file-text" size={40} color={C.textMuted} />
            <Text style={[styles.emptyPickerText, isRTL && styles.textRTL]}>{t("noAvailableInvoices")}</Text>
            <Text style={[styles.emptyPickerSub, isRTL && styles.textRTL]}>{t("createSalesFirst")}</Text>
          </View>
        ) : (
          <FlatList
            data={[...salesInvoices].reverse()}
            keyExtractor={(inv) => inv.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.invPickerItem, pressed && styles.invPickerItemPressed, isRTL && styles.invPickerItemRTL]}
                onPress={() => handleSelectInvoice(item)}
              >
                <View style={styles.invPickerLeft}>
                  <Text style={[styles.invPickerNum, isRTL && styles.textRTL]}>{item.invoiceNumber}</Text>
                  {item.companyName ? (
                    <Text style={[styles.invPickerCompany, isRTL && styles.textRTL]}>{item.companyName}</Text>
                  ) : null}
                  <Text style={[styles.invPickerCustomer, isRTL && styles.textRTL]}>{item.customerName}</Text>
                  <Text style={[styles.invPickerDate, isRTL && styles.textRTL]}>{formatDate(item.date)}</Text>
                </View>
                <Text style={styles.invPickerTotal}>{formatCurrency(item.total)}</Text>
                <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={C.textMuted} />
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
        <View style={styles.returnNumBadge}>
          <MaterialCommunityIcons name="undo-variant" size={14} color={C.danger} />
          <Text style={styles.returnNumText}>{returnNumber}</Text>
        </View>

        <View style={[styles.refCard, isRTL && styles.refCardRTL]}>
          <View>
            <Text style={[styles.refLabel, isRTL && styles.textRTL]}>{t("originalInvoice")}</Text>
            <Text style={[styles.refValue, isRTL && styles.textRTL]}>{selectedInvoice.invoiceNumber}</Text>
          </View>
          {selectedInvoice.companyName ? (
            <View>
              <Text style={[styles.refLabel, isRTL && styles.textRTL]}>{t("company")}</Text>
              <Text style={[styles.refValue, { color: "#7C3AED" }, isRTL && styles.textRTL]}>
                {selectedInvoice.companyName}
              </Text>
            </View>
          ) : null}
          <View>
            <Text style={[styles.refLabel, isRTL && styles.textRTL]}>{t("customer")}</Text>
            <Text style={[styles.refValue, isRTL && styles.textRTL]}>{selectedInvoice.customerName}</Text>
          </View>
          <Pressable onPress={() => setShowInvoicePicker(true)} style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>{t("changeCompany")}</Text>
          </Pressable>
        </View>

        <Text style={[styles.fieldLabel, isRTL && styles.textRTL]}>{t("returnedItems")}</Text>

        <View style={styles.itemsCard}>
          {selectedInvoice.items.map((item, i) => {
            const alreadyReturned = getReturnedQty(selectedInvoice.id, item.productId);
            const maxReturn = item.quantity - alreadyReturned;
            return (
              <React.Fragment key={item.productId}>
                {i > 0 && <View style={styles.sep} />}
                <View style={[styles.itemRow, isRTL && styles.itemRowRTL]}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, isRTL && styles.textRTL]}>{item.productName}</Text>
                    <Text style={[styles.itemSold, isRTL && styles.textRTL]}>
                      {t("soldQty")}: {item.quantity} · {t("maxReturn")}: {maxReturn}
                    </Text>
                    <Text style={[styles.itemPrice, isRTL && styles.textRTL]}>
                      {formatCurrency(item.price)} {t("eachPrice")}
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.qtyInput, maxReturn === 0 && styles.qtyInputDisabled]}
                    placeholder="0"
                    placeholderTextColor={C.textMuted}
                    keyboardType="number-pad"
                    value={returnQtys[item.productId] ?? ""}
                    editable={maxReturn > 0}
                    onChangeText={(text) => {
                      const n = parseInt(text, 10) || 0;
                      if (n > maxReturn) {
                        Alert.alert(t("exceedsLimit"), `${t("maxReturn")} ${item.productName}: ${maxReturn}`);
                        return;
                      }
                      setReturnQtys({ ...returnQtys, [item.productId]: text });
                    }}
                    maxLength={4}
                  />
                </View>
              </React.Fragment>
            );
          })}
          <View style={[styles.totalRow, isRTL && styles.totalRowRTL]}>
            <Text style={[styles.totalLabel, isRTL && styles.textRTL]}>{t("totalRefund")}</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalReturn)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{t("createReturnBtn")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  returnNumBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.dangerLight, alignSelf: "flex-start",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16,
  },
  returnNumText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.danger },
  refCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 20,
    gap: 8, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between",
    alignItems: "flex-end", shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  refCardRTL: { flexDirection: "row-reverse" },
  refLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium", color: C.textMuted,
    textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2,
  },
  refValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  changeBtn: { backgroundColor: C.borderLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  changeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  fieldLabel: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary,
    letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 12,
  },
  textRTL: { textAlign: "right" },
  itemsCard: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  itemRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  itemRowRTL: { flexDirection: "row-reverse" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: "Inter_500Medium", color: C.text },
  itemSold: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.tint, marginTop: 1 },
  qtyInput: {
    width: 64, backgroundColor: C.borderLight, borderRadius: 10, padding: 10,
    fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, textAlign: "center",
    borderWidth: 1, borderColor: C.border,
  },
  qtyInputDisabled: { opacity: 0.4 },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16, backgroundColor: C.dangerLight,
  },
  totalRowRTL: { flexDirection: "row-reverse" },
  totalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.danger },
  sep: { height: 1, backgroundColor: C.borderLight },
  footer: {
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.backgroundSecondary,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  saveBtn: {
    backgroundColor: C.danger, borderRadius: 14, flexDirection: "row",
    justifyContent: "center", alignItems: "center", paddingVertical: 16, gap: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  pickerHeader: {
    padding: 20, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card,
  },
  pickerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  invPickerItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.card,
    borderRadius: 14, padding: 16, gap: 12,
  },
  invPickerItemRTL: { flexDirection: "row-reverse" },
  invPickerItemPressed: { opacity: 0.85 },
  invPickerLeft: { flex: 1 },
  invPickerNum: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  invPickerCompany: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#7C3AED", marginTop: 2 },
  invPickerCustomer: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  invPickerDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 },
  invPickerTotal: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.tint },
  emptyPicker: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyPickerText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: C.text },
  emptyPickerSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
