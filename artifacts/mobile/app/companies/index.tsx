import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { Company, useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";

const C = Colors.light;

type Mode = "list" | "add" | "edit";

export default function CompaniesScreen() {
  const insets = useSafeAreaInsets();
  const { companies, salesInvoices, addCompany, updateCompany, deleteCompany } = useApp();
  const { t, isRTL } = useLang();
  const { user } = useUser();
  const [mode, setMode] = useState<Mode>("list");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const openAdd = () => {
    setName("");
    setNotes("");
    setEditingCompany(null);
    setMode("add");
  };

  const openEdit = (company: Company) => {
    setName(company.name);
    setNotes(company.notes);
    setEditingCompany(company);
    setMode("edit");
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t("missingCompanyName"), t("enterCompanyName"));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const ownerId = user?.phone ?? "";
    if (mode === "edit" && editingCompany) {
      updateCompany(editingCompany.id, name.trim(), notes.trim());
    } else {
      addCompany(name.trim(), notes.trim(), ownerId);
    }
    setMode("list");
  };

  const handleDelete = (company: Company) => {
    const invoiceCount = salesInvoices.filter((inv) => inv.companyId === company.id).length;
    const message = invoiceCount > 0
      ? `${t("deleteCompanyConfirm")} "${company.name}"? This company has ${invoiceCount} invoice(s).`
      : `${t("deleteCompanyConfirm")} "${company.name}"?`;

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) {
        deleteCompany(company.id);
      }
    } else {
      Alert.alert(t("deleteCompany"), message, [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteCompany(company.id);
          },
        },
      ]);
    }
  };

  if (mode === "add" || mode === "edit") {
    return (
      <View style={styles.container}>
        <View style={styles.formCard}>
          <Text style={[styles.formTitle, isRTL && styles.textRTL]}>
            {mode === "edit" ? t("editCompany") : t("addCompany")}
          </Text>
          <Text style={[styles.fieldLabel, isRTL && styles.textRTL]}>{t("companyName")} *</Text>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={t("companyName")}
            placeholderTextColor={C.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
            textAlign={isRTL ? "right" : "left"}
          />
          <Text style={[styles.fieldLabel, isRTL && styles.textRTL]}>{t("companyNotes")}</Text>
          <TextInput
            style={[styles.input, styles.inputMulti, isRTL && styles.inputRTL]}
            placeholder={t("companyNotes")}
            placeholderTextColor={C.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            returnKeyType="done"
            textAlign={isRTL ? "right" : "left"}
            textAlignVertical="top"
          />
          <View style={styles.formActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setMode("list")}>
              <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>
                {mode === "edit" ? t("update") : t("save")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={companies}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => {
          const count = salesInvoices.filter((inv) => inv.companyId === item.id).length;
          const isOwner = item.ownerId === user?.phone;
          return (
            <CompanyCard
              company={item}
              invoiceCount={count}
              isRTL={isRTL}
              invoicesLabel={t("invoices")}
              isOwner={isOwner}
              memberCount={item.members.length}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!companies.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="briefcase" size={36} color={C.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>{t("noCompaniesYet")}</Text>
            <Text style={[styles.emptySub, isRTL && styles.textRTL]}>
              {t("addCompaniesFirst")}
            </Text>
            <Pressable style={styles.emptyBtn} onPress={openAdd}>
              <Text style={styles.emptyBtnText}>{t("addCompany")}</Text>
            </Pressable>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>{t("addCompany")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CompanyCard({
  company,
  invoiceCount,
  isRTL,
  invoicesLabel,
  isOwner,
  memberCount,
  onEdit,
  onDelete,
}: {
  company: Company;
  invoiceCount: number;
  isRTL: boolean;
  invoicesLabel: string;
  isOwner: boolean;
  memberCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, isRTL && styles.cardRTL, pressed && styles.cardPressed]}
      onPress={() => router.push(`/companies/${company.id}`)}
    >
      <View style={styles.cardIcon}>
        <Feather name="briefcase" size={20} color="#7C3AED" />
      </View>
      <View style={[styles.cardBody, isRTL && styles.cardBodyRTL]}>
        <Text style={[styles.companyName, isRTL && styles.textRTL]}>{company.name}</Text>
        {company.notes ? (
          <Text style={[styles.companyNotes, isRTL && styles.textRTL]} numberOfLines={1}>{company.notes}</Text>
        ) : null}
        <View style={[styles.metaRow, isRTL && styles.metaRowRTL]}>
          <Text style={[styles.invoiceCount]}>{invoiceCount} {invoicesLabel}</Text>
          {memberCount > 0 && (
            <View style={styles.memberBadge}>
              <Feather name="users" size={11} color="#7C3AED" />
              <Text style={styles.memberBadgeText}>{memberCount}</Text>
            </View>
          )}
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>Owner</Text>
            </View>
          )}
        </View>
      </View>
      <Pressable style={styles.editBtn} onPress={(e) => { e.stopPropagation?.(); onEdit(); }}>
        <Feather name="edit-2" size={16} color={C.tint} />
      </Pressable>
      <Pressable style={styles.deleteBtn} onPress={(e) => { e.stopPropagation?.(); onDelete(); }}>
        <Feather name="trash-2" size={16} color={C.danger} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", marginBottom: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  cardRTL: { flexDirection: "row-reverse" },
  cardIcon: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: "#EDE9FE",
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  cardBody: { flex: 1 },
  cardBodyRTL: { marginRight: 14 },
  companyName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  companyNotes: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" },
  metaRowRTL: { flexDirection: "row-reverse" },
  invoiceCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7C3AED" },
  memberBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#EDE9FE", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  memberBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#7C3AED" },
  ownerBadge: { backgroundColor: "#DBEAFE", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  ownerBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#1A73E8" },
  textRTL: { textAlign: "right" },
  editBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.tintLight,
    justifyContent: "center", alignItems: "center", marginRight: 8,
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.dangerLight,
    justifyContent: "center", alignItems: "center",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: "#EDE9FE",
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 6 },
  emptySub: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary,
    textAlign: "center", paddingHorizontal: 32, marginBottom: 24,
  },
  emptyBtn: { backgroundColor: "#7C3AED", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  footer: {
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.backgroundSecondary,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  addBtn: {
    backgroundColor: "#7C3AED", borderRadius: 14, flexDirection: "row",
    justifyContent: "center", alignItems: "center", paddingVertical: 16, gap: 8,
  },
  addBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  formCard: {
    margin: 16, backgroundColor: C.card, borderRadius: 20, padding: 20,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  formTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 20 },
  fieldLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary,
    letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8,
  },
  input: {
    backgroundColor: C.background, borderRadius: 12, padding: 14, fontSize: 16,
    fontFamily: "Inter_400Regular", color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  inputMulti: { height: 80, paddingTop: 14 },
  inputRTL: { textAlign: "right" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, backgroundColor: C.borderLight, borderRadius: 12,
    alignItems: "center", justifyContent: "center", paddingVertical: 14,
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  saveBtn: {
    flex: 2, backgroundColor: "#7C3AED", borderRadius: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
