import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import QueryState from "../components/QueryState";
import TemplateCard from "../components/TemplateCard";
import { deleteTemplate, useTemplates } from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const TemplatesListScreen = ({ navigation }) => {
  const { data, isLoading, error, refetch } = useTemplates();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleEdit = useCallback(
    (template) => {
      navigation.navigate("TemplateForm", { templateId: template.id });
    },
    [navigation]
  );

  const handleStart = useCallback(() => {
    Alert.alert(
      "Em breve",
      "O fluxo guiado de treino vem na próxima feature."
    );
  }, []);

  const handleLongPress = useCallback(
    (template) => {
      Alert.alert(template.name, "O que deseja fazer?", [
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTemplate(template.id);
              refetch();
            } catch {
              Alert.alert("Erro", "Não foi possível excluir o template.");
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]);
    },
    [refetch]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <TemplateCard
        template={item}
        onPress={() => handleEdit(item)}
        onLongPress={() => handleLongPress(item)}
        onStart={handleStart}
        onEdit={() => handleEdit(item)}
      />
    ),
    [handleEdit, handleLongPress, handleStart]
  );

  const isEmpty = !data || data.length === 0;

  return (
    <View style={styles.container}>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        isEmpty={isEmpty}
        errorText="Não foi possível carregar seus treinos."
        emptyText="Você ainda não tem nenhum treino. Toque no + para criar o primeiro."
      >
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </QueryState>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("TemplateForm", { templateId: null })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color={colors.surface} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default TemplatesListScreen;
