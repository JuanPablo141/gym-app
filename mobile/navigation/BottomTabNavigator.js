import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import StackNavigator from "./StackNavigator";

const Tab = createBottomTabNavigator();

const iconFor = (routeName) => {
  switch (routeName) {
    case "Home":
      return "home-outline";
    case "Exercises":
      return "barbell-outline";
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
        component={HomeScreen}
        options={{ title: "Início" }}
      />
      <Tab.Screen
        name="Exercises"
        component={StackNavigator}
        options={{ title: "Exercícios", headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
