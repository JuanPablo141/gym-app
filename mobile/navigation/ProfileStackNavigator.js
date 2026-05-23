import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "../screens/ProfileScreen";
import SessionsListScreen from "../screens/SessionsListScreen";
import SessionDetailScreen from "../screens/SessionDetailScreen";

const Stack = createStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#1f6feb" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
      <Stack.Screen
        name="SessionsList"
        component={SessionsListScreen}
        options={{ title: "Histórico de treinos" }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: "Sessão" }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
