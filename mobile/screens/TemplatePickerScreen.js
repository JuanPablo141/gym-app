import { useCallback, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import QueryState from "../components/QueryState";
import TemplateCard from "../components/TemplateCard";
import { useTemplates } from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const TemplatePickerScreen = ({ navigation, route }) => {
  const onPick = route.params?.onPick;
  const { data, isLoading, error, refetch } = useTemplates();

  useEffect(() => {
    navigation.setOptions({ title: "Escolher treino" });
  }, [navigation]);

  const handlePick = useCallback(
    (template) => {
      onPick?.(template);
      navigation.goBack();
    },
    [onPick, navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <TemplateCard
        template={item}
        onPress={() => handlePick(item)}
        onStart={() => handlePick(item)}
        onEdit={() => handlePick(item)}
      />
    ),
    [handlePick]
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
        emptyText="Você ainda não tem treinos. Crie um na aba Treinos primeiro."
      >
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </QueryState>
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
});

export default TemplatePickerScreen;
