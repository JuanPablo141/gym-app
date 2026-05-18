import { createStackNavigator } from "@react-navigation/stack";
import ListScreen from "../screens/ListScreen";
import DetailScreen from "../screens/DetailScreen";

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#1f6feb" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name="List"
        component={ListScreen}
        options={{ title: "Exercícios" }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: "Detalhes" }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
