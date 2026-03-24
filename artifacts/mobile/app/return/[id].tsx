import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
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
import { generateAndShareReturnPDF } from "@/utils/pdf";

const C = Colors.light;

export default function ReturnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { returnInvoices } = useApp();
  const [sharing, setSharing] = useState(false);
  const insets = useSafeAreaInsets();

  const ret = returnInvoices.find((r) => r.id === id);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (!ret) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Return not found</Text>
      </View>
    );
  }

  const handleShare = async () => {
    setSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await generateAndShareReturnPDF(ret);
    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setSharing(false);
    }
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
              <MaterialCommunityIcons name="undo-variant" size={14} color={C.danger} />
              <Text style={styles.invBadgeText}>{ret.returnNumber}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Return</Text>
            </View>
          </View>
          <Text style={styles.customer}>{ret.customerName}</Text>
          <View style={styles.refRow}>
            <Feather name="link" size={12} color={C.textMuted} />
            <Text style={styles.refText}>Ref: {ret.originalInvoiceNumber}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(ret.date)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Returned Items</Text>
        <View style={styles.itemsCard}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.col, styles.colProduct]}>Product</Text>
            <Text style={[styles.col, styles.colQty]}>Qty</Text>
            <Text style={[styles.col, styles.colPrice]}>Price</Text>
            <Text style={[styles.col, styles.colTotal]}>Refund</Text>
          </View>
          {ret.items.map((item, i) => (
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
                <Text style={[styles.col, styles.colTotal, styles.itemTotal]}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            </React.Fragment>
          ))}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Refund</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(ret.total)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable
          style={styles.shareBtn}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  invBadgeText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.danger,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: C.warningLight,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.warning,
  },
  customer: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 4,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  refText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
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
    color: C.danger,
  },
  sep: { height: 1, backgroundColor: C.borderLight },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.dangerLight,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.danger,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.danger,
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
