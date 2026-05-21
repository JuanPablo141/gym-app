import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import TemplatePickerScreen from "../screens/TemplatePickerScreen";

const Stack = createStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#1f6feb" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: "Início" }}
      />
      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ title: "Agenda Semanal" }}
      />
      <Stack.Screen
        name="TemplatePicker"
        component={TemplatePickerScreen}
        options={{ title: "Escolher treino" }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
