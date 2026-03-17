import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#020617",
          borderTopWidth: 0,
          height: 100,
          paddingBottom: 1,
          paddingTop: 6
        },
        tabBarActiveTintColor: "#f59e0b",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 12
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="labours"
        options={{
          title: "Labours",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}