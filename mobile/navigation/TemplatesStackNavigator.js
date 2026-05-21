import { createStackNavigator } from "@react-navigation/stack";
import ExercisePickerScreen from "../screens/ExercisePickerScreen";
import GuidedWorkoutScreen from "../screens/GuidedWorkoutScreen";
import TemplateFormScreen from "../screens/TemplateFormScreen";
import TemplatesListScreen from "../screens/TemplatesListScreen";

const Stack = createStackNavigator();

const TemplatesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#1f6feb" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name="TemplatesList"
        component={TemplatesListScreen}
        options={{ title: "Meus Treinos" }}
      />
      <Stack.Screen
        name="TemplateForm"
        component={TemplateFormScreen}
        options={{ title: "Treino" }}
      />
      <Stack.Screen
        name="ExercisePicker"
        component={ExercisePickerScreen}
        options={{ title: "Escolher exercício" }}
      />
      <Stack.Screen
        name="GuidedWorkout"
        component={GuidedWorkoutScreen}
        options={{ title: "Treino em andamento" }}
      />
    </Stack.Navigator>
  );
};

export default TemplatesStackNavigator;
