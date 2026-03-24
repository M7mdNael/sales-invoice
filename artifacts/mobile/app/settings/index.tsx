import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useLang } from "@/context/LanguageContext";

const C = Colors.light;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, lang, isRTL, setLang } = useLang();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

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

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t("language")}</Text>

          <Pressable
            style={[styles.optionRow, isRTL && styles.optionRowRTL, lang === "en" && styles.optionRowActive]}
            onPress={() => handleSetLanguage("en")}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionFlag]}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  body: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 17, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12,
  },
  textRTL: { textAlign: "right" },
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
});
