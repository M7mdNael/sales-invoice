import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { SalesInvoice, ReturnInvoice, useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { formatCurrency, formatDate } from "@/utils/format";

const C = Colors.light;
type Tab = "invoices" | "returns";

export default function TrashScreen() {
  const insets = useSafeAreaInsets();
  const {
    trashedInvoices,
    trashedReturns,
    restoreSalesInvoice,
    restoreReturnInvoice,
    permanentlyDeleteInvoice,
    permanentlyDeleteReturn,
    emptyTrash,
  } = useApp();
  const { t, isRTL } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>("invoices");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;
  const totalItems = trashedInvoices.length + trashedReturns.length;

  const confirmEmptyTrash = () => {
    const msg = t("emptyTrashConfirm");
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) emptyTrash();
    } else {
      const { Alert } = require("react-native");
      Alert.alert(t("emptyTrash"), msg, [
        { text: t("cancel"), style: "cancel" },
        { text: t("deleteForever"), style: "destructive", onPress: emptyTrash },
      ]);
    }
  };

  const confirmDeleteForeverInvoice = (id: string) => {
    const msg = t("deleteForeverConfirm");
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) permanentlyDeleteInvoice(id);
    } else {
      const { Alert } = require("react-native");
      Alert.alert(t("deleteForever"), msg, [
        { text: t("cancel"), style: "cancel" },
        { text: t("deleteForever"), style: "destructive", onPress: () => permanentlyDeleteInvoice(id) },
      ]);
    }
  };

  const confirmDeleteForeverReturn = (id: string) => {
    const msg = t("deleteForeverConfirm");
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) permanentlyDeleteReturn(id);
    } else {
      const { Alert } = require("react-native");
      Alert.alert(t("deleteForever"), msg, [
        { text: t("cancel"), style: "cancel" },
        { text: t("deleteForever"), style: "destructive", onPress: () => permanentlyDeleteReturn(id) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "invoices" && styles.tabActive]}
          onPress={() => setActiveTab("invoices")}
        >
          <Feather name="file-text" size={16} color={activeTab === "invoices" ? C.tint : C.textMuted} />
          <Text style={[styles.tabText, activeTab === "invoices" && styles.tabTextActive]}>
            {t("trashInvoices")} ({trashedInvoices.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "returns" && styles.tabActiveRed]}
          onPress={() => setActiveTab("returns")}
        >
          <MaterialCommunityIcons name="undo-variant" size={16} color={activeTab === "returns" ? C.danger : C.textMuted} />
          <Text style={[styles.tabText, activeTab === "returns" && styles.tabTextRed]}>
            {t("trashReturns")} ({trashedReturns.length})
          </Text>
        </Pressable>
      </View>

      {/* List */}
      {activeTab === "invoices" ? (
        <FlatList
          data={[...trashedInvoices].reverse()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 60, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: C.borderLight }]}>
                <Feather name="trash-2" size={36} color={C.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>{t("noTrashedInvoices")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TrashedInvoiceCard
              invoice={item}
              isRTL={isRTL}
              onRestore={() => restoreSalesInvoice(item.id)}
              onDeleteForever={() => confirmDeleteForeverInvoice(item.id)}
              restoreLabel={t("restore")}
              deleteLabel={t("deleteForever")}
            />
          )}
        />
      ) : (
        <FlatList
          data={[...trashedReturns].reverse()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 60, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: C.dangerLight }]}>
                <Feather name="trash-2" size={36} color={C.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>{t("noTrashedReturns")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TrashedReturnCard
              ret={item}
              isRTL={isRTL}
              onRestore={() => restoreReturnInvoice(item.id)}
              onDeleteForever={() => confirmDeleteForeverReturn(item.id)}
              restoreLabel={t("restore")}
              deleteLabel={t("deleteForever")}
            />
          )}
        />
      )}

      {/* Empty Trash FAB */}
      {totalItems > 0 && (
        <View style={[styles.fabRow, { paddingBottom: bottomPad }]}>
          <Pressable style={styles.emptyTrashBtn} onPress={confirmEmptyTrash}>
            <Feather name="trash-2" size={16} color="#fff" />
            <Text style={styles.emptyTrashBtnText}>{t("emptyTrash")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function TrashedInvoiceCard({
  invoice,
  isRTL,
  onRestore,
  onDeleteForever,
  restoreLabel,
  deleteLabel,
}: {
  invoice: SalesInvoice;
  isRTL: boolean;
  onRestore: () => void;
  onDeleteForever: () => void;
  restoreLabel: string;
  deleteLabel: string;
}) {
  return (
    <View style={[styles.card, isRTL && styles.cardRTL]}>
      <View style={styles.cardIcon}>
        <Feather name="file-text" size={20} color={C.tint} />
      </View>
      <View style={styles.cardBody}>
        <View style={[styles.cardRow, isRTL && styles.cardRowRTL]}>
          <Text style={[styles.cardNum, isRTL && styles.textRTL]}>{invoice.invoiceNumber}</Text>
          <Text style={[styles.cardAmount, { color: C.tint }]}>{formatCurrency(invoice.total)}</Text>
        </View>
        {invoice.companyName ? (
          <View style={[styles.companyRow, isRTL && styles.companyRowRTL]}>
            <Feather name="briefcase" size={11} color="#7C3AED" />
            <Text style={styles.companyText}>{invoice.companyName}</Text>
          </View>
        ) : null}
        <Text style={[styles.cardDate, isRTL && styles.textRTL]}>{formatDate(invoice.date)}</Text>
        <View style={[styles.actionRow, isRTL && styles.actionRowRTL]}>
          <Pressable style={styles.restoreBtn} onPress={onRestore}>
            <Feather name="rotate-ccw" size={13} color="#fff" />
            <Text style={styles.restoreBtnText}>{restoreLabel}</Text>
          </Pressable>
          <Pressable style={styles.deleteForeverBtn} onPress={onDeleteForever}>
            <Feather name="trash-2" size={13} color="#fff" />
            <Text style={styles.deleteForeverBtnText}>{deleteLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function TrashedReturnCard({
  ret,
  isRTL,
  onRestore,
  onDeleteForever,
  restoreLabel,
  deleteLabel,
}: {
  ret: ReturnInvoice;
  isRTL: boolean;
  onRestore: () => void;
  onDeleteForever: () => void;
  restoreLabel: string;
  deleteLabel: string;
}) {
  return (
    <View style={[styles.card, isRTL && styles.cardRTL]}>
      <View style={[styles.cardIcon, { backgroundColor: C.dangerLight }]}>
        <MaterialCommunityIcons name="undo-variant" size={20} color={C.danger} />
      </View>
      <View style={styles.cardBody}>
        <View style={[styles.cardRow, isRTL && styles.cardRowRTL]}>
          <Text style={[styles.cardNum, isRTL && styles.textRTL]}>{ret.returnNumber}</Text>
          <Text style={[styles.cardAmount, { color: C.danger }]}>{formatCurrency(ret.total)}</Text>
        </View>
        {ret.companyName ? (
          <View style={[styles.companyRow, isRTL && styles.companyRowRTL]}>
            <Feather name="briefcase" size={11} color="#7C3AED" />
            <Text style={styles.companyText}>{ret.companyName}</Text>
          </View>
        ) : null}
        <Text style={[styles.cardDate, isRTL && styles.textRTL]}>
          Ref: {ret.originalInvoiceNumber} · {formatDate(ret.date)}
        </Text>
        <View style={[styles.actionRow, isRTL && styles.actionRowRTL]}>
          <Pressable style={styles.restoreBtn} onPress={onRestore}>
            <Feather name="rotate-ccw" size={13} color="#fff" />
            <Text style={styles.restoreBtnText}>{restoreLabel}</Text>
          </Pressable>
          <Pressable style={styles.deleteForeverBtn} onPress={onDeleteForever}>
            <Feather name="trash-2" size={13} color="#fff" />
            <Text style={styles.deleteForeverBtnText}>{deleteLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  tabBar: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: C.tint },
  tabActiveRed: { borderBottomColor: C.danger },
  tabText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textMuted },
  tabTextActive: { color: C.tint, fontFamily: "Inter_600SemiBold" },
  tabTextRed: { color: C.danger, fontFamily: "Inter_600SemiBold" },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cardRTL: { flexDirection: "row-reverse" },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.tintLight,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardRowRTL: { flexDirection: "row-reverse" },
  textRTL: { textAlign: "right" },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  companyRowRTL: { flexDirection: "row-reverse" },
  companyText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#7C3AED" },
  cardNum: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  cardAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginBottom: 10 },

  actionRow: { flexDirection: "row", gap: 8 },
  actionRowRTL: { flexDirection: "row-reverse" },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.success,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  restoreBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  deleteForeverBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.danger,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  deleteForeverBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text, textAlign: "center" },

  fabRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  emptyTrashBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.danger,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyTrashBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
