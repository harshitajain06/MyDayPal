import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth } from "../config/firebase";

export default function useSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const db = getFirestore();

  // Fetch all schedules for the current user
  useEffect(() => {
    if (!auth.currentUser) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "schedules"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log("Schedules snapshot received:", snapshot.docs.length, "schedules");
        const schedulesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        }));
        console.log("Processed schedules:", schedulesData);
        setSchedules(schedulesData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching schedules:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Create a new schedule
  const createSchedule = async (scheduleData) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User must be logged in");
      }

      const newSchedule = {
        ...scheduleData,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("Creating schedule with data:", newSchedule);
      const docRef = await addDoc(collection(db, "schedules"), newSchedule);
      console.log("Schedule created with ID:", docRef.id);
      return { id: docRef.id, ...newSchedule };
    } catch (error) {
      console.error("Error creating schedule:", error);
      throw error;
    }
  };

  // Update an existing schedule
  const updateSchedule = async (scheduleId, updateData) => {
    try {
      const scheduleRef = doc(db, "schedules", scheduleId);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date(),
      };
      
      await updateDoc(scheduleRef, updatePayload);
      return { id: scheduleId, ...updatePayload };
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  };

  // Delete a schedule
  const deleteSchedule = async (scheduleId) => {
    try {
      await deleteDoc(doc(db, "schedules", scheduleId));
      return true;
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  };

  // Get a specific schedule by ID
  const getScheduleById = async (scheduleId) => {
    try {
      const scheduleRef = doc(db, "schedules", scheduleId);
      const scheduleSnap = await getDoc(scheduleRef);
      
      if (scheduleSnap.exists()) {
        return {
          id: scheduleSnap.id,
          ...scheduleSnap.data(),
          createdAt: scheduleSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: scheduleSnap.data().updatedAt?.toDate?.() || new Date(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching schedule:", error);
      throw error;
    }
  };

  // Get schedules by type (published/draft)
  const getSchedulesByType = (isPublished) => {
    return schedules.filter(schedule => schedule.isPublished === isPublished);
  };

  // Get published schedules
  const getPublishedSchedules = () => {
    return getSchedulesByType(true);
  };

  // Get draft schedules
  const getDraftSchedules = () => {
    return getSchedulesByType(false);
  };

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    getPublishedSchedules,
    getDraftSchedules,
    getSchedulesByType,
  };
}
