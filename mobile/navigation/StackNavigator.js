import { createStackNavigator } from "@react-navigation/stack";
import ListScreen from "../screens/ListScreen";
import DetailScreen from "../screens/DetailScreen";
import WorkoutScreen from "../screens/WorkoutScreen";

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
      <Stack.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ title: "Treino em andamento" }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
