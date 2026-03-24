import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
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
import { SalesInvoice, useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/utils/format";

const C = Colors.light;

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const { salesInvoices } = useApp();
  const sorted = [...salesInvoices].reverse();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>Invoices</Text>
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

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InvoiceCard invoice={item} />}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomPad,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!sorted.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="file-text" size={36} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No invoices yet</Text>
            <Text style={styles.emptySub}>
              Tap the + button to create your first invoice
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push("/invoice/create")}
            >
              <Text style={styles.emptyBtnText}>Create Invoice</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

function InvoiceCard({ invoice }: { invoice: SalesInvoice }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push(`/invoice/${invoice.id}`)}
    >
      <View style={styles.cardLeft}>
        <View style={styles.cardIcon}>
          <Feather name="file-text" size={20} color={C.tint} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardNum}>{invoice.invoiceNumber}</Text>
          <Text style={styles.cardAmount}>{formatCurrency(invoice.total)}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardCustomer}>{invoice.customerName}</Text>
          <Text style={styles.cardDate}>{formatDate(invoice.date)}</Text>
        </View>
        <Text style={styles.cardItems}>
          {invoice.items.length} item{invoice.items.length !== 1 ? "s" : ""}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={C.textMuted} />
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
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  addBtn: {
    backgroundColor: C.tint,
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  cardLeft: { marginRight: 14 },
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
  cardNum: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  cardAmount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.tint,
  },
  cardCustomer: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
  cardItems: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
