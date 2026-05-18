import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { useAuth } from "../src/services/AuthContext";

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      {user && <Text style={styles.email}>{user.email}</Text>}
      <Text style={styles.subtitle}>
        Placeholder — dados do usuário e fotos de progresso virão aqui
      </Text>
      <View style={styles.buttonWrapper}>
        <Button title="Sair" onPress={logout} variant="secondary" />
      </View>
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
  email: {
    fontSize: 16,
    color: "#1f6feb",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  buttonWrapper: {
    width: "60%",
  },
});

export default ProfileScreen;
