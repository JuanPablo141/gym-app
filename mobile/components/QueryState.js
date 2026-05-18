import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import { colors, spacing } from "../src/services/theme";

const QueryState = ({
  isLoading,
  error,
  onRetry,
  isEmpty = false,
  emptyText = "Nada por aqui ainda.",
  errorText = "Algo deu errado.",
  size = "large",
  children,
}) => {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size={size} color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorText}</Text>
        {onRetry && (
          <View style={styles.retryWrapper}>
            <Button title="Tentar novamente" onPress={onRetry} />
          </View>
        )}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{emptyText}</Text>
      </View>
    );
  }

  return children ?? null;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: "center",
  },
  empty: {
    color: colors.textSubtle,
    fontSize: 14,
    textAlign: "center",
  },
  retryWrapper: {
    width: 200,
    marginTop: spacing.md,
  },
});

export default QueryState;
