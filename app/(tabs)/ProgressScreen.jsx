import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import useSchedules from '../../hooks/useSchedules';
import useUser from '../../hooks/useUser';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const navigation = useNavigation();
  const { userData, loading: userLoading } = useUser();
  const { schedules, loading: schedulesLoading } = useSchedules();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Mock progress data - in a real app, this would come from Firebase
  const progressData = {
    week: {
      completedSchedules: 12,
      totalSchedules: 15,
      completionRate: 80,
      streak: 5,
      totalTime: 180, // minutes
      mostActiveDay: 'Monday'
    },
    month: {
      completedSchedules: 45,
      totalSchedules: 60,
      completionRate: 75,
      streak: 12,
      totalTime: 720,
      mostActiveDay: 'Tuesday'
    },
    year: {
      completedSchedules: 520,
      totalSchedules: 650,
      completionRate: 80,
      streak: 25,
      totalTime: 8640,
      mostActiveDay: 'Wednesday'
    }
  };

  const currentData = progressData[selectedPeriod];

  // Calculate schedule statistics
  const publishedSchedules = schedules.filter(s => s.isPublished);
  const draftSchedules = schedules.filter(s => !s.isPublished);
  const totalSteps = publishedSchedules.reduce((sum, schedule) => sum + (schedule.steps?.length || 0), 0);

  // Recent activities mock data
  const recentActivities = [
    {
      id: 1,
      scheduleName: "Morning Routine",
      action: "completed",
      time: "8:30 AM",
      duration: "25 minutes",
      icon: "✅"
    },
    {
      id: 2,
      scheduleName: "Afternoon Routine", 
      action: "started",
      time: "2:15 PM",
      duration: "15 minutes",
      icon: "▶️"
    },
    {
      id: 3,
      scheduleName: "Bedtime",
      action: "completed",
      time: "Yesterday",
      duration: "18 minutes",
      icon: "✅"
    },
    {
      id: 4,
      scheduleName: "Evening Routine",
      action: "skipped",
      time: "Yesterday",
      duration: "0 minutes",
      icon: "⏭️"
    }
  ];

  if (userLoading || schedulesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20B2AA" />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress Tracking</Text>
          <Text style={styles.headerSubtitle}>Track your schedule completion and progress</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['week', 'month', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentData.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${currentData.completionRate}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentData.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
            <Text style={styles.statSubtext}>Keep it up! 🔥</Text>
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={styles.detailedStats}>
          <View style={styles.detailCard}>
            <Text style={styles.detailNumber}>{currentData.completedSchedules}</Text>
            <Text style={styles.detailLabel}>Completed Schedules</Text>
            <Text style={styles.detailSubtext}>out of {currentData.totalSchedules}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailNumber}>{Math.floor(currentData.totalTime / 60)}h</Text>
            <Text style={styles.detailLabel}>Total Time</Text>
            <Text style={styles.detailSubtext}>{currentData.totalTime % 60}m this {selectedPeriod}</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailNumber}>{currentData.mostActiveDay}</Text>
            <Text style={styles.detailLabel}>Most Active Day</Text>
            <Text style={styles.detailSubtext}>Your best day!</Text>
          </View>
        </View>

        {/* Schedule Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Overview</Text>
          <View style={styles.overviewCards}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{publishedSchedules.length}</Text>
              <Text style={styles.overviewLabel}>Published Schedules</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{draftSchedules.length}</Text>
              <Text style={styles.overviewLabel}>Draft Schedules</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{totalSteps}</Text>
              <Text style={styles.overviewLabel}>Total Steps</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>{activity.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {activity.scheduleName} {activity.action}
                  </Text>
                  <Text style={styles.activityTime}>{activity.time} • {activity.duration}</Text>
                </View>
                <View style={styles.activityStatus}>
                  <Text style={styles.activityStatusText}>
                    {activity.action === 'completed' ? 'Done' : 
                     activity.action === 'started' ? 'In Progress' : 'Skipped'}
        </Text>
      </View>
    </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('ScheduleBuilder')}
            >
              <Text style={styles.quickActionIcon}>➕</Text>
              <Text style={styles.quickActionText}>Create Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CaregiverDashboard')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>View Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#20B2AA',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#20B2AA',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 10,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 12,
    color: '#20B2AA',
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#20B2AA',
    borderRadius: 3,
  },
  detailedStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 3,
    textAlign: 'center',
  },
  detailSubtext: {
    fontSize: 10,
    color: '#20B2AA',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  overviewCards: {
    flexDirection: 'row',
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#20B2AA',
    marginBottom: 5,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 3,
  },
  activityTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  activityStatus: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityStatusText: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
});
