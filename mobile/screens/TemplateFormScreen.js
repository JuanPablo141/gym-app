import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import Button from "../components/Button";
import QueryState from "../components/QueryState";
import TemplateExerciseEditor from "../components/TemplateExerciseEditor";
import {
  createTemplate,
  updateTemplate,
  useTemplateDetail,
} from "../src/services/hooks";
import { colors, radii, spacing } from "../src/services/theme";

const TemplateFormScreen = ({ navigation, route }) => {
  const templateId = route.params?.templateId ?? null;
  const isEditing = templateId !== null;
  const detail = useTemplateDetail(templateId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Editar Treino" : "Novo Treino",
    });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (isEditing && detail.data) {
      setName(detail.data.name);
      setDescription(detail.data.description ?? "");
      setExercises(detail.data.exercises ?? []);
    }
  }, [isEditing, detail.data]);

  const handlePickExercise = useCallback(
    (exercise) => {
      setExercises((prev) => [
        ...prev,
        {
          exercise: exercise.id,
          exercise_detail: exercise,
          target_sets: 3,
          target_reps: "8-12",
          rest_seconds: 90,
          notes: "",
        },
      ]);
    },
    []
  );

  const handleAddExercise = () => {
    navigation.navigate("ExercisePicker", { onPick: handlePickExercise });
  };

  const updateAt = useCallback((index, patch) => {
    setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }, []);

  const removeAt = useCallback((index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Dê um nome para o seu treino.");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      exercises: exercises.map((e, idx) => ({
        exercise: e.exercise,
        order: idx + 1,
        target_sets: Number(e.target_sets) || 1,
        target_reps: String(e.target_reps ?? ""),
        rest_seconds: Number(e.rest_seconds) || 0,
        notes: e.notes ?? "",
      })),
    };
    setIsSaving(true);
    try {
      if (isEditing) {
        await updateTemplate(templateId, payload);
      } else {
        await createTemplate(payload);
      }
      navigation.goBack();
    } catch (err) {
      const detailMsg =
        err?.response?.data?.detail ?? "Não foi possível salvar o treino.";
      Alert.alert("Erro", detailMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && (detail.isLoading || detail.error)) {
    return (
      <QueryState
        isLoading={detail.isLoading}
        error={detail.error}
        onRetry={detail.refetch}
        errorText="Não foi possível carregar o treino."
      />
    );
  }

  const ListHeader = (
    <View style={styles.formHeader}>
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex: Push Day"
      />
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Opcional"
        multiline
      />
      <Text style={styles.sectionTitle}>Exercícios</Text>
      {exercises.length === 0 && (
        <Text style={styles.emptyHint}>
          Toque em "Adicionar exercício" para começar.
        </Text>
      )}
    </View>
  );

  const ListFooter = (
    <View style={styles.footer}>
      <Button title="+ Adicionar exercício" onPress={handleAddExercise} variant="secondary" />
      <View style={{ height: spacing.md }} />
      <Button title="Salvar Treino" onPress={handleSave} loading={isSaving} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <DraggableFlatList
        data={exercises}
        keyExtractor={(item, idx) => `${item.exercise}-${idx}`}
        onDragEnd={({ data }) => setExercises(data)}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        renderItem={({ item, drag, isActive, getIndex }) => (
          <TemplateExerciseEditor
            item={item}
            onDrag={drag}
            isActive={isActive}
            onChange={(patch) => updateAt(getIndex(), patch)}
            onRemove={() => removeAt(getIndex())}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  formHeader: {
    padding: spacing.md,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  multiline: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textLabel,
    textTransform: "uppercase",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textSubtle,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  footer: {
    padding: spacing.md,
  },
});

export default TemplateFormScreen;
