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
import { formatCurrency } from "@/utils/format";

const C = Colors.light;

type Mode = "list" | "add" | "edit";

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [mode, setMode] = useState<Mode>("list");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const openAdd = () => {
    setName("");
    setPrice("");
    setEditProduct(null);
    setMode("add");
  };

  const openEdit = (product: Product) => {
    setName(product.name);
    setPrice(String(product.price));
    setEditProduct(product);
    setMode("edit");
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a product name.");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
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
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteProduct(product.id);
          },
        },
      ]
    );
  };

  if (mode === "add" || mode === "edit") {
    return (
      <View style={styles.container}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {mode === "edit" ? "Edit Product" : "New Product"}
          </Text>
          <Text style={styles.fieldLabel}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rice (1kg)"
            placeholderTextColor={C.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />
          <Text style={styles.fieldLabel}>Price (JOD)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={C.textMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => setMode("list")}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.saveBtnText}>
                {mode === "edit" ? "Update" : "Add Product"}
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
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomPad + 80,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!products.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="package" size={36} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySub}>
              Add products to start creating invoices
            </Text>
            <Pressable style={styles.emptyBtn} onPress={openAdd}>
              <Text style={styles.emptyBtnText}>Add First Product</Text>
            </Pressable>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Product</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Feather name="package" size={20} color={C.success} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
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
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.successLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardBody: { flex: 1 },
  productName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.tint,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.dangerLight,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.successLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: C.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  addBtn: {
    backgroundColor: C.success,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  addBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  formCard: {
    margin: 16,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: C.borderLight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: C.tint,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
