import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../src/services/theme";

const DEFAULT_MAX = 200;

const EditableNote = ({
  value,
  onSave,
  placeholder = "Como foi?",
  addLabel = "Adicionar nota",
  maxLength = DEFAULT_MAX,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setDraft(value ?? "");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(value ?? "");
  };

  const handleSave = async () => {
    const next = draft.trim();
    if (next === (value ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a nota.");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <View style={styles.wrap}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          multiline
          maxLength={maxLength}
          autoFocus
          editable={!saving}
          style={styles.input}
        />
        <View style={styles.footer}>
          <Text style={styles.counter}>{`${draft.length}/${maxLength}`}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={saving}
              style={styles.actionBtn}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.actionBtn, styles.saveBtn]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.saveText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (value) {
    return (
      <TouchableOpacity
        onPress={handleOpen}
        style={styles.idleWithValue}
        activeOpacity={0.7}
      >
        <Text style={styles.idleText}>{value}</Text>
        <Ionicons name="pencil-outline" size={13} color={colors.textSubtle} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleOpen}
      style={styles.addBtn}
      activeOpacity={0.7}
    >
      <Ionicons name="add-circle-outline" size={15} color={colors.textSubtle} />
      <Text style={styles.addText}>{addLabel}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginVertical: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    minHeight: 48,
    textAlignVertical: "top",
    backgroundColor: colors.inputBg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  counter: {
    fontSize: 11,
    color: colors.textSubtle,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    minWidth: 64,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  saveText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
  },
  idleWithValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  idleText: {
    flex: 1,
    fontSize: 13,
    fontStyle: "italic",
    color: colors.textSubtle,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  addText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSubtle,
  },
});

export default EditableNote;
