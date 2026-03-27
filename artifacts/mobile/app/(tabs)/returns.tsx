import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { ReturnInvoice, useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { formatCurrency, formatDate } from "@/utils/format";

const C = Colors.light;

export default function ReturnsScreen() {
  const insets = useSafeAreaInsets();
  const { returnInvoices, companies, trashedInvoices, trashedReturns, deleteReturnInvoice } = useApp();
  const { t, isRTL } = useLang();
  const trashCount = trashedInvoices.length + trashedReturns.length;
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;

  const filtered = selectedCompanyId
    ? returnInvoices.filter((r) => r.companyId === selectedCompanyId)
    : returnInvoices;

  const sorted = [...filtered].reverse();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, isRTL && styles.textRTL]}>{t("returns")}</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.trashBtn}
            onPress={() => router.push("/trash")}
          >
            <Feather name="trash-2" size={18} color={C.textMuted} />
            {trashCount > 0 && (
              <View style={styles.trashBadge}>
                <Text style={styles.trashBadgeText}>{trashCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/return/create");
            }}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
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
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReturnCard ret={item} isRTL={isRTL} onDelete={() => {
          const msg = `Move ${item.returnNumber} to trash?`;
          if (Platform.OS === "web") {
            if (typeof window !== "undefined" && window.confirm(msg)) deleteReturnInvoice(item.id);
          } else {
            const { Alert } = require("react-native");
            Alert.alert("Move to Trash", msg, [
              { text: "Cancel", style: "cancel" },
              { text: "Move to Trash", style: "destructive", onPress: () => deleteReturnInvoice(item.id) },
            ]);
          }
        }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!sorted.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="undo-variant" size={36} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {selectedCompanyId ? t("noReturnsForCompany") : t("noReturnsYet")}
            </Text>
            {!selectedCompanyId && (
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push("/return/create")}
              >
                <Text style={styles.emptyBtnText}>{t("createReturn")}</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </View>
  );
}

function ReturnCard({ ret, isRTL, onDelete }: { ret: ReturnInvoice; isRTL: boolean; onDelete: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, isRTL && styles.cardRTL]}
      onPress={() => router.push(`/return/${ret.id}`)}
    >
      <View style={[styles.cardLeft, isRTL && styles.cardLeftRTL]}>
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons name="undo-variant" size={20} color={C.danger} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={[styles.cardRow, isRTL && styles.cardRowRTL]}>
          <Text style={[styles.cardNum, isRTL && styles.textRTL]}>{ret.returnNumber}</Text>
          <Text style={styles.cardAmount}>{formatCurrency(ret.total)}</Text>
        </View>
        {ret.companyName ? (
          <View style={[styles.companyRow, isRTL && styles.companyRowRTL]}>
            <Feather name="briefcase" size={11} color="#7C3AED" />
            <Text style={styles.companyText}>{ret.companyName}</Text>
          </View>
        ) : null}
        <View style={[styles.cardRow, isRTL && styles.cardRowRTL]}>
          <Text style={[styles.cardCustomer, isRTL && styles.textRTL]}>{ret.customerName}</Text>
          <Text style={styles.cardDate}>{formatDate(ret.date)}</Text>
        </View>
        <Text style={[styles.cardRef, isRTL && styles.textRTL]}>
          Ref: {ret.originalInvoiceNumber}
        </Text>
        {!!ret.creatorName && (
          <Text style={[styles.cardCreator, isRTL && styles.textRTL]}>By {ret.creatorName}</Text>
        )}
      </View>
      <Pressable style={styles.cardTrashBtn} onPress={(e) => { e.stopPropagation?.(); onDelete(); }}>
        <Feather name="trash-2" size={16} color={C.danger} />
      </Pressable>
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  trashBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.borderLight,
  },
  trashBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: C.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  trashBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  addBtn: {
    backgroundColor: C.danger,
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTrashBtn: {
    padding: 6,
    marginRight: 4,
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
  filterChipActive: { backgroundColor: C.danger, borderColor: C.danger },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  filterChipTextActive: { color: "#fff" },
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
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: C.dangerLight, justifyContent: "center", alignItems: "center",
  },
  cardBody: { flex: 1 },
  cardRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 3,
  },
  cardRowRTL: { flexDirection: "row-reverse" },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  companyRowRTL: { flexDirection: "row-reverse" },
  companyText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#7C3AED" },
  cardNum: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  cardAmount: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.danger },
  cardCustomer: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  cardRef: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  cardCreator: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.dangerLight,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 20, textAlign: "center" },
  emptyBtn: { backgroundColor: C.danger, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
