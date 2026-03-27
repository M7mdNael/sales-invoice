import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";
import { getApiBase } from "@/utils/api";
import { formatCurrency, formatDate } from "@/utils/format";

const C = Colors.light;

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  companyName: string;
  total: number;
  date: string;
}

interface RecentReturn {
  id: string;
  returnNumber: string;
  customerName: string;
  companyName: string;
  total: number;
  date: string;
}

interface Member {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  invoiceCount: number;
  returnCount: number;
  recentInvoices: RecentInvoice[];
  recentReturns: RecentReturn[];
}

interface WorkspaceData {
  inviteCode: string;
  ownerEmail: string;
  members: Member[];
}

export default function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, joinWorkspace, refreshWorkspace } = useUser();

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joiningWorkspace, setJoiningWorkspace] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const fetchMembers = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(
        `${getApiBase()}/api/workspace/members?email=${encodeURIComponent(user.email)}`
      );
      const json = await res.json();
      if (json.members) setData(json);
    } catch (e) {
      console.error("workspace/members fetch error:", e);
    }
  }, [user?.email]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMembers();
      setLoading(false);
    })();
  }, [fetchMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    const code = data?.inviteCode ?? user?.inviteCode;
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      Alert.alert("Missing Code", "Please enter an invite code.");
      return;
    }
    setJoiningWorkspace(true);
    try {
      await joinWorkspace(code);
      await refreshWorkspace();
      setJoinCode("");
      await fetchMembers();
      Alert.alert("Joined!", "You are now part of the shared workspace. All invoices will sync.");
    } catch (err: any) {
      Alert.alert("Failed", err?.message ?? "Invalid invite code.");
    } finally {
      setJoiningWorkspace(false);
    }
  };

  const inviteCode = data?.inviteCode ?? user?.inviteCode ?? "";
  const ownerEmail = data?.ownerEmail ?? "";
  const isOwner = ownerEmail === user?.email;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.tint} />}
    >

      {/* Invite Code Card */}
      <View style={styles.inviteCard}>
        <View style={styles.inviteTop}>
          <View style={styles.inviteIconBox}>
            <Feather name="link" size={18} color="#1A73E8" />
          </View>
          <View style={styles.inviteTextBlock}>
            <Text style={styles.inviteLabel}>YOUR WORKSPACE CODE</Text>
            <Text style={styles.inviteCode}>{inviteCode || "—"}</Text>
          </View>
          <Pressable
            style={[styles.copyBtn, copiedCode && styles.copyBtnDone]}
            onPress={handleCopyCode}
            disabled={!inviteCode}
          >
            <Feather name={copiedCode ? "check" : "copy"} size={14} color={copiedCode ? C.success : C.tint} />
            <Text style={[styles.copyBtnText, copiedCode && styles.copyBtnTextDone]}>
              {copiedCode ? "Copied!" : "Copy"}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.inviteHint}>
          Share this code with a colleague — once they join, you'll share all invoices and returns.
        </Text>
      </View>

      {/* Join Workspace Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Join a Workspace</Text>
        <View style={styles.joinCard}>
          <Text style={styles.fieldLabel}>ENTER INVITE CODE</Text>
          <View style={styles.joinRow}>
            <TextInput
              style={styles.joinInput}
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              placeholder="e.g. XK7P2R"
              placeholderTextColor={C.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            <Pressable
              style={[styles.joinBtn, (!joinCode.trim() || joiningWorkspace) && styles.joinBtnDisabled]}
              onPress={handleJoin}
              disabled={!joinCode.trim() || joiningWorkspace}
            >
              {joiningWorkspace ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="arrow-right" size={16} color="#fff" />
              )}
              <Text style={styles.joinBtnText}>{joiningWorkspace ? "Joining..." : "Join"}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Members & Activity */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            Members ({data?.members?.length ?? 0})
          </Text>
          <Pressable style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
            <Feather name="refresh-cw" size={13} color={C.tint} />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </Pressable>
        </View>

        {(!data?.members || data.members.length === 0) ? (
          <View style={styles.emptyCard}>
            <Feather name="users" size={28} color={C.textMuted} />
            <Text style={styles.emptyText}>No members yet.</Text>
            <Text style={styles.emptySubtext}>Share your invite code to add a colleague.</Text>
          </View>
        ) : (
          data.members.map((member) => {
            const isMe = member.email === user?.email;
            const expanded = expandedMember === member.email;
            const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "?";

            return (
              <View key={member.email} style={styles.memberCard}>
                {/* Member Header */}
                <Pressable
                  style={styles.memberHeader}
                  onPress={() => setExpandedMember(expanded ? null : member.email)}
                >
                  <View style={[styles.memberAvatar, isMe && styles.memberAvatarMe]}>
                    <Text style={[styles.memberInitials, isMe && styles.memberInitialsMe]}>
                      {initials}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>
                        {member.firstName} {member.lastName}
                      </Text>
                      {isMe && (
                        <View style={styles.meBadge}>
                          <Text style={styles.meBadgeText}>You</Text>
                        </View>
                      )}
                      {ownerEmail === member.email && (
                        <View style={styles.ownerBadge}>
                          <Feather name="shield" size={10} color="#D97706" />
                          <Text style={styles.ownerBadgeText}>Owner</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <View style={styles.memberStats}>
                    <View style={styles.statBadge}>
                      <Feather name="file-text" size={10} color={C.tint} />
                      <Text style={styles.statBadgeText}>{member.invoiceCount}</Text>
                    </View>
                    <View style={[styles.statBadge, styles.statBadgeRed]}>
                      <Feather name="rotate-ccw" size={10} color={C.danger} />
                      <Text style={[styles.statBadgeText, styles.statBadgeTextRed]}>{member.returnCount}</Text>
                    </View>
                    <Feather
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={C.textMuted}
                    />
                  </View>
                </Pressable>

                {/* Activity Log */}
                {expanded && (
                  <View style={styles.activityLog}>
                    <View style={styles.logDivider} />

                    {member.recentInvoices.length === 0 && member.recentReturns.length === 0 ? (
                      <Text style={styles.logEmpty}>No recent activity.</Text>
                    ) : null}

                    {member.recentInvoices.length > 0 && (
                      <View>
                        <Text style={styles.logGroupTitle}>Recent Invoices</Text>
                        {member.recentInvoices.map((inv) => (
                          <View key={inv.id} style={styles.logRow}>
                            <View style={styles.logIconBox}>
                              <Feather name="file-text" size={12} color={C.tint} />
                            </View>
                            <View style={styles.logContent}>
                              <Text style={styles.logRef}>{inv.invoiceNumber}</Text>
                              <Text style={styles.logSub}>
                                {inv.companyName ? `${inv.companyName} · ` : ""}{inv.customerName}
                              </Text>
                            </View>
                            <View style={styles.logRight}>
                              <Text style={styles.logAmount}>{formatCurrency(inv.total)}</Text>
                              <Text style={styles.logDate}>{formatDate(inv.date)}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {member.recentReturns.length > 0 && (
                      <View style={{ marginTop: member.recentInvoices.length > 0 ? 10 : 0 }}>
                        <Text style={styles.logGroupTitle}>Recent Returns</Text>
                        {member.recentReturns.map((ret) => (
                          <View key={ret.id} style={styles.logRow}>
                            <View style={[styles.logIconBox, styles.logIconBoxRed]}>
                              <Feather name="rotate-ccw" size={12} color={C.danger} />
                            </View>
                            <View style={styles.logContent}>
                              <Text style={styles.logRef}>{ret.returnNumber}</Text>
                              <Text style={styles.logSub}>
                                {ret.companyName ? `${ret.companyName} · ` : ""}{ret.customerName}
                              </Text>
                            </View>
                            <View style={styles.logRight}>
                              <Text style={[styles.logAmount, { color: C.danger }]}>{formatCurrency(ret.total)}</Text>
                              <Text style={styles.logDate}>{formatDate(ret.date)}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  inviteCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1.5, borderColor: "#BFDBFE",
  },
  inviteTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  inviteIconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#DBEAFE",
    justifyContent: "center", alignItems: "center",
  },
  inviteTextBlock: { flex: 1 },
  inviteLabel: {
    fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#3B82F6",
    letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 2,
  },
  inviteCode: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#1E3A8A", letterSpacing: 4 },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#DBEAFE", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
  },
  copyBtnDone: { backgroundColor: C.successLight },
  copyBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.tint },
  copyBtnTextDone: { color: C.success },
  inviteHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#3B82F6", lineHeight: 17 },

  section: { marginBottom: 24 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12 },

  joinCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1,
  },
  fieldLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textSecondary,
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8,
  },
  joinRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  joinInput: {
    flex: 1, backgroundColor: C.background, borderRadius: 12, padding: 12, fontSize: 15,
    fontFamily: "Inter_600SemiBold", color: C.text, borderWidth: 1, borderColor: C.border,
    letterSpacing: 3,
  },
  joinBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.tint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  joinBtnDisabled: { opacity: 0.5 },
  joinBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  refreshBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.tintLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  refreshBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.tint },

  emptyCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 32,
    alignItems: "center", gap: 8,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  emptySubtext: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },

  memberCard: {
    backgroundColor: C.card, borderRadius: 14, marginBottom: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1,
    overflow: "hidden",
  },
  memberHeader: {
    flexDirection: "row", alignItems: "center", padding: 14, gap: 12,
  },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: C.borderLight,
    justifyContent: "center", alignItems: "center",
  },
  memberAvatarMe: { backgroundColor: "#DBEAFE" },
  memberInitials: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.textSecondary },
  memberInitialsMe: { color: "#1A73E8" },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  memberName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  meBadge: {
    backgroundColor: C.tintLight, borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  meBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: C.tint },
  ownerBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#FEF3C7", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
  },
  ownerBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#D97706" },
  memberEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  memberStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  statBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: C.tintLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4,
  },
  statBadgeRed: { backgroundColor: C.dangerLight },
  statBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.tint },
  statBadgeTextRed: { color: C.danger },

  activityLog: { paddingHorizontal: 14, paddingBottom: 14 },
  logDivider: { height: 1, backgroundColor: C.borderLight, marginBottom: 12 },
  logEmpty: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center", paddingVertical: 8 },
  logGroupTitle: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textSecondary,
    letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8,
  },
  logRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8,
  },
  logIconBox: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: C.tintLight,
    justifyContent: "center", alignItems: "center",
  },
  logIconBoxRed: { backgroundColor: C.dangerLight },
  logContent: { flex: 1 },
  logRef: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
  logSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 },
  logRight: { alignItems: "flex-end" },
  logAmount: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.tint },
  logDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 1 },
});
