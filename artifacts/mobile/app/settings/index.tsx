import { Feather } from "@expo/vector-icons";
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
import { useLang } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, lang, isRTL, setLang } = useLang();
  const { user, updateProfile, logout } = useUser();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const [editingProfile, setEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);

  const handleSetLanguage = async (newLang: "en" | "ar") => {
    if (newLang === lang) return;
    await setLang(newLang);
    Alert.alert(
      newLang === "ar" ? "تم تغيير اللغة" : "Language Changed",
      newLang === "ar"
        ? "تم ضبط اللغة على العربية. اتجاه التطبيق سيُطبَّق عند إعادة التشغيل."
        : "Language set to English. RTL direction will apply on restart.",
      [{ text: newLang === "ar" ? "حسناً" : "OK" }]
    );
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert("Name Required", "Please enter your first name.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(user?.phone ?? "", firstName.trim(), lastName.trim());
      setEditingProfile(false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    const msg = "This will clear your profile from this device. All company data will remain.";
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(msg)) {
        logout();
      }
    } else {
      Alert.alert("Sign Out", msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => logout() },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 20 }}>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>My Profile</Text>

        {editingProfile ? (
          <View style={styles.card}>
            <Text style={[styles.fieldLabel, isRTL && styles.textRTL]}>FIRST NAME *</Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
              placeholder="First name"
              placeholderTextColor={C.textMuted}
              textAlign={isRTL ? "right" : "left"}
            />
            <Text style={[styles.fieldLabel, isRTL && styles.textRTL]}>LAST NAME</Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={C.textMuted}
              textAlign={isRTL ? "right" : "left"}
            />
            <View style={styles.formActions}>
              <Pressable style={styles.cancelBtn} onPress={() => {
                setFirstName(user?.firstName ?? "");
                setLastName(user?.lastName ?? "");
                setEditingProfile(false);
              }}>
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveProfile} disabled={saving}>
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : t("save")}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.firstName?.[0] ?? "?").toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, isRTL && styles.textRTL]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <View style={styles.phoneRow}>
                <Feather name="phone" size={12} color={C.textMuted} />
                <Text style={styles.profilePhone}>{user?.phone}</Text>
              </View>
              <Text style={styles.profileIdHint}>This is your unique ID</Text>
            </View>
            <Pressable style={styles.editProfileBtn} onPress={() => {
              setFirstName(user?.firstName ?? "");
              setLastName(user?.lastName ?? "");
              setEditingProfile(true);
            }}>
              <Feather name="edit-2" size={16} color={C.tint} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t("language")}</Text>

        <Pressable
          style={[styles.optionRow, isRTL && styles.optionRowRTL, lang === "en" && styles.optionRowActive]}
          onPress={() => handleSetLanguage("en")}
        >
          <View style={styles.optionLeft}>
            <View style={styles.optionFlag}>
              <Text style={styles.flagEmoji}>🇺🇸</Text>
            </View>
            <Text style={[styles.optionLabel, isRTL && styles.textRTL]}>{t("english")}</Text>
          </View>
          {lang === "en" && (
            <View style={styles.checkCircle}>
              <Feather name="check" size={14} color="#fff" />
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.optionRow, isRTL && styles.optionRowRTL, lang === "ar" && styles.optionRowActive]}
          onPress={() => handleSetLanguage("ar")}
        >
          <View style={styles.optionLeft}>
            <View style={styles.optionFlag}>
              <Text style={styles.flagEmoji}>🇯🇴</Text>
            </View>
            <Text style={[styles.optionLabel, isRTL && styles.textRTL]}>{t("arabic")}</Text>
          </View>
          {lang === "ar" && (
            <View style={styles.checkCircle}>
              <Feather name="check" size={14} color="#fff" />
            </View>
          )}
        </Pressable>

        <View style={styles.noteCard}>
          <Feather name="info" size={14} color={C.textMuted} />
          <Text style={[styles.noteText, isRTL && styles.textRTL]}>{t("languageNote")}</Text>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>App Info</Text>
        <View style={styles.infoCard}>
          <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
            <Text style={styles.infoLabel}>Currency</Text>
            <Text style={styles.infoValue}>JOD — Jordanian Dinar</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={[styles.infoRow, isRTL && styles.infoRowRTL]}>
            <Text style={styles.infoLabel}>Storage</Text>
            <Text style={styles.infoValue}>Offline (Local)</Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={C.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 17, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12,
  },
  textRTL: { textAlign: "right" },

  profileCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: "#DBEAFE",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#1A73E8" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: C.text },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  profilePhone: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  profileIdHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  editProfileBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.tintLight,
    justifyContent: "center", alignItems: "center",
  },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  fieldLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textSecondary,
    letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6,
  },
  input: {
    backgroundColor: C.background, borderRadius: 12, padding: 13, fontSize: 15,
    fontFamily: "Inter_400Regular", color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  inputRTL: { textAlign: "right" },
  formActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1, backgroundColor: C.borderLight, borderRadius: 12,
    alignItems: "center", justifyContent: "center", paddingVertical: 12,
  },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  saveBtn: {
    flex: 2, backgroundColor: C.tint, borderRadius: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  optionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1, shadowRadius: 3, elevation: 1,
    borderWidth: 2, borderColor: "transparent",
  },
  optionRowRTL: { flexDirection: "row-reverse" },
  optionRowActive: { borderColor: C.tint, backgroundColor: C.tintLight },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionFlag: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.borderLight,
    justifyContent: "center", alignItems: "center",
  },
  flagEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 16, fontFamily: "Inter_500Medium", color: C.text },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: C.tint,
    justifyContent: "center", alignItems: "center",
  },
  noteCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: C.borderLight, borderRadius: 10, padding: 12, marginTop: 4,
  },
  noteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  infoCard: {
    backgroundColor: C.card, borderRadius: 14, overflow: "hidden",
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: 16,
  },
  infoRowRTL: { flexDirection: "row-reverse" },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  infoDivider: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 16 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.dangerLight, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1.5, borderColor: C.danger,
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.danger },
});
