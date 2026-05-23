import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, View } from "react-native";
import QueryState from "../components/QueryState";
import SessionListCard from "../components/SessionListCard";
import { useSessions } from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const SessionsListScreen = ({ navigation }) => {
  const { data, isLoading, error, refetch } = useSessions();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const renderItem = useCallback(
    ({ item }) => (
      <SessionListCard
        session={item}
        onPress={() =>
          navigation.navigate("SessionDetail", { sessionId: item.id })
        }
      />
    ),
    [navigation]
  );

  const isEmpty = !data || data.length === 0;

  return (
    <View style={styles.container}>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        isEmpty={isEmpty}
        errorText="Não foi possível carregar seu histórico."
        emptyText="Você ainda não registrou nenhum treino."
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

export default SessionsListScreen;
