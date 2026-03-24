import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { formatCurrency } from "@/utils/format";

const C = Colors.light;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { salesInvoices, returnInvoices, products } = useApp();

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
        <Text style={styles.headerLabel}>Sales Manager</Text>
        <Text style={styles.headerTitle}>{formatCurrency(net)}</Text>
        <Text style={styles.headerSub}>Net Revenue</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{salesInvoices.length}</Text>
            <Text style={styles.statLabel}>Invoices</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{returnInvoices.length}</Text>
            <Text style={styles.statLabel}>Returns</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="plus-circle"
            label="New Invoice"
            color="#1A73E8"
            bg="#E8F0FE"
            onPress={() => router.push("/invoice/create")}
          />
          <ActionCard
            icon="rotate-ccw"
            label="New Return"
            color="#EA4335"
            bg="#FCE8E6"
            onPress={() => router.push("/return/create")}
          />
          <ActionCard
            icon="package"
            label="Products"
            color="#34A853"
            bg="#E6F4EA"
            onPress={() => router.push("/products/")}
          />
          <ActionCard
            icon="bar-chart-2"
            label="Reports"
            color="#FBBC05"
            bg="#FEF3CD"
            onPress={() => router.push("/(tabs)/reports")}
          />
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryCard}>
          <SummaryRow
            label="Total Sales"
            value={formatCurrency(totalSales)}
            color={C.success}
          />
          <View style={styles.divider} />
          <SummaryRow
            label="Total Returns"
            value={formatCurrency(totalReturns)}
            color={C.danger}
          />
          <View style={styles.divider} />
          <SummaryRow
            label="Net"
            value={formatCurrency(net)}
            color={net >= 0 ? C.tint : C.danger}
            bold
          />
        </View>

        {salesInvoices.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Invoices</Text>
              <Pressable onPress={() => router.push("/(tabs)/invoices")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {salesInvoices
              .slice(-3)
              .reverse()
              .map((inv) => (
                <Pressable
                  key={inv.id}
                  style={styles.recentItem}
                  onPress={() => router.push(`/invoice/${inv.id}`)}
                >
                  <View style={styles.recentIcon}>
                    <Feather name="file-text" size={18} color={C.tint} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentNum}>{inv.invoiceNumber}</Text>
                    <Text style={styles.recentCustomer}>{inv.customerName}</Text>
                  </View>
                  <Text style={styles.recentAmount}>
                    {formatCurrency(inv.total)}
                  </Text>
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
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryLabelBold]}>
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
  headerLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
    marginBottom: 8,
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
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
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
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
