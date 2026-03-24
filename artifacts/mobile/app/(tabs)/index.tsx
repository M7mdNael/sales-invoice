import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
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
import { formatCurrency } from "@/utils/format";

const C = Colors.light;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { salesInvoices, returnInvoices, products, companies } = useApp();
  const { t, isRTL } = useLang();

  const totalSales = salesInvoices.reduce((s, inv) => s + inv.total, 0);
  const totalReturns = returnInvoices.reduce((s, inv) => s + inv.total, 0);
  const net = totalSales - totalReturns;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 + 84 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#1A73E8", "#0D47A1"]}
        style={[styles.header, { paddingTop: topPad + 20 }]}
      >
        <View style={[styles.headerTop, isRTL && styles.headerTopRTL]}>
          <Text style={styles.headerLabel}>{t("appName")}</Text>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => router.push("/settings/")}
          >
            <Feather name="settings" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{formatCurrency(net)}</Text>
        <Text style={[styles.headerSub, isRTL && styles.textRTL]}>{t("netRevenue")}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{salesInvoices.length}</Text>
            <Text style={styles.statLabel}>{t("invoices")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{returnInvoices.length}</Text>
            <Text style={styles.statLabel}>{t("returns")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{companies.length}</Text>
            <Text style={styles.statLabel}>{t("companies")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>{t("products")}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t("quickActions")}</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="plus-circle"
            label={t("newInvoice")}
            color="#1A73E8"
            bg="#E8F0FE"
            onPress={() => router.push("/invoice/create")}
          />
          <ActionCard
            icon="rotate-ccw"
            label={t("newReturn")}
            color="#EA4335"
            bg="#FCE8E6"
            onPress={() => router.push("/return/create")}
          />
          <ActionCard
            icon="briefcase"
            label={t("companies")}
            color="#7C3AED"
            bg="#EDE9FE"
            onPress={() => router.push("/companies/")}
          />
          <ActionCard
            icon="package"
            label={t("products")}
            color="#34A853"
            bg="#E6F4EA"
            onPress={() => router.push("/products/")}
          />
        </View>

        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t("summary")}</Text>
        <View style={styles.summaryCard}>
          <SummaryRow
            label={t("totalSales")}
            value={formatCurrency(totalSales)}
            color={C.success}
            isRTL={isRTL}
          />
          <View style={styles.divider} />
          <SummaryRow
            label={t("totalReturns")}
            value={formatCurrency(totalReturns)}
            color={C.danger}
            isRTL={isRTL}
          />
          <View style={styles.divider} />
          <SummaryRow
            label={t("net")}
            value={formatCurrency(net)}
            color={net >= 0 ? C.tint : C.danger}
            bold
            isRTL={isRTL}
          />
        </View>

        {salesInvoices.length > 0 && (
          <>
            <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
              <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t("recentInvoices")}</Text>
              <Pressable onPress={() => router.push("/(tabs)/invoices")}>
                <Text style={styles.seeAll}>{t("seeAll")}</Text>
              </Pressable>
            </View>
            {salesInvoices
              .slice(-3)
              .reverse()
              .map((inv) => (
                <Pressable
                  key={inv.id}
                  style={[styles.recentItem, isRTL && styles.recentItemRTL]}
                  onPress={() => router.push(`/invoice/${inv.id}`)}
                >
                  <View style={[styles.recentIcon, isRTL && styles.recentIconRTL]}>
                    <Feather name="file-text" size={18} color={C.tint} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentNum, isRTL && styles.textRTL]}>{inv.invoiceNumber}</Text>
                    <Text style={[styles.recentCustomer, isRTL && styles.textRTL]}>
                      {inv.companyName || inv.customerName}
                    </Text>
                  </View>
                  <Text style={styles.recentAmount}>{formatCurrency(inv.total)}</Text>
                </Pressable>
              ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function ActionCard({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
  color,
  bold,
  isRTL,
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
  isRTL?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
      <Text style={[styles.summaryLabel, bold && styles.summaryLabelBold, isRTL && styles.textRTL]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color }, bold && styles.summaryValueBold]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTopRTL: {
    flexDirection: "row-reverse",
  },
  settingsBtn: {
    padding: 4,
  },
  headerLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    marginBottom: 24,
  },
  textRTL: {
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  body: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderRTL: {
    flexDirection: "row-reverse",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.tint,
    marginTop: 20,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  summaryCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 4,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  summaryRowRTL: {
    flexDirection: "row-reverse",
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  summaryLabelBold: {
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  summaryValueBold: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginHorizontal: 16,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  recentItemRTL: {
    flexDirection: "row-reverse",
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentIconRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentNum: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  recentCustomer: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.tint,
  },
});
