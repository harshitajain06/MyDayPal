import { useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import useSchedules from "../../hooks/useSchedules";
import useUser from "../../hooks/useUser";

export default function ScheduleBuilder() {
  const { userData, loading: userLoading } = useUser();
  const { createSchedule, updateSchedule, getScheduleById } = useSchedules();
  const route = useRoute();
  const { routine, isEditing, scheduleId: existingScheduleId, existingSchedule } = route.params || {};
  
  const [scheduleName, setScheduleName] = useState(
    existingSchedule?.name || routine?.scheduleName || "Morning"
  );
  const [steps, setSteps] = useState(
    existingSchedule?.steps || routine?.predefinedSteps || [
      {
        id: 1,
        name: "Wake up",
        icon: "☀️",
        duration: "02:00",
        stepNumber: 1,
        notes: ""
      },
      {
        id: 2,
        name: "Brush teeth",
        icon: "🦷",
        duration: "03:00", 
        stepNumber: 2,
        notes: ""
      }
    ]
  );
  const [selectedStep, setSelectedStep] = useState(null);
  const [newStepName, setNewStepName] = useState("");
  const [newStepDuration, setNewStepDuration] = useState("2");
  const [newStepNotes, setNewStepNotes] = useState("");
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scheduleId, setScheduleId] = useState(existingScheduleId || null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Set initial selected step when steps are loaded
  useEffect(() => {
    if (steps.length > 0 && !selectedStep) {
      setSelectedStep(steps[0]);
    }
  }, [steps, selectedStep]);

  const icons = [
    "☀️", "🦷", "👕", "🎒", "🎁", "🚂", "📚", "❤️", "🛏️", "⭐", "🎵", "🎨",
    "🍎", "🚿", "🧼", "👟", "📱", "🍽️", "🧸", "🎯", "🎪", "🌈", "🔍", "💡"
  ];

  const addStep = async () => {
    if (newStepName.trim() === "") return;
    
    if (!userData) {
      Alert.alert("Error", "You must be logged in to add steps.");
      return;
    }
    
    const newStep = {
      id: Date.now(), // Use timestamp for unique ID
      name: newStepName,
      icon: "⭐",
      duration: `${newStepDuration.padStart(2, '0')}:00`,
      stepNumber: steps.length + 1,
      notes: newStepNotes
    };
    
    const updatedSteps = [...steps, newStep];
    setSteps(updatedSteps);
    setSelectedStep(newStep); // Select the newly created step
    setNewStepName("");
    setNewStepDuration("2");
    setNewStepNotes("");
    setShowAddStepForm(false);

    // Auto-save to Firebase
    setIsAutoSaving(true);
    try {
      if (scheduleId || existingScheduleId) {
        // Update existing schedule
        console.log("Updating existing schedule:", scheduleId || existingScheduleId);
        await updateSchedule(scheduleId || existingScheduleId, {
          name: scheduleName,
          steps: updatedSteps,
          isPublished: false, // Keep as draft when adding steps
          routineType: routine?.title || "Custom"
        });
        console.log("Schedule updated successfully");
      } else {
        // Create new schedule if none exists
        console.log("Creating new schedule with steps:", updatedSteps.length);
        const newSchedule = await createSchedule({
          name: scheduleName,
          steps: updatedSteps,
          isPublished: false, // Keep as draft when adding steps
          routineType: routine?.title || "Custom"
        });
        console.log("New schedule created:", newSchedule.id);
        setScheduleId(newSchedule.id);
      }
    } catch (error) {
      console.error("Error auto-saving step:", error);
      Alert.alert("Error", `Failed to save step: ${error.message}`);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const cancelAddStep = () => {
    setNewStepName("");
    setNewStepDuration("2");
    setNewStepNotes("");
    setShowAddStepForm(false);
  };

  const publishSchedule = async () => {
    if (!userData) {
      Alert.alert("Error", "You must be logged in to publish a schedule.");
      return;
    }

    if (scheduleName.trim() === "") {
      Alert.alert("Error", "Please enter a schedule name.");
      return;
    }

    if (steps.length === 0) {
      Alert.alert("Error", "Please add at least one step to the schedule.");
      return;
    }

    setIsPublishing(true);

    try {
      const scheduleData = {
        name: scheduleName.trim(),
        steps: steps,
        isPublished: true,
        routineType: routine?.title || "Custom"
      };

      if (scheduleId || existingScheduleId) {
        // Update existing schedule
        await updateSchedule(scheduleId || existingScheduleId, scheduleData);
        Alert.alert("Success", "Schedule updated successfully!");
      } else {
        // Create new schedule
        const newSchedule = await createSchedule(scheduleData);
        setScheduleId(newSchedule.id);
        Alert.alert("Success", "Schedule published successfully!");
      }
    } catch (error) {
      console.error("Error publishing schedule:", error);
      Alert.alert("Error", "Failed to publish schedule. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const saveDraft = async () => {
    if (!userData) {
      Alert.alert("Error", "You must be logged in to save a draft.");
      return;
    }

    if (scheduleName.trim() === "") {
      Alert.alert("Error", "Please enter a schedule name.");
      return;
    }

    try {
      const scheduleData = {
        name: scheduleName.trim(),
        steps: steps,
        isPublished: false,
        routineType: routine?.title || "Custom"
      };

      if (scheduleId || existingScheduleId) {
        // Update existing draft
        await updateSchedule(scheduleId || existingScheduleId, scheduleData);
        Alert.alert("Success", "Draft saved successfully!");
      } else {
        // Create new draft
        const newSchedule = await createSchedule(scheduleData);
        setScheduleId(newSchedule.id);
        Alert.alert("Success", "Draft saved successfully!");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      Alert.alert("Error", "Failed to save draft. Please try again.");
    }
  };

  const deleteStep = async (stepId) => {
    const updatedSteps = steps.filter(step => step.id !== stepId);
    const renumberedSteps = updatedSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));
    setSteps(renumberedSteps);
    if (selectedStep.id === stepId && renumberedSteps.length > 0) {
      setSelectedStep(renumberedSteps[0]);
    }

    // Auto-save to Firebase
    try {
      if (scheduleId || existingScheduleId) {
        // Update existing schedule
        await updateSchedule(scheduleId || existingScheduleId, {
          name: scheduleName,
          steps: renumberedSteps,
          isPublished: false, // Keep as draft when deleting steps
          routineType: routine?.title || "Custom"
        });
      } else if (renumberedSteps.length > 0) {
        // Create new schedule if none exists and there are still steps
        const newSchedule = await createSchedule({
          name: scheduleName,
          steps: renumberedSteps,
          isPublished: false, // Keep as draft when deleting steps
          routineType: routine?.title || "Custom"
        });
        setScheduleId(newSchedule.id);
      }
    } catch (error) {
      console.error("Error auto-saving step deletion:", error);
      Alert.alert("Warning", "Step deleted locally but failed to save to cloud. Please save manually.");
    }
  };

  const updateSelectedStep = async (field, value) => {
    const updatedStep = { ...selectedStep, [field]: value };
    setSelectedStep(updatedStep);
    const updatedSteps = steps.map(step => 
      step.id === selectedStep.id ? updatedStep : step
    );
    setSteps(updatedSteps);

    // Auto-save to Firebase
    try {
      if (scheduleId || existingScheduleId) {
        // Update existing schedule
        await updateSchedule(scheduleId || existingScheduleId, {
          name: scheduleName,
          steps: updatedSteps,
          isPublished: false, // Keep as draft when editing steps
          routineType: routine?.title || "Custom"
        });
      } else {
        // Create new schedule if none exists
        const newSchedule = await createSchedule({
          name: scheduleName,
          steps: updatedSteps,
          isPublished: false, // Keep as draft when editing steps
          routineType: routine?.title || "Custom"
        });
        setScheduleId(newSchedule.id);
      }
    } catch (error) {
      console.error("Error auto-saving step update:", error);
      // Don't show alert for every keystroke, just log the error
    }
  };

  if (userLoading) {
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>Visual Scheduler</Text>
          <Text style={styles.pageTitle}>
            {isEditing ? `Edit ${scheduleName}` : "Create Schedule"}
          </Text>
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

      <ScrollView style={styles.scrollView}>
        {/* Schedule Name and Actions */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleNameContainer}>
        <TextInput
              style={styles.scheduleNameInput}
              value={scheduleName}
              onChangeText={setScheduleName}
              placeholder="Schedule name (e.g., Morning)"
          placeholderTextColor="#999"
        />
            {isAutoSaving && (
              <View style={styles.autoSaveIndicator}>
                <ActivityIndicator size="small" color="#20B2AA" />
                <Text style={styles.autoSaveText}>Saving...</Text>
              </View>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={saveDraft}
            >
              <Text style={styles.actionButtonIcon}>📄</Text>
              <Text style={styles.actionButtonText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>👁️</Text>
              <Text style={styles.actionButtonText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.publishButton, isPublishing && styles.disabledButton]}
              onPress={publishSchedule}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonIcon}>▶️</Text>
              )}
              <Text style={[styles.actionButtonText, styles.publishButtonText]}>
                {isPublishing ? "Publishing..." : "Publish"}
              </Text>
            </TouchableOpacity>
            
            {/* Debug button - remove in production */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: "#ff6b6b" }]}
              onPress={async () => {
                try {
                  console.log("Testing schedule creation...");
                  const testSchedule = await createSchedule({
                    name: "Test Schedule",
                    steps: [{ id: 1, name: "Test Step", icon: "⭐", duration: "01:00", stepNumber: 1, notes: "" }],
                    isPublished: false,
                    routineType: "Custom"
                  });
                  console.log("Test schedule created:", testSchedule);
                  Alert.alert("Success", `Test schedule created with ID: ${testSchedule.id}`);
                } catch (error) {
                  console.error("Test schedule creation failed:", error);
                  Alert.alert("Error", `Test failed: ${error.message}`);
                }
              }}
            >
              <Text style={styles.actionButtonIcon}>🧪</Text>
              <Text style={styles.actionButtonText}>Test</Text>
            </TouchableOpacity>
          </View>
      </View>

        <View style={styles.mainContent}>
          {/* Steps Panel */}
          <View style={styles.stepsPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Steps ({steps.length})</Text>
            </View>
            
            <ScrollView style={styles.stepsList}>
              {steps.map((step) => (
                <TouchableOpacity
                  key={step.id}
                  style={[
                    styles.stepItem,
                    selectedStep.id === step.id && styles.selectedStepItem
                  ]}
                  onPress={() => setSelectedStep(step)}
                >
                  <Text style={styles.dragHandle}>⋮⋮</Text>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                  <View style={styles.stepInfo}>
                    <Text style={styles.stepName}>{step.name}</Text>
                    <Text style={styles.stepDuration}>{step.duration}</Text>
                    <Text style={styles.stepNumber}>Step {step.stepNumber}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteStepBtn}
                    onPress={() => deleteStep(step.id)}
                  >
                    <Text style={styles.deleteStepIcon}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.addStepButton} 
              onPress={() => setShowAddStepForm(true)}
            >
              <Text style={styles.addStepButtonText}>+ Add Step</Text>
            </TouchableOpacity>

            {/* Add Step Form */}
            {showAddStepForm && (
              <View style={styles.addStepForm}>
                <Text style={styles.addStepFormTitle}>Add New Step</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Step Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newStepName}
                    onChangeText={setNewStepName}
                    placeholder="Enter step name"
                    autoFocus
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Duration (minutes)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newStepDuration}
                    onChangeText={setNewStepDuration}
                    placeholder="2"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes (optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={newStepNotes}
                    onChangeText={setNewStepNotes}
                    placeholder="Additional instructions or notes..."
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.addStepFormButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]} 
                    onPress={cancelAddStep}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.saveButton]} 
                    onPress={addStep}
                  >
                    <Text style={styles.saveButtonText}>Add Step</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Edit Step Panel */}
          <View style={styles.editPanel}>
            <Text style={styles.panelTitle}>Edit Step</Text>
            
            {selectedStep ? (
              <>
                {/* Step Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Step Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={selectedStep.name}
                    onChangeText={(value) => updateSelectedStep('name', value)}
                    placeholder="Enter step name"
                  />
                </View>

            {/* Icon Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Icon</Text>
              <TextInput
                style={styles.iconSearchInput}
                placeholder="🔍 Search Icons"
                placeholderTextColor="#999"
              />
              <View style={styles.iconGrid}>
                {icons.map((icon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.iconButton,
                      selectedStep.icon === icon && styles.selectedIconButton
                    ]}
                    onPress={() => updateSelectedStep('icon', icon)}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timer Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Timer Duration</Text>
              <View style={styles.durationInput}>
                <TextInput
                  style={styles.durationTextInput}
                  value={selectedStep.duration.split(':')[0]}
                  onChangeText={(value) => updateSelectedStep('duration', `${value.padStart(2, '0')}:00`)}
                  keyboardType="numeric"
                />
                <Text style={styles.durationLabel}>minutes</Text>
              </View>
            </View>

            {/* Audio Prompt */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Audio Prompt</Text>
              <View style={styles.audioButtons}>
                <TouchableOpacity style={styles.audioButton}>
                  <Text style={styles.audioButtonIcon}>📤</Text>
                  <Text style={styles.audioButtonText}>Upload Audio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.audioButton}>
                  <Text style={styles.audioButtonIcon}>🎤</Text>
                  <Text style={styles.audioButtonText}>Record</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={selectedStep.notes}
                onChangeText={(value) => updateSelectedStep('notes', value)}
                placeholder="Additional instructions or notes..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
      />
    </View>

                {/* Test Step Button */}
                <TouchableOpacity style={styles.testStepButton}>
                  <Text style={styles.testStepButtonText}>▷ Test This Step</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noStepSelected}>
                <Text style={styles.noStepSelectedText}>
                  Select a step to edit or add a new step
                </Text>
              </View>
            )}
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
  pageTitle: {
    fontSize: 16,
    color: "#6c757d",
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
  scheduleSection: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  scheduleNameContainer: {
    position: "relative",
  },
  scheduleNameInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  autoSaveIndicator: {
    position: "absolute",
    right: 15,
    top: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(32, 178, 170, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  autoSaveText: {
    fontSize: 12,
    color: "#20B2AA",
    marginLeft: 4,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  publishButton: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  publishButtonText: {
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.6,
  },
  mainContent: {
    flexDirection: "row",
    paddingHorizontal: 20,
    flex: 1,
  },
  stepsPanel: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editPanel: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  panelHeader: {
    marginBottom: 15,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  stepsList: {
    maxHeight: 300,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  selectedStepItem: {
    backgroundColor: "#e3f2fd",
  },
  dragHandle: {
    fontSize: 16,
    color: "#6c757d",
    marginRight: 10,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 2,
  },
  stepDuration: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 2,
  },
  stepNumber: {
    fontSize: 12,
    color: "#6c757d",
  },
  deleteStepBtn: {
    padding: 5,
  },
  deleteStepIcon: {
    fontSize: 16,
    color: "#dc3545",
  },
  addStepButton: {
    backgroundColor: "#20B2AA",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addStepButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  iconSearchInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  selectedIconButton: {
    backgroundColor: "#20B2AA",
    borderColor: "#20B2AA",
  },
  durationInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationTextInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    width: 80,
    marginRight: 10,
    textAlign: "center",
  },
  durationLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  audioButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  audioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  audioButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  audioButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  notesInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 80,
  },
  testStepButton: {
    backgroundColor: "#20B2AA",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  testStepButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  addStepForm: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  addStepFormTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
    textAlign: "center",
  },
  addStepFormButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  formButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    backgroundColor: "#20B2AA",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noStepSelected: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noStepSelectedText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
});
