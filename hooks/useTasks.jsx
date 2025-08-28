import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { auth } from "../config/firebase";

const STORAGE_KEY = "@tasks_cache";

export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const user = auth.currentUser;

  // Load from cache first
  useEffect(() => {
    (async () => {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) setTasks(JSON.parse(cached));
    })();
  }, []);

  // Subscribe to Firestore
  useEffect(() => {
    if (!user) return;

    const q = collection(db, "users", user.uid, "tasks");
    const unsub = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTasks(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });

    return () => unsub();
  }, [user]);

  const addTask = useCallback(async (task) => {
    if (!user) return;
    const docRef = await addDoc(collection(db, "users", user.uid, "tasks"), task);
    setTasks((prev) => [...prev, { id: docRef.id, ...task }]);
  }, [user]);

  const updateTask = useCallback(async (id, updates) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "tasks", id);
    await updateDoc(ref, updates);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, [user]);

  const deleteTask = useCallback(async (id) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "tasks", id);
    await deleteDoc(ref);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [user]);

  return { tasks, addTask, updateTask, deleteTask };
}
