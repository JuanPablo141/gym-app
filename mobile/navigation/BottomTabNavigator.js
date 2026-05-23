import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStackNavigator from "./HomeStackNavigator";
import ProfileStackNavigator from "./ProfileStackNavigator";
import StackNavigator from "./StackNavigator";
import StatsScreen from "../screens/StatsScreen";
import TemplatesStackNavigator from "./TemplatesStackNavigator";

const Tab = createBottomTabNavigator();

const iconFor = (routeName) => {
  switch (routeName) {
    case "Home":
      return "home-outline";
    case "Exercises":
      return "barbell-outline";
    case "Templates":
      return "list-outline";
    case "Stats":
      return "stats-chart-outline";
    case "Profile":
      return "person-outline";
    default:
      return "ellipse-outline";
  }
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconFor(route.name)} color={color} size={size} />
        ),
        tabBarActiveTintColor: "#1f6feb",
        tabBarInactiveTintColor: "#8b949e",
        headerStyle: { backgroundColor: "#1f6feb" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ title: "Início", headerShown: false }}
      />
      <Tab.Screen
        name="Exercises"
        component={StackNavigator}
        options={{ title: "Exercícios", headerShown: false }}
      />
      <Tab.Screen
        name="Templates"
        component={TemplatesStackNavigator}
        options={{ title: "Treinos", headerShown: false }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: "Stats" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ title: "Perfil", headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
