import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { Company, SalesInvoice, useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { formatCurrency, formatDate } from "@/utils/format";

const C = Colors.light;

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const { salesInvoices, companies } = useApp();
  const { t, isRTL } = useLang();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;

  const filtered = selectedCompanyId
    ? salesInvoices.filter((inv) => inv.companyId === selectedCompanyId)
    : salesInvoices;

  const sorted = [...filtered].reverse();

  const grouped = React.useMemo(() => {
    if (selectedCompanyId) {
      return [{ company: companies.find((c) => c.id === selectedCompanyId) ?? null, invoices: sorted }];
    }
    const map: Record<string, { company: Company | null; invoices: SalesInvoice[] }> = {};
    for (const inv of sorted) {
      const key = inv.companyId || "__no_company__";
      if (!map[key]) {
        map[key] = {
          company: inv.companyId ? (companies.find((c) => c.id === inv.companyId) ?? null) : null,
          invoices: [],
        };
      }
      map[key].invoices.push(inv);
    }
    return Object.values(map);
  }, [sorted, selectedCompanyId, companies]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, isRTL && styles.textRTL]}>{t("invoices")}</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/invoice/create");
          }}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {companies.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          <Pressable
            style={[styles.filterChip, !selectedCompanyId && styles.filterChipActive]}
            onPress={() => setSelectedCompanyId(null)}
          >
            <Text style={[styles.filterChipText, !selectedCompanyId && styles.filterChipTextActive]}>
              {t("all")}
            </Text>
          </Pressable>
          {companies.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.filterChip, selectedCompanyId === c.id && styles.filterChipActive]}
              onPress={() => setSelectedCompanyId(selectedCompanyId === c.id ? null : c.id)}
            >
              <Text style={[styles.filterChipText, selectedCompanyId === c.id && styles.filterChipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={grouped}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View>
            {!selectedCompanyId && item.company && (
              <View style={styles.groupHeader}>
                <Feather name="briefcase" size={14} color="#7C3AED" />
                <Text style={styles.groupHeaderText}>{item.company.name}</Text>
              </View>
            )}
            {item.invoices.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} isRTL={isRTL} />
            ))}
          </View>
        )}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomPad,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="file-text" size={36} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {selectedCompanyId ? t("noInvoicesForCompany") : t("noInvoicesYet")}
            </Text>
            {!selectedCompanyId && (
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push("/invoice/create")}
              >
                <Text style={styles.emptyBtnText}>{t("createInvoice")}</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </View>
  );
}

function InvoiceCard({ invoice, isRTL }: { invoice: SalesInvoice; isRTL: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, isRTL && styles.cardRTL]}
      onPress={() => router.push(`/invoice/${invoice.id}`)}
    >
      <View style={[styles.cardLeft, isRTL && styles.cardLeftRTL]}>
        <View style={styles.cardIcon}>
          <Feather name="file-text" size={20} color={C.tint} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={[styles.cardRow, isRTL && styles.cardRowRTL]}>
          <Text style={[styles.cardNum, isRTL && styles.textRTL]}>{invoice.invoiceNumber}</Text>
          <Text style={styles.cardAmount}>{formatCurrency(invoice.total)}</Text>
        </View>
        {invoice.companyName ? (
          <View style={[styles.companyRow, isRTL && styles.companyRowRTL]}>
            <Feather name="briefcase" size={11} color="#7C3AED" />
            <Text style={styles.companyText}>{invoice.companyName}</Text>
          </View>
        ) : null}
        <View style={[styles.cardRow, isRTL && styles.cardRowRTL]}>
          <Text style={[styles.cardCustomer, isRTL && styles.textRTL]}>{invoice.customerName}</Text>
          <Text style={styles.cardDate}>{formatDate(invoice.date)}</Text>
        </View>
        <Text style={[styles.cardItems, isRTL && styles.textRTL]}>
          {invoice.items.length} item{invoice.items.length !== 1 ? "s" : ""}
        </Text>
      </View>
      <Feather name={isRTL ? "chevron-left" : "chevron-right"} size={18} color={C.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: C.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text },
  textRTL: { textAlign: "right" },
  addBtn: {
    backgroundColor: C.tint,
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBar: {
    backgroundColor: C.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    maxHeight: 52,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.borderLight,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: C.tint,
    borderColor: C.tint,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  groupHeaderText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#7C3AED",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRTL: { flexDirection: "row-reverse" },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardLeft: { marginRight: 14 },
  cardLeftRTL: { marginRight: 0, marginLeft: 14 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.tintLight,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { flex: 1 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  cardRowRTL: { flexDirection: "row-reverse" },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  companyRowRTL: { flexDirection: "row-reverse" },
  companyText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#7C3AED",
  },
  cardNum: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  cardAmount: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.tint },
  cardCustomer: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  cardItems: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.borderLight,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 20, textAlign: "center" },
  emptyBtn: { backgroundColor: C.tint, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
