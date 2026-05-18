import { StyleSheet, Text, View } from "react-native";

const DetailScreen = ({ route }) => {
  const exerciseId = route?.params?.exerciseId ?? "(sem id)";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes do Exercício</Text>
      <Text style={styles.subtitle}>Placeholder</Text>
      <Text style={styles.idLabel}>exerciseId recebido por params:</Text>
      <Text style={styles.idValue}>{exerciseId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  idLabel: {
    fontSize: 12,
    color: "#999",
  },
  idValue: {
    fontSize: 14,
    fontFamily: "monospace",
    marginTop: 4,
  },
});

export default DetailScreen;
