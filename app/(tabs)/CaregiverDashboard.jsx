import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function CaregiverDashboard({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver Dashboard</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("ScheduleBuilder")}
      >
        <Text>Build Schedule</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("Progress")}
      >
        <Text>View Progress</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("Settings")}
      >
        <Text>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, marginBottom: 20 },
  btn: { padding: 16, backgroundColor: "#ddd", margin: 10, borderRadius: 8 },
});
