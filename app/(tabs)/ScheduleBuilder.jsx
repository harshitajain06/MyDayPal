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
import { useNavigationData } from "../../contexts/NavigationContext";
import useSchedules from "../../hooks/useSchedules";
import useUser from "../../hooks/useUser";

export default function ScheduleBuilder() {
  const { userData, loading: userLoading } = useUser();
  const { createSchedule, updateSchedule, deleteSchedule, getScheduleById } = useSchedules();
  const { navigationData, setRoutineData, clearNavigationData } = useNavigationData();
  const route = useRoute();
  const { routine, isEditing, scheduleId: existingScheduleId, existingSchedule, routineName } = route.params || {};
  
  // Use context data if available, otherwise fall back to route params
  const currentRoutine = navigationData?.routine || routine;
  const currentIsEditing = navigationData?.isEditing || isEditing;
  const currentRoutineName = navigationData?.routineName || routineName;
  const currentExistingSchedule = navigationData?.routine || existingSchedule;
  
  // Debug: Log the received parameters
  console.log("ScheduleBuilder received params:", { 
    routeParams: { routine, isEditing, existingScheduleId, existingSchedule, routineName },
    contextData: navigationData,
    current: { currentRoutine, currentIsEditing, currentRoutineName, currentExistingSchedule }
  });
  
  const [scheduleName, setScheduleName] = useState(
    currentRoutineName || currentExistingSchedule?.name || currentRoutine?.scheduleName || "Morning"
  );
  const [steps, setSteps] = useState([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [newStepName, setNewStepName] = useState("");
  const [newStepDuration, setNewStepDuration] = useState("2");
  const [newStepNotes, setNewStepNotes] = useState("");
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scheduleId, setScheduleId] = useState(existingScheduleId || null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load schedule data from Firebase when editing existing schedule
  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization
    
    const loadScheduleData = async () => {
      // If we have an existing schedule ID, load it from Firebase
      if (existingScheduleId && !currentExistingSchedule) {
        setIsLoadingSchedule(true);
        try {
          console.log("Loading schedule from Firebase:", existingScheduleId);
          const scheduleData = await getScheduleById(existingScheduleId);
          if (scheduleData) {
            console.log("Loaded schedule data:", scheduleData);
            setScheduleName(scheduleData.name || "Morning");
            setSteps(Array.isArray(scheduleData.steps) ? scheduleData.steps : []);
            setScheduleId(existingScheduleId);
          } else {
            console.log("No schedule found, using defaults");
            setSteps([
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
            ]);
          }
        } catch (error) {
          console.error("Error loading schedule:", error);
          // Fall back to default steps
          setSteps([
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
          ]);
        } finally {
          setIsLoadingSchedule(false);
        }
      } else if (currentExistingSchedule?.steps) {
        // Use data from navigation context
        console.log("Using schedule data from navigation context:", currentExistingSchedule);
        setScheduleName(currentExistingSchedule.name || "Morning");
        setSteps(Array.isArray(currentExistingSchedule.steps) ? currentExistingSchedule.steps : []);
        if (currentExistingSchedule.id) {
          setScheduleId(currentExistingSchedule.id);
        }
      } else if (currentRoutine?.predefinedSteps) {
        // Use predefined steps from routine
        console.log("Using predefined steps from routine:", currentRoutine);
        setScheduleName(currentRoutine.scheduleName || "Morning");
        setSteps(Array.isArray(currentRoutine.predefinedSteps) ? currentRoutine.predefinedSteps : []);
      } else {
        // Default steps for new schedule
        console.log("Using default steps for new schedule");
        setSteps([
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
        ]);
      }
      
      setIsInitialized(true);
    };

    loadScheduleData();
  }, [existingScheduleId, currentExistingSchedule, currentRoutine, isInitialized]);

  // Set initial selected step when steps are loaded
  useEffect(() => {
    if ((steps || []).length > 0 && !selectedStep) {
      setSelectedStep(steps[0]);
    }
  }, [steps, selectedStep]);

  // Update state when navigation data changes
  useEffect(() => {
    if (navigationData) {
      console.log("Navigation data changed, updating state:", navigationData);
      
      // Reset initialization to allow re-processing
      setIsInitialized(false);
      
      // Only update steps if we don't already have a scheduleId (to avoid overriding saved data)
      if (!scheduleId) {
        const newSteps = navigationData.routine?.predefinedSteps || navigationData.routine?.steps || [];
        setScheduleName(navigationData.routineName || navigationData.routine?.scheduleName || "Morning");
        setSteps(Array.isArray(newSteps) ? newSteps : []);
        
        // Set the first step as selected if there are steps and no current selection
        if (newSteps.length > 0 && !selectedStep) {
          setSelectedStep(newSteps[0]);
        }
      }
      
      // If this is an existing schedule with an ID, set it
      if (navigationData.routine?.id) {
        setScheduleId(navigationData.routine.id);
      } else {
        // Reset schedule ID for new routines
        setScheduleId(null);
      }
      
      setIsInitialized(true);
    }
  }, [navigationData, selectedStep, scheduleId]);

  // Reload schedule data when scheduleId changes (after adding steps)
  useEffect(() => {
    const reloadScheduleData = async () => {
      if (scheduleId && typeof scheduleId === 'string') {
        console.log("Reloading schedule data for ID:", scheduleId);
        try {
          const scheduleData = await getScheduleById(scheduleId);
          if (scheduleData) {
            console.log("Reloaded schedule data:", scheduleData);
            setSteps(Array.isArray(scheduleData.steps) ? scheduleData.steps : []);
            setScheduleName(scheduleData.name || "Morning");
          }
        } catch (error) {
          console.error("Error reloading schedule data:", error);
        }
      }
    };

    reloadScheduleData();
  }, [scheduleId, getScheduleById]);

  // Cleanup navigation data when component unmounts
  useEffect(() => {
    return () => {
      clearNavigationData();
    };
  }, [clearNavigationData]);

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
      stepNumber: (steps || []).length + 1,
      notes: newStepNotes
    };
    
    const updatedSteps = [...(steps || []), newStep];
    setSteps(updatedSteps);
    setSelectedStep(newStep); // Select the newly created step
    
    console.log("Added new step:", newStep);
    console.log("Updated steps array after adding:", updatedSteps);
    setNewStepName("");
    setNewStepDuration("2");
    setNewStepNotes("");
    setShowAddStepForm(false);

    // Auto-save to Firebase
    setIsAutoSaving(true);
    try {
      const currentScheduleId = scheduleId || existingScheduleId;
      if (currentScheduleId && typeof currentScheduleId === 'string') {
        // Update existing schedule
        console.log("Updating existing schedule:", currentScheduleId);
        await updateSchedule(currentScheduleId, {
          name: scheduleName,
          steps: updatedSteps,
          isPublished: false, // Keep as draft when adding steps
          routineType: currentRoutine?.title || currentRoutine?.scheduleName || "Custom"
        });
        console.log("Schedule updated successfully");
      } else {
        // Create new schedule if none exists
        const routineType = currentRoutine?.title || currentRoutine?.scheduleName || "Custom";
        console.log("Creating new schedule with steps:", updatedSteps.length, "routineType:", routineType);
        const newSchedule = await createSchedule({
          name: scheduleName,
          steps: updatedSteps,
          isPublished: false, // Keep as draft when adding steps
          routineType: routineType
        });
        console.log("New schedule created:", newSchedule.id);
        setScheduleId(newSchedule.id);
        
        // Also update the navigation data with the new schedule ID
        if (navigationData) {
          setRoutineData({
            ...navigationData.routine,
            id: newSchedule.id
          }, navigationData.isEditing, navigationData.routineName);
        }
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

    if ((steps || []).length === 0) {
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

  const handleUpdateSchedule = async () => {
    if (!userData) {
      Alert.alert("Error", "You must be logged in to update a schedule.");
      return;
    }

    if (scheduleName.trim() === "") {
      Alert.alert("Error", "Please enter a schedule name.");
      return;
    }

    if ((steps || []).length === 0) {
      Alert.alert("Error", "Please add at least one step to the schedule.");
      return;
    }

    const currentScheduleId = scheduleId || existingScheduleId;
    if (!currentScheduleId || typeof currentScheduleId !== 'string') {
      Alert.alert("Error", "No schedule ID found. Please create a new schedule first.");
      return;
    }

    try {
      const scheduleData = {
        name: scheduleName.trim(),
        steps: steps,
        isPublished: false, // Keep as draft when updating
        routineType: routine?.title || "Custom"
      };

      await updateSchedule(currentScheduleId, scheduleData);
      Alert.alert("Success", "Schedule updated successfully!");
    } catch (error) {
      console.error("Error updating schedule:", error);
      Alert.alert("Error", "Failed to update schedule. Please try again.");
    }
  };

  const handleDeleteSchedule = async () => {
    if (!userData) {
      Alert.alert("Error", "You must be logged in to delete a schedule.");
      return;
    }

    const currentScheduleId = scheduleId || existingScheduleId;
    if (!currentScheduleId || typeof currentScheduleId !== 'string') {
      Alert.alert("Error", "No schedule ID found. Cannot delete schedule.");
      return;
    }

    try {
      await deleteSchedule(currentScheduleId);
      Alert.alert("Success", "Schedule deleted successfully!");
      // Navigate back or reset the form
      setSteps([]);
      setScheduleName("Morning");
      setScheduleId(null);
      setSelectedStep(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      Alert.alert("Error", "Failed to delete schedule. Please try again.");
    }
  };

  const deleteStep = async (stepId) => {
    const updatedSteps = (steps || []).filter(step => step.id !== stepId);
    const renumberedSteps = updatedSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));
    setSteps(renumberedSteps);
    if (selectedStep?.id === stepId && renumberedSteps.length > 0) {
      setSelectedStep(renumberedSteps[0]);
    }

    // Auto-save to Firebase
    try {
      const currentScheduleId = scheduleId || existingScheduleId;
      if (currentScheduleId && typeof currentScheduleId === 'string') {
        // Update existing schedule
        await updateSchedule(currentScheduleId, {
          name: scheduleName,
          steps: renumberedSteps,
          isPublished: false, // Keep as draft when deleting steps
          routineType: currentRoutine?.title || currentRoutine?.scheduleName || "Custom"
        });
      } else if (renumberedSteps.length > 0) {
        // Create new schedule if none exists and there are still steps
        const newSchedule = await createSchedule({
          name: scheduleName,
          steps: renumberedSteps,
          isPublished: false, // Keep as draft when deleting steps
          routineType: currentRoutine?.title || currentRoutine?.scheduleName || "Custom"
        });
        setScheduleId(newSchedule.id);
        
        // Also update the navigation data with the new schedule ID
        if (navigationData) {
          setRoutineData({
            ...navigationData.routine,
            id: newSchedule.id
          }, navigationData.isEditing, navigationData.routineName);
        }
      }
    } catch (error) {
      console.error("Error auto-saving step deletion:", error);
      Alert.alert("Warning", "Step deleted locally but failed to save to cloud. Please save manually.");
    }
  };

  const updateSelectedStep = async (field, value) => {
    if (!selectedStep) return; // Safety check
    
    const updatedStep = { ...selectedStep, [field]: value };
    setSelectedStep(updatedStep);
    const updatedSteps = (steps || []).map(step => 
      step.id === selectedStep?.id ? updatedStep : step
    );
    setSteps(updatedSteps);
    
    console.log("Updated step:", updatedStep);
    console.log("Updated steps array:", updatedSteps);

    // Auto-save to Firebase
    try {
      const currentScheduleId = scheduleId || existingScheduleId;
      if (currentScheduleId && typeof currentScheduleId === 'string') {
        // Update existing schedule
        await updateSchedule(currentScheduleId, {
          name: scheduleName,
          steps: updatedSteps,
          isPublished: false, // Keep as draft when editing steps
          routineType: currentRoutine?.title || currentRoutine?.scheduleName || "Custom"
        });
      } else {
        // Create new schedule if none exists
        const newSchedule = await createSchedule({
          name: scheduleName,
          steps: updatedSteps,
          isPublished: false, // Keep as draft when editing steps
          routineType: currentRoutine?.title || currentRoutine?.scheduleName || "Custom"
        });
        setScheduleId(newSchedule.id);
        
        // Also update the navigation data with the new schedule ID
        if (navigationData) {
          setRoutineData({
            ...navigationData.routine,
            id: newSchedule.id
          }, navigationData.isEditing, navigationData.routineName);
        }
      }
    } catch (error) {
      console.error("Error auto-saving step update:", error);
      // Don't show alert for every keystroke, just log the error
    }
  };

  if (userLoading || isLoadingSchedule) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#20B2AA" />
          <Text style={styles.loadingText}>
            {isLoadingSchedule ? "Loading schedule..." : "Loading..."}
          </Text>
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
            {currentIsEditing ? `Edit ${currentRoutineName || scheduleName}` : "Create Schedule"}
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
            
            {(scheduleId || existingScheduleId) && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.updateButton]}
                onPress={() => setShowUpdateModal(true)}
              >
                <Text style={styles.actionButtonIcon}>✏️</Text>
                <Text style={[styles.actionButtonText, styles.updateButtonText]}>Update</Text>
              </TouchableOpacity>
            )}
            
            {(scheduleId || existingScheduleId) && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => setShowDeleteModal(true)}
              >
                <Text style={styles.actionButtonIcon}>🗑️</Text>
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
      </View>

        <View style={styles.mainContent}>
          {/* Steps Panel */}
          <View style={styles.stepsPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Steps ({(steps || []).length})</Text>
            </View>
            
            <ScrollView style={styles.stepsList}>
              {(steps || []).map((step) => (
                <TouchableOpacity
                  key={step.id}
                  style={[
                    styles.stepItem,
                    selectedStep?.id === step.id && styles.selectedStepItem
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
                    value={selectedStep.name || ''}
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
                  value={selectedStep.duration?.split(':')[0] || '2'}
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
                value={selectedStep.notes || ''}
                onChangeText={(value) => updateSelectedStep('notes', value)}
                placeholder="Additional instructions or notes..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
      />
    </View>

                {/* Submit Step Button */}
                <TouchableOpacity 
                  style={[styles.testStepButton, isAutoSaving && styles.disabledButton]}
                  onPress={async () => {
                    if (!selectedStep) return;
                    
                    try {
                      // Force save the current step changes
                      const updatedSteps = (steps || []).map(step => 
                        step.id === selectedStep?.id ? selectedStep : step
                      );
                      
                      const currentScheduleId = scheduleId || existingScheduleId;
                      if (currentScheduleId && typeof currentScheduleId === 'string') {
                        // Update existing schedule
                        await updateSchedule(currentScheduleId, {
                          name: scheduleName,
                          steps: updatedSteps,
                          isPublished: false,
                          routineType: currentRoutine?.title || currentRoutine?.scheduleName || "Custom"
                        });
                      } else {
                        // Create new schedule if none exists
                        const newSchedule = await createSchedule({
                          name: scheduleName,
                          steps: updatedSteps,
                          isPublished: false,
                          routineType: currentRoutine?.title || currentRoutine?.scheduleName || "Custom"
                        });
                        setScheduleId(newSchedule.id);
                      }
                      
                      Alert.alert("Success", "Step changes have been saved successfully!");
                    } catch (error) {
                      console.error("Error saving step:", error);
                      Alert.alert("Error", "Failed to save step changes. Please try again.");
                    }
                  }}
                  disabled={isAutoSaving}
                >
                  <Text style={styles.testStepButtonText}>
                    {isAutoSaving ? "Saving..." : "✓ Submit Step"}
                  </Text>
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

      {/* Update Confirmation Modal */}
      {showUpdateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Schedule</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>
                Are you sure you want to update this schedule? All changes will be saved.
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={async () => {
                  await handleUpdateSchedule();
                  setShowUpdateModal(false);
                }}
              >
                <Text style={styles.modalConfirmText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Schedule</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete this schedule? This action cannot be undone.
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleDeleteSchedule}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  updateButton: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
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
  updateButtonText: {
    color: "#fff",
  },
  deleteButtonText: {
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
  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 0,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 20,
    color: "#6c757d",
    fontWeight: "bold",
  },
  modalContent: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: "#6c757d",
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    gap: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  modalConfirmButton: {
    backgroundColor: "#28a745",
  },
  modalDeleteButton: {
    backgroundColor: "#dc3545",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c757d",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
