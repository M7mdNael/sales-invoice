import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useUser();

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [saving, setSaving] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError && (!val.trim() || isValidEmail(val))) {
      setEmailError("");
    }
  };

  const handleEmailBlur = () => {
    if (email.trim() && !isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

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
    if (email.trim() && !isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    if (!firstName.trim()) {
      Alert.alert("Name Required", "Please enter your first name.");
      return;
    }
    setSaving(true);
    try {
      await register(trimmedPhone, firstName.trim(), lastName.trim(), email.trim());
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
          {/* Phone */}
          <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
          <View style={styles.iconRow}>
            <View style={styles.iconBox}>
              <Text style={styles.iconEmoji}>📱</Text>
            </View>
            <TextInput
              style={styles.iconInput}
              placeholder="e.g. 0787257541"
              placeholderTextColor={C.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </View>
          <Text style={styles.hint}>
            Your phone number is your unique ID — others use it to invite you to their company.
          </Text>

          {/* Email */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>EMAIL ADDRESS</Text>
          <View style={[styles.iconRow, emailError ? styles.iconRowError : null]}>
            <View style={styles.iconBox}>
              <Feather name="mail" size={18} color={emailError ? C.danger : C.textMuted} />
            </View>
            <TextInput
              ref={emailRef}
              style={styles.iconInput}
              placeholder="you@example.com (optional)"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => firstNameRef.current?.focus()}
            />
            {!!(email.trim()) && isValidEmail(email) && (
              <View style={styles.validIcon}>
                <Feather name="check" size={14} color={C.success} />
              </View>
            )}
          </View>
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : (
            <Text style={styles.hint}>
              Optional — can also be used to invite you to a company.
            </Text>
          )}

          {/* First name */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>FIRST NAME *</Text>
          <TextInput
            ref={firstNameRef}
            style={styles.input}
            placeholder="First name"
            placeholderTextColor={C.textMuted}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />

          {/* Last name */}
          <Text style={styles.fieldLabel}>LAST NAME</Text>
          <TextInput
            ref={lastNameRef}
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
  iconRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.background, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    marginBottom: 8, overflow: "hidden",
  },
  iconRowError: { borderColor: C.danger },
  iconBox: {
    width: 44, height: 50, justifyContent: "center", alignItems: "center",
    borderRightWidth: 1, borderRightColor: C.border,
  },
  iconEmoji: { fontSize: 20 },
  iconInput: {
    flex: 1, fontSize: 16, fontFamily: "Inter_400Regular", color: C.text,
    paddingHorizontal: 14, height: 50,
  },
  validIcon: {
    width: 36, height: 50, justifyContent: "center", alignItems: "center",
  },
  hint: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted,
    marginBottom: 4, lineHeight: 17,
  },
  errorText: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: C.danger,
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
