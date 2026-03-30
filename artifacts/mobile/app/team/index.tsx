import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUser } from "@/context/UserContext";
import { getApiBase } from "@/utils/api";

const C = Colors.light;

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  invoiceCount: number;
  returnCount: number;
  lastActive: string | null;
  joinedAt: string | null;
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "No activity";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString();
}

export default function TeamScreen() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${getApiBase()}/api/team?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (e) {
      console.error("fetchTeam error:", e);
    }
  }, [user?.email]);

  useEffect(() => {
    setLoading(true);
    fetchTeam().finally(() => setLoading(false));
  }, [fetchTeam]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTeam();
    setRefreshing(false);
  };

  const handleRemove = (member: TeamMember) => {
    if (!user?.isAdmin) return;
    const name = `${member.firstName} ${member.lastName}`.trim();
    const msg = `Remove ${name} from the team? They will no longer have access to company data.`;
    const doRemove = async () => {
      try {
        const res = await fetch(
          `${getApiBase()}/api/team/${member.id}?adminEmail=${encodeURIComponent(user.email)}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to remove member.");
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
      } catch (err: any) {
        Alert.alert("Error", err?.message ?? "Could not remove member.");
      }
    };
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) doRemove();
    } else {
      Alert.alert("Remove Member", msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doRemove },
      ]);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const renderMember = ({ item }: { item: TeamMember }) => {
    const fullName = `${item.firstName} ${item.lastName}`.trim();
    const isMe = item.id === user?.employeeId;
    const initials = (item.firstName[0] ?? "?").toUpperCase();

    return (
      <View style={styles.memberCard}>
        <View style={[styles.avatar, item.isAdmin && styles.avatarAdmin]}>
          <Text style={[styles.avatarText, item.isAdmin && styles.avatarTextAdmin]}>{initials}</Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>{fullName}</Text>
            {item.isAdmin && (
              <View style={styles.adminBadge}>
                <Feather name="shield" size={10} color="#fff" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
            {isMe && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
            )}
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Feather name="file-text" size={11} color={C.tint} />
              <Text style={styles.statText}>{item.invoiceCount} invoices</Text>
            </View>
            <View style={styles.statChip}>
              <Feather name="rotate-ccw" size={11} color="#7C3AED" />
              <Text style={[styles.statText, { color: "#7C3AED" }]}>{item.returnCount} returns</Text>
            </View>
          </View>
          <Text style={styles.lastActive}>
            {item.lastActive ? `Last active: ${formatRelativeDate(item.lastActive)}` : `Joined: ${formatRelativeDate(item.joinedAt)}`}
          </Text>
        </View>
        {user?.isAdmin && !item.isAdmin && !isMe && (
          <Pressable style={styles.removeBtn} onPress={() => handleRemove(item)}>
            <Feather name="x" size={16} color={C.danger} />
          </Pressable>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Team Members</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{members.length}</Text>
          </View>
        </View>
        {user?.isAdmin && (
          <View style={styles.adminNote}>
            <Feather name="shield" size={12} color={C.tint} />
            <Text style={styles.adminNoteText}>You're the admin</Text>
          </View>
        )}
      </View>

      <View style={styles.emailBanner}>
        <Feather name="mail" size={13} color={C.tint} />
        <Text style={styles.emailBannerText}>
          All devices logged in with <Text style={styles.emailBold}>{user?.email}</Text> share this team
        </Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.tint} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={40} color={C.border} />
            <Text style={styles.emptyText}>No team members yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  countBadge: {
    backgroundColor: C.tintLight, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.tint },
  adminNote: { flexDirection: "row", alignItems: "center", gap: 5 },
  adminNoteText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.tint },

  emailBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.tintLight, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  emailBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 17 },
  emailBold: { fontFamily: "Inter_600SemiBold", color: C.tint },

  list: { padding: 16, gap: 10 },

  memberCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: C.borderLight,
    justifyContent: "center", alignItems: "center",
  },
  avatarAdmin: { backgroundColor: "#DBEAFE" },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.textSecondary },
  avatarTextAdmin: { color: C.tint },

  memberInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  memberName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: C.tint, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  adminBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  youBadge: {
    backgroundColor: C.successLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  youBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: C.success },

  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.borderLight,
  },
  statText: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.tint },
  lastActive: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },

  removeBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: C.dangerLight,
    justifyContent: "center", alignItems: "center",
  },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textMuted },
});
