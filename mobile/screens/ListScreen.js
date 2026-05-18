import { useCallback, useEffect } from "react";
import { FlatList, StyleSheet } from "react-native";
import ExerciseListItem from "../components/ExerciseListItem";
import QueryState from "../components/QueryState";
import { MUSCLE_GROUP_LABELS } from "../src/services/constants";
import { useExercises } from "../src/services/hooks";
import { colors } from "../src/services/theme";

const ListScreen = ({ navigation, route }) => {
  const muscleGroup = route?.params?.muscleGroup;
  const { data, isLoading, error, refetch } = useExercises({ muscleGroup });

  useEffect(() => {
    navigation.setOptions({
      title: muscleGroup
        ? MUSCLE_GROUP_LABELS[muscleGroup] ?? muscleGroup
        : "Todos os Exercícios",
    });
  }, [muscleGroup, navigation]);

  const handlePress = useCallback(
    (exercise) => {
      navigation.navigate("Detail", {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ExerciseListItem exercise={item} onPress={() => handlePress(item)} />
    ),
    [handlePress]
  );

  const isEmpty = !data || data.length === 0;

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      isEmpty={isEmpty}
      errorText="Não foi possível carregar os exercícios."
      emptyText="Nenhum exercício encontrado."
    >
      <FlatList
        style={styles.list}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        initialNumToRender={10}
        contentContainerStyle={styles.listContent}
      />
    </QueryState>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingVertical: 8,
  },
});

export default ListScreen;
