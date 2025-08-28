import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import useTasks from "../../hooks/useTasks";

export default function ScheduleBuilder() {
  const { tasks, addTask, deleteTask } = useTasks();
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (text.trim() === "") return;
    addTask({ title: text, done: false });
    setText("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Builder</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="New task"
        />
        <TouchableOpacity style={styles.btn} onPress={handleAdd}>
          <Text>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <Text>{item.title}</Text>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, borderWidth: 1, padding: 8, marginRight: 10, borderRadius: 6 },
  btn: { padding: 10, backgroundColor: "#ccc", borderRadius: 6 },
  taskRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
});
