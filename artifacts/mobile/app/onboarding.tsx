import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { useUser } from "@/context/UserContext";

const C = Colors.light;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useUser();
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleRegister = async () => {
    const trimmedPhone = phone.trim().replace(/\s+/g, "");
    if (!trimmedPhone) {
      Alert.alert("Phone Required", "Please enter your phone number.");
      return;
    }
    if (trimmedPhone.length < 7) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number.");
      return;
    }
    if (!firstName.trim()) {
      Alert.alert("Name Required", "Please enter your first name.");
      return;
    }
    setSaving(true);
    try {
      await register(trimmedPhone, firstName.trim(), lastName.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoCircle}>
          <Feather name="file-text" size={36} color="#fff" />
        </View>

        <Text style={styles.title}>Sales Manager</Text>
        <Text style={styles.subtitle}>Create your profile to get started</Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>📱</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="e.g. 0787257541"
              placeholderTextColor={C.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              returnKeyType="next"
            />
          </View>
          <Text style={styles.hint}>
            Your phone number is your unique ID. Others use it to invite you to their company.
          </Text>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>FIRST NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor={C.textMuted}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>LAST NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Last name (optional)"
            placeholderTextColor={C.textMuted}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <Pressable
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={saving}
          >
            <Feather name="arrow-right" size={18} color="#fff" />
            <Text style={styles.btnText}>{saving ? "Setting up..." : "Get Started"}</Text>
          </Pressable>
        </View>

        <View style={styles.noteCard}>
          <Feather name="shield" size={14} color={C.textMuted} />
          <Text style={styles.noteText}>
            Your data is stored only on this device. No account or internet required.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { alignItems: "center", paddingHorizontal: 24 },
  logoCircle: {
    width: 76, height: 76, borderRadius: 22, backgroundColor: "#1A73E8",
    justifyContent: "center", alignItems: "center", marginBottom: 20,
    shadowColor: "#1A73E8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 32, textAlign: "center" },
  card: {
    width: "100%", backgroundColor: C.card, borderRadius: 20, padding: 20,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  fieldLabel: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textSecondary,
    letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8,
  },
  phoneRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.background, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    marginBottom: 8, overflow: "hidden",
  },
  phonePrefix: {
    width: 44, height: 50, justifyContent: "center", alignItems: "center",
    borderRightWidth: 1, borderRightColor: C.border,
  },
  phonePrefixText: { fontSize: 20 },
  phoneInput: {
    flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", color: C.text,
    paddingHorizontal: 14, height: 50,
  },
  hint: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted,
    marginBottom: 4, lineHeight: 17,
  },
  input: {
    backgroundColor: C.background, borderRadius: 12, padding: 14, fontSize: 16,
    fontFamily: "Inter_400Regular", color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  btn: {
    backgroundColor: "#1A73E8", borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 4,
    shadowColor: "#1A73E8", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  noteCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.borderLight, borderRadius: 12, padding: 14,
    marginTop: 20, width: "100%",
  },
  noteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, lineHeight: 17 },
});
