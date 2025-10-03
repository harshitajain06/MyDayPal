import React from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useNavigationData } from "../../contexts/NavigationContext";
import useSchedules from "../../hooks/useSchedules";
import useUser from "../../hooks/useUser";

export default function CaregiverDashboard({ navigation }) {
  const { userData, loading: userLoading } = useUser();
  const { schedules, loading: schedulesLoading, getPublishedSchedules, getDraftSchedules } = useSchedules();
  const { setRoutineData } = useNavigationData();
  const userName = userData?.name || "User";

  const handleRoutineClick = (routine) => {
    // Set the routine data in context
    setRoutineData(routine, true, routine.scheduleName || routine.title);
    // Navigate to ScheduleBuilder tab
    navigation.navigate("ScheduleBuilder");
  };

  const handleExistingScheduleClick = (schedule) => {
    // Set the schedule data in context
    setRoutineData(schedule, true, schedule.name);
    // Navigate to ScheduleBuilder tab
    navigation.navigate("ScheduleBuilder");
  };

  const scheduleCards = [
    {
      id: 1,
      title: "Morning Routine",
      icon: "☀️",
      steps: "6 steps",
      color: "#FFD700",
      scheduleName: "Morning Routine",
      predefinedSteps: [
        { id: 1, name: "Wake up", icon: "☀️", duration: "02:00", stepNumber: 1, notes: "" },
        { id: 2, name: "Brush teeth", icon: "🦷", duration: "03:00", stepNumber: 2, notes: "" },
        { id: 3, name: "Get dressed", icon: "👕", duration: "05:00", stepNumber: 3, notes: "" },
        { id: 4, name: "Eat breakfast", icon: "🍎", duration: "10:00", stepNumber: 4, notes: "" },
        { id: 5, name: "Pack school bag", icon: "🎒", duration: "03:00", stepNumber: 5, notes: "" },
        { id: 6, name: "Leave for school", icon: "🚂", duration: "02:00", stepNumber: 6, notes: "" }
      ]
    },
    {
      id: 2,
      title: "Afternoon Routine", 
      icon: "🌤️",
      steps: "5 steps",
      color: "#87CEEB",
      scheduleName: "Afternoon Routine",
      predefinedSteps: [
        { id: 1, name: "Lunch time", icon: "🍽️", duration: "15:00", stepNumber: 1, notes: "" },
        { id: 2, name: "Play time", icon: "🧸", duration: "30:00", stepNumber: 2, notes: "" },
        { id: 3, name: "Homework", icon: "📚", duration: "20:00", stepNumber: 3, notes: "" },
        { id: 4, name: "Snack time", icon: "🍎", duration: "10:00", stepNumber: 4, notes: "" },
        { id: 5, name: "Free time", icon: "🎯", duration: "15:00", stepNumber: 5, notes: "" }
      ]
    },
    {
      id: 3,
      title: "Evening Routine",
      icon: "🌅",
      steps: "4 steps", 
      color: "#FFA500",
      scheduleName: "Evening Routine",
      predefinedSteps: [
        { id: 1, name: "Dinner time", icon: "🍽️", duration: "20:00", stepNumber: 1, notes: "" },
        { id: 2, name: "Clean up", icon: "🧼", duration: "10:00", stepNumber: 2, notes: "" },
        { id: 3, name: "Play time", icon: "🎪", duration: "30:00", stepNumber: 3, notes: "" },
        { id: 4, name: "Prepare for bed", icon: "🛏️", duration: "15:00", stepNumber: 4, notes: "" }
      ]
    },
    {
      id: 4,
      title: "Bedtime",
      icon: "🌙",
      steps: "5 steps",
      color: "#9370DB",
      scheduleName: "Bedtime",
      predefinedSteps: [
        { id: 1, name: "Put on pajamas", icon: "👕", duration: "05:00", stepNumber: 1, notes: "" },
        { id: 2, name: "Brush teeth", icon: "🦷", duration: "03:00", stepNumber: 2, notes: "" },
        { id: 3, name: "Read bedtime story", icon: "📚", duration: "10:00", stepNumber: 3, notes: "" },
        { id: 4, name: "Say goodnight", icon: "❤️", duration: "02:00", stepNumber: 4, notes: "" },
        { id: 5, name: "Go to sleep", icon: "🌙", duration: "01:00", stepNumber: 5, notes: "" }
      ]
    }
  ];

  const recentActivities = [
    {
      id: 1,
      title: "Morning Routine finished",
      icon: "✅",
      time: "8:10 AM • 10/12 mins",
      color: "#4CAF50"
    },
    {
      id: 2,
      title: "New step added to Bedtime",
      icon: "🔵",
      time: "7:45 AM",
      color: "#20B2AA"
    },
    {
      id: 3,
      title: "Afternoon Routine completed",
      icon: "✅", 
      time: "Yesterday • 8/10 mins",
      color: "#4CAF50"
    }
  ];

  // Get schedules from Firebase
  const publishedSchedules = getPublishedSchedules();
  const draftSchedules = getDraftSchedules();
  const allFirebaseSchedules = [...publishedSchedules, ...draftSchedules];
  
  // Combine predefined routines with Firebase schedules
  const getDisplaySchedules = () => {
    const predefinedRoutines = scheduleCards;
    const firebaseSchedules = allFirebaseSchedules.map(schedule => ({
      id: `firebase_${schedule.id}`,
      title: schedule.name,
      icon: getRoutineIcon(schedule.routineType),
      steps: `${schedule.steps?.length || 0} steps`,
      color: getRoutineColor(schedule.routineType),
      scheduleName: schedule.name,
      predefinedSteps: schedule.steps || [],
      isFirebaseSchedule: true,
      firebaseData: schedule,
      isDraft: !schedule.isPublished
    }));
    
    // Filter out predefined routines that have Firebase equivalents
    const filteredPredefinedRoutines = predefinedRoutines.filter(routine => {
      return !allFirebaseSchedules.some(schedule => 
        schedule.routineType === routine.title
      );
    });
    
    return [...filteredPredefinedRoutines, ...firebaseSchedules];
  };

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

  if (userLoading || schedulesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20B2AA" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>Visual Scheduler</Text>
            <Text style={styles.wifiIcon}>📶</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Text style={styles.iconText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Text style={styles.iconText}>❓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Text style={styles.iconText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting and Main Actions */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Hello, {userName}! 👋</Text>
          <Text style={styles.subtitle}>Ready to start your day with visual schedules?</Text>
          
          <View style={styles.mainActions}>
      <TouchableOpacity
              style={[styles.mainButton, styles.newScheduleBtn]}
        onPress={() => navigation.navigate("ScheduleBuilder")}
      >
              <Text style={styles.mainButtonIcon}>➕</Text>
              <Text style={styles.mainButtonText}>New Schedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.mainButton, styles.quickTimerBtn]}>
              <Text style={styles.mainButtonIcon}>⏰</Text>
              <Text style={styles.mainButtonText}>Quick Timer</Text>
      </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Your Schedules Section */}
          <View style={styles.schedulesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Schedules</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllLink}>View All</Text>
      </TouchableOpacity>
    </View>
            
            <View style={styles.scheduleGrid}>
              {getDisplaySchedules().map((card) => (
                <TouchableOpacity 
                  key={card.id} 
                  style={styles.scheduleCard}
                  onPress={() => 
                    card.isFirebaseSchedule 
                      ? handleExistingScheduleClick(card.firebaseData)
                      : handleRoutineClick(card)
                  }
                >
                  <View style={[styles.scheduleIcon, { backgroundColor: card.color }]}>
                    <Text style={styles.scheduleIconText}>{card.icon}</Text>
                  </View>
                  <View style={styles.scheduleTitleContainer}>
                    <Text style={styles.scheduleTitle}>{card.title}</Text>
                    {card.isDraft && (
                      <Text style={styles.draftBadge}>Draft</Text>
                    )}
                  </View>
                  <Text style={styles.scheduleSteps}>{card.steps}</Text>
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => 
                      card.isFirebaseSchedule 
                        ? handleExistingScheduleClick(card.firebaseData)
                        : handleRoutineClick(card)
                    }
                  >
                    <Text style={styles.startButtonText}>▶️ Start</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activity Section */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityList}>
              {recentActivities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                    <View>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityTime}>{activity.time}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#20B2AA",
    marginRight: 8,
  },
  wifiIcon: {
    fontSize: 16,
  },
  headerRight: {
    flexDirection: "row",
  },
  headerIcon: {
    marginLeft: 15,
    padding: 5,
  },
  iconText: {
    fontSize: 18,
  },
  greetingSection: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 25,
  },
  mainActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mainButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },
  newScheduleBtn: {
    backgroundColor: "#20B2AA",
  },
  quickTimerBtn: {
    backgroundColor: "#FFD700",
  },
  mainButtonIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  mainButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  mainContent: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  schedulesSection: {
    flex: 1,
    marginRight: 10,
  },
  activitySection: {
    flex: 1,
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  viewAllLink: {
    fontSize: 14,
    color: "#20B2AA",
    fontWeight: "600",
  },
  scheduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  scheduleCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  scheduleIconText: {
    fontSize: 24,
  },
  scheduleTitleContainer: {
    alignItems: "center",
    marginBottom: 5,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    textAlign: "center",
  },
  draftBadge: {
    fontSize: 10,
    color: "#6c757d",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    fontWeight: "500",
  },
  scheduleSteps: {
    fontSize: 13,
    color: "#20B2AA",
    marginBottom: 10,
    fontWeight: "600",
    backgroundColor: "rgba(32, 178, 170, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#20B2AA",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  activityList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#6c757d",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
});
