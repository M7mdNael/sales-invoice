import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { Product, useApp } from "@/context/AppContext";
import { useLang } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils/format";

const C = Colors.light;

type Mode = "list" | "add" | "edit";

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const { t, isRTL } = useLang();
  const [mode, setMode] = useState<Mode>("list");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const openAdd = () => {
    setName(""); setPrice(""); setEditProduct(null); setMode("add");
  };

  const openEdit = (product: Product) => {
    setName(product.name); setPrice(String(product.price)); setEditProduct(product); setMode("edit");
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t("missingName"), t("enterProductName"));
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert(t("invalidPrice"), t("enterValidPrice"));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mode === "edit" && editProduct) {
      updateProduct(editProduct.id, name.trim(), priceNum);
    } else {
      addProduct(name.trim(), priceNum);
    }
    setMode("list");
  };

  const handleDelete = (product: Product) => {
    const message = `${t("deleteProductConfirm")} "${product.name}"?`;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) {
        deleteProduct(product.id);
      }
    } else {
      Alert.alert(t("deleteProduct"), message, [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteProduct(product.id);
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
            {mode === "edit" ? t("editProduct") : t("addProduct")}
          </Text>
          <Text style={[styles.fieldLabel, isRTL && styles.textRTL]}>{t("productName")}</Text>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={t("productName")}
            placeholderTextColor={C.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
            textAlign={isRTL ? "right" : "left"}
          />
          <Text style={[styles.fieldLabel, isRTL && styles.textRTL]}>{t("price")}</Text>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder="0.000"
            placeholderTextColor={C.textMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={handleSave}
            textAlign={isRTL ? "right" : "left"}
          />
          <View style={styles.formActions}>
            <Pressable style={styles.cancelBtn} onPress={() => setMode("list")}>
              <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>
                {mode === "edit" ? t("update") : t("addProduct")}
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
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            isRTL={isRTL}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!products.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="package" size={36} color={C.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>{t("noProductsYet")}</Text>
            <Text style={[styles.emptySub, isRTL && styles.textRTL]}>{t("addedProducts")}</Text>
            <Pressable style={styles.emptyBtn} onPress={openAdd}>
              <Text style={styles.emptyBtnText}>{t("addFirstProduct")}</Text>
            </Pressable>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>{t("addProduct")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProductCard({
  product,
  isRTL,
  onEdit,
  onDelete,
}: {
  product: Product;
  isRTL: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.card, isRTL && styles.cardRTL]}>
      <View style={styles.cardIcon}>
        <Feather name="package" size={20} color={C.success} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.productName, isRTL && styles.textRTL]}>{product.name}</Text>
        <Text style={[styles.productPrice, isRTL && styles.textRTL]}>{formatCurrency(product.price)}</Text>
      </View>
      <Pressable style={styles.editBtn} onPress={onEdit}>
        <Feather name="edit-2" size={16} color={C.tint} />
      </Pressable>
      <Pressable style={styles.deleteBtn} onPress={onDelete}>
        <Feather name="trash-2" size={16} color={C.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", marginBottom: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  cardRTL: { flexDirection: "row-reverse" },
  cardIcon: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: C.successLight,
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  cardBody: { flex: 1 },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  productPrice: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.tint, marginTop: 2 },
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
    width: 80, height: 80, borderRadius: 24, backgroundColor: C.successLight,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 6 },
  emptySub: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary,
    textAlign: "center", paddingHorizontal: 32, marginBottom: 24,
  },
  emptyBtn: { backgroundColor: C.success, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  footer: {
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.backgroundSecondary,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  addBtn: {
    backgroundColor: C.success, borderRadius: 14, flexDirection: "row",
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
  inputRTL: { textAlign: "right" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, backgroundColor: C.borderLight, borderRadius: 12,
    alignItems: "center", justifyContent: "center", paddingVertical: 14,
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  saveBtn: {
    flex: 2, backgroundColor: C.tint, borderRadius: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
