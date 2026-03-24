import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/utils/format";
import {
  generateAndShareSalesPDF,
} from "@/utils/pdf";

const C = Colors.light;

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { salesInvoices } = useApp();
  const [sharing, setSharing] = useState(false);
  const insets = useSafeAreaInsets();

  const invoice = salesInvoices.find((inv) => inv.id === id);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (!invoice) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Invoice not found</Text>
      </View>
    );
  }

  const handleShare = async () => {
    setSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await generateAndShareSalesPDF(invoice);
    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setSharing(false);
    }
  };

  const handleCreateReturn = () => {
    router.push({ pathname: "/return/create", params: { invoiceId: id } });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topCard}>
          <View style={styles.invHeader}>
            <View style={styles.invBadge}>
              <Text style={styles.invBadgeText}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: C.successLight }]}>
              <Text style={[styles.statusText, { color: C.success }]}>Completed</Text>
            </View>
          </View>
          <Text style={styles.customer}>{invoice.customerName}</Text>
          <Text style={styles.dateText}>{formatDate(invoice.date)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.itemsCard}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.col, styles.colProduct]}>Product</Text>
            <Text style={[styles.col, styles.colQty]}>Qty</Text>
            <Text style={[styles.col, styles.colPrice]}>Price</Text>
            <Text style={[styles.col, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((item, i) => (
            <React.Fragment key={item.id}>
              {i > 0 && <View style={styles.sep} />}
              <View style={styles.itemRow}>
                <Text style={[styles.col, styles.colProduct, styles.itemText]}>
                  {item.productName}
                </Text>
                <Text style={[styles.col, styles.colQty, styles.itemText]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.col, styles.colPrice, styles.itemText]}>
                  {formatCurrency(item.price)}
                </Text>
                <Text
                  style={[styles.col, styles.colTotal, styles.itemTotal]}
                >
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            </React.Fragment>
          ))}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable
          style={[styles.returnBtn, { flex: 1 }]}
          onPress={handleCreateReturn}
        >
          <Feather name="rotate-ccw" size={16} color={C.danger} />
          <Text style={styles.returnBtnText}>Return</Text>
        </Pressable>
        <Pressable
          style={[styles.shareBtn, { flex: 2 }]}
          onPress={handleShare}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="share" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>Share PDF</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  topCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  invHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  invBadge: {
    backgroundColor: C.tintLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  invBadgeText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.tint,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  customer: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 10,
  },
  itemsCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  itemsHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: C.borderLight,
  },
  col: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
  },
  colProduct: { flex: 2 },
  colQty: { flex: 0.7, textAlign: "center" },
  colPrice: { flex: 1.3, textAlign: "right" },
  colTotal: { flex: 1.3, textAlign: "right" },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  itemText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  itemTotal: {
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  sep: { height: 1, backgroundColor: C.borderLight },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.tintLight,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.tint,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  returnBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.dangerLight,
    borderRadius: 14,
    paddingVertical: 14,
  },
  returnBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.danger,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.tint,
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
