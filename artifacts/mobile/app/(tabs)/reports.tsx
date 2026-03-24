import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/utils/format";

const C = Colors.light;

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { salesInvoices, returnInvoices } = useApp();

  const totalSales = salesInvoices.reduce((s, inv) => s + inv.total, 0);
  const totalReturns = returnInvoices.reduce((s, inv) => s + inv.total, 0);
  const net = totalSales - totalReturns;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;

  const salesPercent =
    totalSales > 0 ? Math.min(100, (totalSales / (totalSales || 1)) * 100) : 0;
  const returnsPercent =
    totalSales > 0 ? Math.min(100, (totalReturns / totalSales) * 100) : 0;
  const netPercent =
    totalSales > 0 ? Math.max(0, Math.min(100, (net / totalSales) * 100)) : 0;

  const avgSale =
    salesInvoices.length > 0 ? totalSales / salesInvoices.length : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>Reports</Text>
      </View>

      <View style={styles.body}>
        <LinearGradient colors={["#1A73E8", "#0D47A1"]} style={styles.netCard}>
          <Text style={styles.netLabel}>Net Revenue</Text>
          <Text style={styles.netValue}>{formatCurrency(net)}</Text>
          <Text style={styles.netSub}>
            From {salesInvoices.length} invoices and {returnInvoices.length}{" "}
            returns
          </Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Financial Summary</Text>

        <MetricCard
          label="Total Sales"
          value={formatCurrency(totalSales)}
          sub={`${salesInvoices.length} invoices`}
          color={C.success}
          bg={C.successLight}
          icon="trending-up"
          percent={salesPercent}
        />
        <MetricCard
          label="Total Returns"
          value={formatCurrency(totalReturns)}
          sub={`${returnInvoices.length} return invoices`}
          color={C.danger}
          bg={C.dangerLight}
          icon="trending-down"
          percent={returnsPercent}
        />
        <MetricCard
          label="Net Revenue"
          value={formatCurrency(net)}
          sub={net >= 0 ? "Positive balance" : "Negative balance"}
          color={net >= 0 ? C.tint : C.danger}
          bg={net >= 0 ? C.tintLight : C.dangerLight}
          icon="activity"
          percent={netPercent}
        />

        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <StatBox
            label="Avg. Invoice"
            value={formatCurrency(avgSale)}
            icon="dollar-sign"
          />
          <StatBox
            label="Total Invoices"
            value={String(salesInvoices.length)}
            icon="file-text"
          />
          <StatBox
            label="Total Returns"
            value={String(returnInvoices.length)}
            icon="rotate-ccw"
          />
          <StatBox
            label="Return Rate"
            value={
              salesInvoices.length > 0
                ? `${((returnInvoices.length / salesInvoices.length) * 100).toFixed(0)}%`
                : "0%"
            }
            icon="percent"
          />
        </View>

        {salesInvoices.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityCard}>
              {salesInvoices
                .slice(-5)
                .reverse()
                .map((inv, i, arr) => (
                  <React.Fragment key={inv.id}>
                    <View style={styles.activityRow}>
                      <View style={[styles.actDot, { backgroundColor: C.success }]} />
                      <View style={styles.actInfo}>
                        <Text style={styles.actNum}>{inv.invoiceNumber}</Text>
                        <Text style={styles.actDate}>{formatDate(inv.date)}</Text>
                      </View>
                      <Text style={[styles.actAmount, { color: C.success }]}>
                        +{formatCurrency(inv.total)}
                      </Text>
                    </View>
                    {i < arr.length - 1 && <View style={styles.actDivider} />}
                  </React.Fragment>
                ))}
              {returnInvoices.slice(-3).reverse().map((ret, i) => (
                <React.Fragment key={ret.id}>
                  <View style={styles.actDivider} />
                  <View style={styles.activityRow}>
                    <View style={[styles.actDot, { backgroundColor: C.danger }]} />
                    <View style={styles.actInfo}>
                      <Text style={styles.actNum}>{ret.returnNumber}</Text>
                      <Text style={styles.actDate}>{formatDate(ret.date)}</Text>
                    </View>
                    <Text style={[styles.actAmount, { color: C.danger }]}>
                      -{formatCurrency(ret.total)}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
  bg,
  icon,
  percent,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
  icon: keyof typeof Feather.glyphMap;
  percent: number;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <View style={[styles.metricIcon, { backgroundColor: bg }]}>
          <Feather name={icon} size={20} color={color} />
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
          <Text style={styles.metricSub}>{sub}</Text>
        </View>
      </View>
      <View style={styles.barBg}>
        <View
          style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.statBox}>
      <Feather name={icon} size={18} color={C.tint} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
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
  body: { padding: 16 },
  netCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 8,
    alignItems: "center",
  },
  netLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  netValue: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 4,
  },
  netSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginTop: 20,
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  metricTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  metricInfo: { flex: 1 },
  metricLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
  },
  barBg: {
    height: 6,
    backgroundColor: C.borderLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    width: "47%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: { marginBottom: 6 },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },
  activityCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 4,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  actInfo: { flex: 1 },
  actNum: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  actDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 1,
  },
  actAmount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  actDivider: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 16 },
});
