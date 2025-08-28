import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Speech from "expo-speech";
import useTasks from "../../hooks/useTasks";

export default function ChildMode() {
  const { tasks, updateTask } = useTasks();

  useEffect(() => {
    if (tasks.length > 0) {
      Speech.speak(`Your first task is ${tasks[0].title}`);
    }
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No tasks yet</Text>
      </View>
    );
  }

  const current = tasks[0];

  return (
    <View style={styles.container}>
      <Text style={styles.task}>{current.title}</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => updateTask(current.id, { done: true })}
      >
        <Text>Mark Done ✅</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  task: { fontSize: 24, marginBottom: 20 },
  btn: { padding: 20, backgroundColor: "#90ee90", borderRadius: 10 },
});
