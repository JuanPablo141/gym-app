import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import MuscleGroupCard from "../components/MuscleGroupCard";
import QueryState from "../components/QueryState";
import { MUSCLE_GROUPS } from "../src/services/constants";
import { useMuscleGroupCounts } from "../src/services/hooks";
import { useAuth } from "../src/services/AuthContext";
import { colors, spacing } from "../src/services/theme";

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { data: counts, isLoading, error, refetch } = useMuscleGroupCounts();

  const handlePress = useCallback(
    (groupKey) => {
      navigation.navigate("Exercises", {
        screen: "List",
        params: { muscleGroup: groupKey },
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <MuscleGroupCard
        group={item}
        count={counts?.[item.key] ?? 0}
        onPress={() => handlePress(item.key)}
      />
    ),
    [counts, handlePress]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Olá, {user?.first_name || user?.email?.split("@")[0] || "atleta"}!
        </Text>
        <Text style={styles.subtitle}>Escolha um grupo muscular</Text>
      </View>

      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        errorText="Não foi possível carregar os exercícios."
      >
        <FlatList
          data={MUSCLE_GROUPS}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  gridContent: {
    padding: 6,
    paddingBottom: spacing.xl,
  },
});

export default HomeScreen;
