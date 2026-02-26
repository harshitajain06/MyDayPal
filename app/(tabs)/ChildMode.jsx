import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import EmojiIcon from "../../components/EmojiIcon";
import useSchedules from "../../hooks/useSchedules";
import useTasks from "../../hooks/useTasks";
import useUser from "../../hooks/useUser";

export default function ChildMode() {
  const { userData, loading: userLoading } = useUser();
  const { schedules, loading: schedulesLoading, getPublishedSchedules } = useSchedules();
  const { tasks, updateTask } = useTasks();
  const [displaySchedules, setDisplaySchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isScheduleRunning, setIsScheduleRunning] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    if (tasks.length > 0) {
      Speech.speak(`Your first task is ${tasks[0].title}`);
    }
  }, [tasks]);

  // Play voice prompt and then audio when activity starts
  useEffect(() => {
    if (activeSchedule && isScheduleRunning && activeSchedule.predefinedSteps) {
      const currentActivity = activeSchedule.predefinedSteps[currentActivityIndex];
      if (currentActivity) {
        // Stop any existing speech and audio before starting new sequence
        Speech.stop();
        if (soundRef.current) {
          soundRef.current.unloadAsync().catch(() => {});
        }

        const speakText = currentActivity.voicePrompt
          ? currentActivity.voicePrompt
          : `Time for ${currentActivity.name}! Let's go!`;

        Speech.speak(speakText, {
          rate: 0.9,
          pitch: 1.1,
          // After voice prompt finishes, play audio note if available
          onDone: () => {
            if (currentActivity.audioNote) {
              playAudioNote(currentActivity.audioNote);
            }
          },
        });
      }
    }
  }, [currentActivityIndex, isScheduleRunning, activeSchedule]);

  const playAudioNote = async (audioUri) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error("Error playing audio note:", error);
    }
  };

  const playActivityAudio = async (activity) => {
    // Stop any currently playing speech and audio
    Speech.stop();
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {
        // ignore
      }
    }

    const speakText = activity.voicePrompt
      ? activity.voicePrompt
      : `Time for ${activity.name}! Let's go!`;

    Speech.speak(speakText, {
      rate: 0.9,
      pitch: 1.1,
      onDone: () => {
        if (activity.audioNote) {
          playAudioNote(activity.audioNote);
        }
      },
    });
  };

  const startSchedule = (schedule) => {
    if (schedule.predefinedSteps && schedule.predefinedSteps.length > 0) {
      setActiveSchedule(schedule);
      setCurrentActivityIndex(0);
      setIsScheduleRunning(true);

      // Stop any existing speech/audio before starting schedule
      Speech.stop();
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }

      // Play initial prompt, then audio note if available
      const firstActivity = schedule.predefinedSteps[0];
      const introText = firstActivity.voicePrompt
        ? firstActivity.voicePrompt
        : `Let's start ${schedule.title}! First, ${firstActivity.name}.`;

      Speech.speak(introText, {
        rate: 0.9,
        pitch: 1.1,
        onDone: () => {
          if (firstActivity.audioNote) {
            playAudioNote(firstActivity.audioNote);
          }
        },
      });
    }
  };

  const nextActivity = () => {
    if (activeSchedule && activeSchedule.predefinedSteps) {
      if (currentActivityIndex < activeSchedule.predefinedSteps.length - 1) {
        setCurrentActivityIndex(currentActivityIndex + 1);
      } else {
        // Schedule completed
        Speech.speak("Great job! You've completed the schedule!", {
          rate: 0.9,
          pitch: 1.1
        });
        setIsScheduleRunning(false);
        setActiveSchedule(null);
        setCurrentActivityIndex(0);
      }
    }
  };

  const stopSchedule = () => {
    setIsScheduleRunning(false);
    setActiveSchedule(null);
    setCurrentActivityIndex(0);
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
    Speech.stop();
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Update display schedules when schedules change - only show published schedules
  useEffect(() => {
    const publishedSchedules = getPublishedSchedules();
    
    // Filter to only show schedules created by the caregiver (parent)
    const parentSchedules = publishedSchedules.filter(schedule => 
      schedule.creatorRole === 'caregiver' || schedule.caregiverId === userData?.caregiverId
    );

    const formattedSchedules = parentSchedules.map(schedule => ({
      id: `schedule_${schedule.id}`,
      title: schedule.name,
      icon: getRoutineIcon(schedule.routineType),
      steps: `${schedule.steps?.length || 0} steps`,
      color: getRoutineColor(schedule.routineType),
      scheduleName: schedule.name,
      predefinedSteps: normalizeSteps(schedule.steps || []),
      firebaseData: schedule,
    }));

    setDisplaySchedules(formattedSchedules);
  }, [schedules, userData]);

  const getRoutineIcon = (routineType) => {
    const iconMap = {
      "Morning Routine": "☀️",
      "Afternoon Routine": "🌤️", 
      "Evening Routine": "🌅",
      "Bedtime": "🌙",
      "Custom": "⭐"
    };
    return iconMap[routineType] || "⭐";
  };

  const getRoutineColor = (routineType) => {
    const colorMap = {
      "Morning Routine": "#FFD700",
      "Afternoon Routine": "#87CEEB",
      "Evening Routine": "#FFA500", 
      "Bedtime": "#9370DB",
      "Custom": "#20B2AA"
    };
    return colorMap[routineType] || "#20B2AA";
  };

  // Helper function to ensure steps have default colorTag and voicePrompt
  const normalizeSteps = (stepsArray) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#95E1D3", "#FFE66D", "#A8E6CF"];
    return stepsArray.map((step, index) => ({
      ...step,
      colorTag: step.colorTag || colors[index % colors.length],
      voicePrompt: step.voicePrompt || `Time for ${step.name}! Come on, let's go!`,
      audioNote: step.audioNote || null
    }));
  };


  if (userLoading || schedulesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20B2AA" />
          <Text style={styles.loadingText}>Loading your schedules...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Schedules</Text>
          <Text style={styles.headerSubtitle}>Schedules from your parent</Text>
        </View>

        {/* Schedules Grid */}
        {displaySchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>No schedules yet</Text>
            <Text style={styles.emptySubtext}>Your parent will add schedules for you!</Text>
          </View>
        ) : (
          <View style={styles.schedulesGrid}>
            {displaySchedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={[styles.scheduleCard, { borderLeftColor: schedule.color }]}
                onPress={() => startSchedule(schedule)}
              >
                <View style={[styles.scheduleIcon, { backgroundColor: schedule.color }]}>
                  <EmojiIcon emoji={schedule.icon} size={32} color="#fff" />
                </View>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                  <Text style={styles.scheduleSteps}>{schedule.steps}</Text>
                </View>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => startSchedule(schedule)}
                >
                  <Text style={styles.startButtonText}>▶ Start</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Schedule Execution Modal */}
        {activeSchedule && (
          <Modal
            visible={isScheduleRunning}
            animationType="slide"
            transparent={false}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{activeSchedule.title}</Text>
                <TouchableOpacity onPress={stopSchedule} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Current Activity */}
                {activeSchedule.predefinedSteps && activeSchedule.predefinedSteps[currentActivityIndex] && (
                  <View style={styles.currentActivityCard}>
                    <Text style={styles.currentActivityLabel}>Current Activity</Text>
                    <View
                      style={[
                        styles.activityCard,
                        {
                          borderLeftColor:
                            activeSchedule.predefinedSteps[currentActivityIndex].colorTag ||
                            "#FF6B6B",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.activityColorTag,
                          {
                            backgroundColor:
                              activeSchedule.predefinedSteps[currentActivityIndex].colorTag ||
                              "#FF6B6B",
                          },
                        ]}
                      />
                      <View style={styles.activityContent}>
                        <View style={styles.activityHeader}>
                          <EmojiIcon
                            emoji={activeSchedule.predefinedSteps[currentActivityIndex].icon}
                            size={32}
                          />
                          <View style={styles.activityInfo}>
                            <Text style={styles.activityName}>
                              {activeSchedule.predefinedSteps[currentActivityIndex].name}
                            </Text>
                            <Text style={styles.activityDuration}>
                              Duration: {activeSchedule.predefinedSteps[currentActivityIndex].duration}
                            </Text>
                          </View>
                        </View>
                        {activeSchedule.predefinedSteps[currentActivityIndex].voicePrompt && (
                          <View style={styles.voicePromptCard}>
                            <EmojiIcon emoji="💬" size={16} />
                            <Text style={styles.voicePromptText}>
                              {activeSchedule.predefinedSteps[currentActivityIndex].voicePrompt}
                            </Text>
                          </View>
                        )}
                        {activeSchedule.predefinedSteps[currentActivityIndex].audioNote && (
                          <View style={styles.audioNoteCard}>
                            <EmojiIcon emoji="🔊" size={16} />
                            <Text style={styles.audioNoteText}>Audio note playing...</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Upcoming Activities */}
                <View style={styles.upcomingSection}>
                  <Text style={styles.sectionTitle}>Upcoming Activities</Text>
                  {activeSchedule.predefinedSteps &&
                    activeSchedule.predefinedSteps
                      .slice(currentActivityIndex + 1)
                      .map((activity, index) => (
                        <View
                          key={activity.id || index}
                          style={[
                            styles.activityCard,
                            styles.upcomingActivityCard,
                            {
                              borderLeftColor: activity.colorTag || "#FF6B6B",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.activityColorTag,
                              {
                                backgroundColor: activity.colorTag || "#FF6B6B",
                              },
                            ]}
                          />
                          <View style={styles.activityContent}>
                            <View style={styles.activityHeader}>
                              <EmojiIcon emoji={activity.icon} size={24} />
                              <View style={styles.activityInfo}>
                                <Text style={styles.activityName}>{activity.name}</Text>
                                <Text style={styles.activityDuration}>
                                  Duration: {activity.duration}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={styles.playAudioButton}
                                onPress={() => playActivityAudio(activity)}
                              >
                                <EmojiIcon emoji="🔊" size={20} />
                              </TouchableOpacity>
                            </View>
                            {activity.voicePrompt && (
                              <Text style={styles.upcomingPromptText}>
                                {activity.voicePrompt}
                              </Text>
                            )}
                            {activity.audioNote && (
                              <View style={styles.upcomingAudioNoteIndicator}>
                                <EmojiIcon emoji="🎵" size={12} />
                                <Text style={styles.upcomingAudioNoteText}>
                                  Audio note available
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={nextActivity}
                >
                  <Text style={styles.nextButtonText}>
                    {currentActivityIndex <
                    (activeSchedule.predefinedSteps?.length || 0) - 1
                      ? "Next Activity →"
                      : "Complete ✓"}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>
        )}

        {/* Current Task Section */}
        {tasks && tasks.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={styles.sectionTitle}>Current Task</Text>
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle}>{tasks[0].title}</Text>
              <TouchableOpacity
                style={styles.taskButton}
                onPress={() => updateTask(tasks[0].id, { done: true })}
              >
                <Text style={styles.taskButtonText}>Mark Done ✅</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6c757d",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },
  schedulesGrid: {
    padding: 16,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  scheduleSteps: {
    fontSize: 14,
    color: "#6c757d",
  },
  taskSection: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#90ee90",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  taskButton: {
    backgroundColor: "#90ee90",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  taskButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  startButton: {
    backgroundColor: "#20B2AA",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#6c757d",
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  currentActivityCard: {
    marginBottom: 24,
  },
  currentActivityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
  },
  activityColorTag: {
    width: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activityName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  activityDuration: {
    fontSize: 14,
    color: "#6c757d",
  },
  voicePromptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  voicePromptText: {
    fontSize: 14,
    color: "#1976d2",
    marginLeft: 8,
    flex: 1,
    fontStyle: "italic",
  },
  audioNoteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  audioNoteText: {
    fontSize: 14,
    color: "#856404",
    marginLeft: 8,
    fontWeight: "500",
  },
  upcomingSection: {
    marginTop: 8,
  },
  upcomingActivityCard: {
    opacity: 0.7,
  },
  upcomingPromptText: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 8,
    fontStyle: "italic",
  },
  playAudioButton: {
    padding: 8,
    backgroundColor: "#e3f2fd",
    borderRadius: 20,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingAudioNoteIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    padding: 6,
    backgroundColor: "#fff3cd",
    borderRadius: 6,
  },
  upcomingAudioNoteText: {
    fontSize: 10,
    color: "#856404",
    marginLeft: 4,
    fontWeight: "500",
  },
  modalActions: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  nextButton: {
    backgroundColor: "#20B2AA",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
