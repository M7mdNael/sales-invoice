import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { SalesInvoice, ReturnInvoice, useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { formatCurrency, formatDate } from "@/utils/format";

const C = Colors.light;

type Tab = "invoices" | "returns" | "members";

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { companies, salesInvoices, returnInvoices, inviteMember, removeMember } = useApp();
  const { t, isRTL } = useLang();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("invoices");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviting, setInviting] = useState(false);

  const company = companies.find((c) => c.id === id);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;
  const isOwner = company?.ownerId === user?.phone;

  const handleInvite = () => {
    const phone = invitePhone.trim().replace(/\s+/g, "");
    if (!phone) return;
    if (phone === user?.phone) {
      Alert.alert("Invalid", "You cannot invite yourself.");
      return;
    }
    if (company?.members.includes(phone)) {
      Alert.alert("Already a member", `${phone} is already in this company.`);
      return;
    }
    setInviting(true);
    inviteMember(id!, phone);
    setInvitePhone("");
    setInviting(false);
    Alert.alert("Member Added", `${phone} has been added to ${company?.name}.`);
  };

  const handleRemoveMember = (phone: string) => {
    const msg = `Remove ${phone} from this company?`;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) {
        removeMember(id!, phone);
      }
    } else {
      Alert.alert("Remove Member", msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeMember(id!, phone) },
      ]);
    }
  };

  if (!company) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Company not found</Text>
      </View>
    );
  }

  const companyInvoices = salesInvoices
    .filter((inv) => inv.companyId === id)
    .reverse();
  const companyReturns = returnInvoices
    .filter((r) => r.companyId === id)
    .reverse();

  const totalSales = companyInvoices.reduce((s, inv) => s + inv.total, 0);
  const totalReturns = companyReturns.reduce((s, r) => s + r.total, 0);
  const net = totalSales - totalReturns;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Header */}
        <View style={styles.headerCard}>
          <View style={styles.companyIconWrap}>
            <Feather name="briefcase" size={28} color="#7C3AED" />
          </View>
          <Text style={[styles.companyName, isRTL && styles.textRTL]}>
            {company.name}
          </Text>
          {company.notes ? (
            <Text style={[styles.companyNotes, isRTL && styles.textRTL]}>
              {company.notes}
            </Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(totalSales)}</Text>
              <Text style={styles.statLabel}>{t("totalSales")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: C.danger }]}>
                {formatCurrency(totalReturns)}
              </Text>
              <Text style={styles.statLabel}>{t("totalReturns")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statValue,
                  { color: net >= 0 ? C.success : C.danger },
                ]}
              >
                {formatCurrency(net)}
              </Text>
              <Text style={styles.statLabel}>{t("net")}</Text>
            </View>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === "invoices" && styles.tabActive]}
            onPress={() => setActiveTab("invoices")}
          >
            <Feather
              name="file-text"
              size={16}
              color={activeTab === "invoices" ? C.tint : C.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "invoices" && styles.tabTextActive]}>
              {t("invoices")} ({companyInvoices.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "returns" && styles.tabActiveRed]}
            onPress={() => setActiveTab("returns")}
          >
            <MaterialCommunityIcons
              name="undo-variant"
              size={16}
              color={activeTab === "returns" ? C.danger : C.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "returns" && styles.tabTextRed]}>
              {t("returns")} ({companyReturns.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "members" && styles.tabActiveMembers]}
            onPress={() => setActiveTab("members")}
          >
            <Feather
              name="users"
              size={16}
              color={activeTab === "members" ? "#7C3AED" : C.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "members" && styles.tabTextMembers]}>
              Members ({company.members.length})
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.listContainer}>
          {activeTab === "invoices" ? (
            companyInvoices.length === 0 ? (
              <EmptyState
                icon="file-text"
                message={t("noInvoicesForCompany")}
                color={C.tint}
                bg={C.tintLight}
                onAdd={() => router.push({ pathname: "/invoice/create", params: { companyId: id } })}
                addLabel={t("newInvoice")}
              />
            ) : (
              companyInvoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} isRTL={isRTL} />
              ))
            )
          ) : activeTab === "returns" ? (
            companyReturns.length === 0 ? (
              <EmptyState
                icon="rotate-ccw"
                message={t("noReturnsForCompany")}
                color={C.danger}
                bg={C.dangerLight}
                onAdd={() => router.push({ pathname: "/return/create", params: { companyId: id } })}
                addLabel={t("newReturn")}
              />
            ) : (
              companyReturns.map((ret) => (
                <ReturnRow key={ret.id} ret={ret} isRTL={isRTL} />
              ))
            )
          ) : (
            <View>
              {isOwner && (
                <View style={styles.inviteCard}>
                  <Text style={styles.inviteTitle}>Invite by Phone Number</Text>
                  <Text style={styles.inviteHint}>
                    Enter the phone number of the person you want to add to this company.
                  </Text>
                  <View style={styles.inviteRow}>
                    <TextInput
                      style={styles.inviteInput}
                      placeholder="e.g. 0787257541"
                      placeholderTextColor={C.textMuted}
                      value={invitePhone}
                      onChangeText={setInvitePhone}
                      keyboardType="phone-pad"
                      returnKeyType="done"
                      onSubmitEditing={handleInvite}
                    />
                    <Pressable
                      style={[styles.inviteBtn, !invitePhone.trim() && styles.inviteBtnDisabled]}
                      onPress={handleInvite}
                      disabled={!invitePhone.trim() || inviting}
                    >
                      <Feather name="user-plus" size={16} color="#fff" />
                      <Text style={styles.inviteBtnText}>Add</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {company.members.length === 0 ? (
                <View style={styles.empty}>
                  <View style={[styles.emptyIcon, { backgroundColor: "#EDE9FE" }]}>
                    <Feather name="users" size={32} color="#7C3AED" />
                  </View>
                  <Text style={styles.emptyText}>No members yet</Text>
                </View>
              ) : (
                company.members.map((phone) => (
                  <View key={phone} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Feather name="user" size={18} color="#7C3AED" />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberPhone}>{phone}</Text>
                      {phone === company.ownerId && (
                        <Text style={styles.memberRole}>Owner</Text>
                      )}
                      {phone === user?.phone && phone !== company.ownerId && (
                        <Text style={[styles.memberRole, { color: C.tint }]}>You</Text>
                      )}
                    </View>
                    {isOwner && phone !== company.ownerId && (
                      <Pressable
                        style={styles.removeBtn}
                        onPress={() => handleRemoveMember(phone)}
                      >
                        <Feather name="x" size={16} color={C.danger} />
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating action bar */}
      <View style={[styles.fabBar, { paddingBottom: bottomPad }]}>
        <Pressable
          style={[styles.fabBtn, { backgroundColor: C.tint }]}
          onPress={() => router.push({ pathname: "/invoice/create", params: { companyId: id } })}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.fabBtnText}>{t("newInvoice")}</Text>
        </Pressable>
        <Pressable
          style={[styles.fabBtn, { backgroundColor: C.danger }]}
          onPress={() => router.push({ pathname: "/return/create", params: { companyId: id } })}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.fabBtnText}>{t("newReturn")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InvoiceRow({
  invoice,
  isRTL,
}: {
  invoice: SalesInvoice;
  isRTL: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        isRTL && styles.rowRTL,
      ]}
      onPress={() => router.push(`/invoice/${invoice.id}`)}
    >
      <View style={[styles.rowIcon, { backgroundColor: C.tintLight }]}>
        <Feather name="file-text" size={18} color={C.tint} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowNum, isRTL && styles.textRTL]}>
          {invoice.invoiceNumber}
        </Text>
        <Text style={[styles.rowDate, isRTL && styles.textRTL]}>
          {formatDate(invoice.date)} · {invoice.items.length} item
          {invoice.items.length !== 1 ? "s" : ""}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: C.tint }]}>
        {formatCurrency(invoice.total)}
      </Text>
      <Feather
        name={isRTL ? "chevron-left" : "chevron-right"}
        size={16}
        color={C.textMuted}
      />
    </Pressable>
  );
}

function ReturnRow({
  ret,
  isRTL,
}: {
  ret: ReturnInvoice;
  isRTL: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        isRTL && styles.rowRTL,
      ]}
      onPress={() => router.push(`/return/${ret.id}`)}
    >
      <View style={[styles.rowIcon, { backgroundColor: C.dangerLight }]}>
        <MaterialCommunityIcons name="undo-variant" size={18} color={C.danger} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowNum, isRTL && styles.textRTL]}>
          {ret.returnNumber}
        </Text>
        <Text style={[styles.rowDate, isRTL && styles.textRTL]}>
          {formatDate(ret.date)} · Ref: {ret.originalInvoiceNumber}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: C.danger }]}>
        {formatCurrency(ret.total)}
      </Text>
      <Feather
        name={isRTL ? "chevron-left" : "chevron-right"}
        size={16}
        color={C.textMuted}
      />
    </Pressable>
  );
}

function EmptyState({
  icon,
  message,
  color,
  bg,
  onAdd,
  addLabel,
}: {
  icon: keyof typeof Feather.glyphMap;
  message: string;
  color: string;
  bg: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={32} color={color} />
      </View>
      <Text style={styles.emptyText}>{message}</Text>
      <Pressable style={[styles.emptyBtn, { backgroundColor: color }]} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>{addLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
  textRTL: { textAlign: "right" },

  headerCard: {
    backgroundColor: "#7C3AED",
    padding: 24,
    alignItems: "center",
    paddingBottom: 28,
  },
  companyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  companyName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  companyNotes: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 20,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  statValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },

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
  tabActiveMembers: { borderBottomColor: "#7C3AED" },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.textMuted,
  },
  tabTextActive: { color: C.tint, fontFamily: "Inter_600SemiBold" },
  tabTextRed: { color: C.danger, fontFamily: "Inter_600SemiBold" },
  tabTextMembers: { color: "#7C3AED", fontFamily: "Inter_600SemiBold" },

  listContainer: { padding: 16, gap: 8 },

  row: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  rowRTL: { flexDirection: "row-reverse" },
  rowPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rowInfo: { flex: 1 },
  rowNum: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  rowDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    marginTop: 2,
  },
  rowAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },

  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
    textAlign: "center",
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  fabBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.card,
  },
  fabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  fabBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  inviteCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  inviteTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 4 },
  inviteHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginBottom: 12, lineHeight: 17 },
  inviteRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  inviteInput: {
    flex: 1, backgroundColor: C.background, borderRadius: 12, padding: 12,
    fontSize: 15, fontFamily: "Inter_400Regular", color: C.text,
    borderWidth: 1, borderColor: C.border,
  },
  inviteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#7C3AED", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
  },
  inviteBtnDisabled: { opacity: 0.5 },
  inviteBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  memberRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1,
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#EDE9FE",
    justifyContent: "center", alignItems: "center",
  },
  memberInfo: { flex: 1 },
  memberPhone: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  memberRole: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7C3AED", marginTop: 2 },
  removeBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: C.dangerLight,
    justifyContent: "center", alignItems: "center",
  },
});
