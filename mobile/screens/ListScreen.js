import { StyleSheet, Text, View } from "react-native";

const ListScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Exercícios</Text>
      <Text style={styles.subtitle}>
        Placeholder — FlatList consumindo /api/exercises/ virá aqui
      </Text>
      <Text
        style={styles.link}
        onPress={() =>
          navigation.navigate("Detail", { exerciseId: "exemplo-uuid-123" })
        }
      >
        Testar navegação para Detalhe →
      </Text>
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
    textAlign: "center",
    marginBottom: 16,
  },
  link: {
    color: "#1f6feb",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ListScreen;
