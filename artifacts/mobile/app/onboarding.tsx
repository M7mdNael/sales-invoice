import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

function getApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "http://localhost:80";
}

type Step = "email" | "verify" | "profile";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useUser();

  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  const codeRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailError("Email address is required.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setSendingCode(true);
    try {
      const res = await fetch(`${getApiBase()}/api/verify/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code.");
      setCodeSent(true);
      setResendCooldown(60);
      setStep("verify");
      setTimeout(() => codeRef.current?.focus(), 400);
    } catch (err: any) {
      const msg = err?.message ?? "Could not send verification email. Please try again.";
      if (Platform.OS === "web") {
        setEmailError(msg);
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setCodeError("Please enter the 6-digit code.");
      return;
    }
    if (trimmedCode.length !== 6) {
      setCodeError("The code must be 6 digits.");
      return;
    }
    setCodeError("");
    setVerifying(true);
    try {
      const res = await fetch(`${getApiBase()}/api/verify/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: trimmedCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed.");
      setStep("profile");
      setTimeout(() => phoneRef.current?.focus(), 400);
    } catch (err: any) {
      setCodeError(err?.message ?? "Incorrect code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setCode("");
    setCodeError("");
    await handleSendCode();
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
    if (!firstName.trim()) {
      Alert.alert("Name Required", "Please enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      Alert.alert("Last Name Required", "Please enter your last name.");
      return;
    }
    setSaving(true);
    try {
      await register(trimmedPhone, firstName.trim(), lastName.trim(), email.trim().toLowerCase());
    } catch (err: any) {
      const msg = err?.message ?? "Registration failed. Please try again.";
      if (Platform.OS === "web") {
        Alert.alert("Error", msg);
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const padTop = insets.top + 40;
  const padBottom = insets.bottom + 40;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: padTop, paddingBottom: padBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoCircle}>
          <Feather name="file-text" size={36} color="#fff" />
        </View>
        <Text style={styles.title}>Sales Manager</Text>

        {/* Step indicator */}
        <View style={styles.steps}>
          {(["email", "verify", "profile"] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, step === s && styles.stepDotActive, (step === "verify" && i === 0) || (step === "profile" && i <= 1) ? styles.stepDotDone : null]}>
                {(step === "verify" && i === 0) || (step === "profile" && i <= 1) ? (
                  <Feather name="check" size={10} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, step === s && styles.stepNumActive]}>{i + 1}</Text>
                )}
              </View>
              {i < 2 && <View style={[styles.stepLine, (step === "verify" && i === 0) || (step === "profile" && i <= 1) ? styles.stepLineDone : null]} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── STEP 1: Email ── */}
        {step === "email" && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Enter your email</Text>
            <Text style={styles.stepDesc}>
              We'll send a verification code to confirm your identity.
            </Text>

            <Text style={styles.fieldLabel}>EMAIL ADDRESS *</Text>
            <View style={[styles.iconRow, !!emailError && styles.iconRowError]}>
              <View style={styles.iconBox}>
                <Feather name="mail" size={18} color={emailError ? C.danger : C.textMuted} />
              </View>
              <TextInput
                style={styles.iconInput}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSendCode}
              />
              {!!email.trim() && isValidEmail(email) && (
                <View style={styles.validIcon}>
                  <Feather name="check" size={14} color={C.success} />
                </View>
              )}
            </View>
            {!!emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : (
              <Text style={styles.hint}>
                Used to verify your identity and receive important notifications.
              </Text>
            )}

            <Pressable
              style={[styles.btn, (sendingCode || !email.trim()) && styles.btnDisabled]}
              onPress={handleSendCode}
              disabled={sendingCode || !email.trim()}
            >
              {sendingCode ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather name="send" size={18} color="#fff" />
              )}
              <Text style={styles.btnText}>
                {sendingCode ? "Sending..." : "Send Verification Code"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── STEP 2: Verify Code ── */}
        {step === "verify" && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Check your email</Text>
            <Text style={styles.stepDesc}>
              We sent a 6-digit code to{"\n"}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <Text style={styles.fieldLabel}>VERIFICATION CODE *</Text>
            <View style={[styles.codeInputRow, !!codeError && styles.iconRowError]}>
              <TextInput
                ref={codeRef}
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor={C.textMuted}
                value={code}
                onChangeText={(v) => { setCode(v.replace(/\D/g, "").slice(0, 6)); if (codeError) setCodeError(""); }}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifyCode}
                textAlign="center"
              />
            </View>
            {!!codeError ? (
              <Text style={styles.errorText}>{codeError}</Text>
            ) : (
              <Text style={styles.hint}>The code expires in 10 minutes.</Text>
            )}

            <Pressable
              style={[styles.btn, (verifying || code.trim().length !== 6) && styles.btnDisabled]}
              onPress={handleVerifyCode}
              disabled={verifying || code.trim().length !== 6}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather name="check-circle" size={18} color="#fff" />
              )}
              <Text style={styles.btnText}>
                {verifying ? "Verifying..." : "Verify Code"}
              </Text>
            </Pressable>

            <View style={styles.resendRow}>
              <Text style={styles.resendLabel}>Didn't receive it? </Text>
              <Pressable onPress={handleResend} disabled={resendCooldown > 0 || sendingCode}>
                <Text style={[styles.resendBtn, (resendCooldown > 0 || sendingCode) && styles.resendBtnDisabled]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.backBtn}
              onPress={() => { setStep("email"); setCode(""); setCodeError(""); }}
            >
              <Feather name="arrow-left" size={14} color={C.textSecondary} />
              <Text style={styles.backBtnText}>Change email</Text>
            </Pressable>
          </View>
        )}

        {/* ── STEP 3: Profile ── */}
        {step === "profile" && (
          <View style={styles.card}>
            <View style={styles.verifiedBadge}>
              <Feather name="shield" size={14} color={C.success} />
              <Text style={styles.verifiedText}>Email verified</Text>
            </View>

            <Text style={styles.stepTitle}>Complete your profile</Text>
            <Text style={styles.stepDesc}>
              Just a few more details to get started.
            </Text>

            <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
            <View style={styles.iconRow}>
              <View style={styles.iconBox}>
                <Text style={styles.iconEmoji}>📱</Text>
              </View>
              <TextInput
                ref={phoneRef}
                style={styles.iconInput}
                placeholder="e.g. 0787257541"
                placeholderTextColor={C.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => firstNameRef.current?.focus()}
              />
            </View>
            <Text style={[styles.hint, { marginBottom: 16 }]}>
              Your phone number is your unique ID — others use it to invite you to their company.
            </Text>

            <Text style={styles.fieldLabel}>FIRST NAME *</Text>
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

            <Text style={styles.fieldLabel}>LAST NAME *</Text>
            <TextInput
              ref={lastNameRef}
              style={styles.input}
              placeholder="Last name"
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
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather name="arrow-right" size={18} color="#fff" />
              )}
              <Text style={styles.btnText}>{saving ? "Setting up..." : "Get Started"}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.noteCard}>
          <Feather name="cloud" size={14} color={C.textMuted} />
          <Text style={styles.noteText}>
            Your data is securely synced to the cloud. Share invoices with a colleague using a workspace invite code.
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
    justifyContent: "center", alignItems: "center", marginBottom: 16,
    shadowColor: "#1A73E8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 20 },

  steps: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.border, justifyContent: "center", alignItems: "center",
  },
  stepDotActive: { backgroundColor: "#1A73E8" },
  stepDotDone: { backgroundColor: C.success },
  stepNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.textMuted },
  stepNumActive: { color: "#fff" },
  stepLine: { width: 40, height: 2, backgroundColor: C.border },
  stepLineDone: { backgroundColor: C.success },

  card: {
    width: "100%", backgroundColor: C.card, borderRadius: 20, padding: 20,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
    marginBottom: 16,
  },
  stepTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 6 },
  stepDesc: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 20, lineHeight: 20 },
  emailHighlight: { fontFamily: "Inter_600SemiBold", color: C.text },

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
  validIcon: { width: 36, height: 50, justifyContent: "center", alignItems: "center" },

  codeInputRow: {
    backgroundColor: C.background, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    marginBottom: 8, overflow: "hidden",
  },
  codeInput: {
    fontSize: 32, fontFamily: "Inter_700Bold", color: C.text,
    paddingVertical: 14, paddingHorizontal: 20, letterSpacing: 12,
  },

  hint: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, marginBottom: 4, lineHeight: 17 },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.danger, marginBottom: 4, lineHeight: 17 },

  input: {
    backgroundColor: C.background, borderRadius: 12, padding: 14, fontSize: 16,
    fontFamily: "Inter_400Regular", color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  btn: {
    backgroundColor: "#1A73E8", borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 8,
    shadowColor: "#1A73E8", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

  resendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 },
  resendLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  resendBtn: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1A73E8" },
  resendBtnDisabled: { color: C.textMuted },

  backBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, paddingVertical: 4 },
  backBtnText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },

  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.successLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: "flex-start", marginBottom: 16,
  },
  verifiedText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.success },

  noteCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.borderLight, borderRadius: 12, padding: 14,
    width: "100%",
  },
  noteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, lineHeight: 17 },
});
