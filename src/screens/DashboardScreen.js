import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { readLabours } from "../utils/labour";

export default function DashboardScreen() {
  const [totalLabours, setTotalLabours] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const loadStats = async () => {
    const labours = await readLabours();
    setTotalLabours(labours.length);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="account-hard-hat"
            size={60}
            color="#f59e0b"
          />
          <Text style={styles.title}>Labour Manager</Text>
          <Text style={styles.subtitle}>Manage your workers easily</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="account-group" size={32} color="#f59e0b" />
            <Text style={styles.cardTitle}>Total Labours</Text>
            <Text style={styles.cardValue}>{totalLabours}</Text>
          </View>

          <View style={styles.card}>
            <MaterialCommunityIcons name="calendar-check" size={32} color="#22c55e" />
            <Text style={styles.cardTitle}>Attendance</Text>
            <Text style={styles.cardValue}>Mark</Text>
          </View>

          <View style={styles.card}>
            <MaterialCommunityIcons name="cash" size={32} color="#38bdf8" />
            <Text style={styles.cardTitle}>Advances</Text>
            <Text style={styles.cardValue}>View</Text>
          </View>

          <View style={styles.card}>
            <MaterialCommunityIcons name="chart-bar" size={32} color="#a78bfa" />
            <Text style={styles.cardTitle}>Reports</Text>
            <Text style={styles.cardValue}>Open</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 5,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 14,
    marginBottom: 18,
    alignItems: "center",
    elevation: 4,
  },
  cardTitle: {
    color: "#cbd5f5",
    marginTop: 10,
    fontSize: 14,
  },
  cardValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
});
