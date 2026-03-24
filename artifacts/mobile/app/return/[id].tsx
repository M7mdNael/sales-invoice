import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
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
import { useLang } from "@/context/LanguageContext";
import { formatCurrency, formatDate } from "@/utils/format";
import { generateAndShareReturnPDF } from "@/utils/pdf";

const C = Colors.light;

export default function ReturnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { returnInvoices } = useApp();
  const { t, isRTL } = useLang();
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
      Alert.alert(t("error"), t("errorPDF"));
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
          <View style={[styles.invHeader, isRTL && styles.invHeaderRTL]}>
            <View style={styles.invBadge}>
              <MaterialCommunityIcons name="undo-variant" size={14} color={C.danger} />
              <Text style={styles.invBadgeText}>{ret.returnNumber}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{t("return")}</Text>
            </View>
          </View>

          {ret.companyName ? (
            <View style={[styles.companyRow, isRTL && styles.companyRowRTL]}>
              <View style={styles.companyIcon}>
                <Feather name="briefcase" size={14} color="#7C3AED" />
              </View>
              <Text style={styles.companyName}>{ret.companyName}</Text>
            </View>
          ) : null}

          <Text style={[styles.customer, isRTL && styles.textRTL]}>{ret.customerName || "—"}</Text>
          <View style={[styles.refRow, isRTL && styles.refRowRTL]}>
            <Feather name="link" size={12} color={C.textMuted} />
            <Text style={styles.refText}>{t("ref")}: {ret.originalInvoiceNumber}</Text>
          </View>
          <Text style={[styles.dateText, isRTL && styles.textRTL]}>{formatDate(ret.date)}</Text>
        </View>

        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t("returnedItems")}</Text>
        <View style={styles.itemsCard}>
          <View style={[styles.itemsHeader, isRTL && styles.itemsHeaderRTL]}>
            <Text style={[styles.col, styles.colProduct]}>{t("product")}</Text>
            <Text style={[styles.col, styles.colQty]}>{t("qty")}</Text>
            <Text style={[styles.col, styles.colPrice]}>{t("unitPrice")}</Text>
            <Text style={[styles.col, styles.colTotal]}>{t("refund")}</Text>
          </View>
          {ret.items.map((item, i) => (
            <React.Fragment key={item.id}>
              {i > 0 && <View style={styles.sep} />}
              <View style={[styles.itemRow, isRTL && styles.itemRowRTL]}>
                <Text style={[styles.col, styles.colProduct, styles.itemText]}>{item.productName}</Text>
                <Text style={[styles.col, styles.colQty, styles.itemText]}>{item.quantity}</Text>
                <Text style={[styles.col, styles.colPrice, styles.itemText]}>{formatCurrency(item.price)}</Text>
                <Text style={[styles.col, styles.colTotal, styles.itemTotal]}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            </React.Fragment>
          ))}
          <View style={[styles.grandTotalRow, isRTL && styles.grandTotalRowRTL]}>
            <Text style={[styles.grandTotalLabel, isRTL && styles.textRTL]}>{t("totalRefund")}</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(ret.total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="share" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>{t("sharePDF")}</Text>
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
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
  topCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  invHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  invHeaderRTL: { flexDirection: "row-reverse" },
  invBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.dangerLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  invBadgeText: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.danger },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: C.warningLight },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.warning },
  companyRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8,
    backgroundColor: "#F5F3FF", paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, alignSelf: "flex-start",
  },
  companyRowRTL: { flexDirection: "row-reverse" },
  companyIcon: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: "#EDE9FE",
    justifyContent: "center", alignItems: "center",
  },
  companyName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#5B21B6" },
  customer: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 },
  textRTL: { textAlign: "right" },
  refRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  refRowRTL: { flexDirection: "row-reverse" },
  refText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  dateText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 10 },
  itemsCard: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  itemsHeader: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 16, backgroundColor: C.borderLight },
  itemsHeaderRTL: { flexDirection: "row-reverse" },
  col: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  colProduct: { flex: 2 },
  colQty: { flex: 0.7, textAlign: "center" },
  colPrice: { flex: 1.3, textAlign: "right" },
  colTotal: { flex: 1.3, textAlign: "right" },
  itemRow: { flexDirection: "row", paddingVertical: 13, paddingHorizontal: 16, alignItems: "center" },
  itemRowRTL: { flexDirection: "row-reverse" },
  itemText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.text },
  itemTotal: { fontFamily: "Inter_600SemiBold", color: C.danger },
  sep: { height: 1, backgroundColor: C.borderLight },
  grandTotalRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16, backgroundColor: C.dangerLight,
  },
  grandTotalRowRTL: { flexDirection: "row-reverse" },
  grandTotalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  grandTotalValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.danger },
  footer: {
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.backgroundSecondary,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.danger, borderRadius: 14, paddingVertical: 14,
  },
  shareBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
