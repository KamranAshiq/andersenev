import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import ScheduleService, { Schedule } from '../services/ScheduleService';
import ScheduleForm from '../components/ScheduleForm';

const ScheduleScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user]);

  const loadSchedules = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userSchedules = await ScheduleService.getSchedulesByUserId(user.id);
      setSchedules(userSchedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchedule = () => {
    if (schedules.length >= 10) {
      Alert.alert('Limit Reached', 'You can only have up to 10 schedules');
      return;
    }
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    Alert.alert(
      'Delete Schedule',
      `Are you sure you want to delete "${schedule.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ScheduleService.deleteSchedule(schedule.id);
              loadSchedules();
            } catch (error) {
              console.error('Failed to delete schedule:', error);
              Alert.alert('Error', 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  const handleFormSubmit = async (scheduleData: Partial<Schedule>) => {
    if (!user) return;

    try {
      if (editingSchedule) {
        await ScheduleService.updateSchedule(editingSchedule.id, scheduleData);
      } else {
        await ScheduleService.createSchedule({
          ...scheduleData,
          userId: user.id,
        } as Omit<Schedule, 'id' | 'createdAt'>);
      }
      
      setShowForm(false);
      setEditingSchedule(null);
      loadSchedules();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      Alert.alert('Error', 'Failed to save schedule');
    }
  };

  const renderScheduleItem = ({ item }: { item: Schedule }) => {
    const days = JSON.parse(item.days);
    const daysText = days.join(', ');

    return (
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleName}>{item.name}</Text>
          <View style={styles.scheduleActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditSchedule(item)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteSchedule(item)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scheduleDetails}>
          <Text style={styles.scheduleType}>
            Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text style={styles.scheduleDays}>Days: {daysText}</Text>
          
          {item.type === 'time' && item.startTime && item.endTime && (
            <Text style={styles.scheduleTime}>
              Time: {item.startTime} - {item.endTime}
            </Text>
          )}
          
          {item.type === 'charge' && item.readyByTime && item.desiredChargeLevel !== undefined && (
            <>
              <Text style={styles.scheduleTime}>Ready by: {item.readyByTime}</Text>
              <Text style={styles.scheduleValue}>
                Charge Level: {item.desiredChargeLevel}%
              </Text>
            </>
          )}
          
          {item.type === 'mileage' && item.readyByTime && item.desiredMileage !== undefined && (
            <>
              <Text style={styles.scheduleTime}>Ready by: {item.readyByTime}</Text>
              <Text style={styles.scheduleValue}>
                Mileage: {item.desiredMileage} mi
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
        <Text style={styles.subtitleText}>Let's get you started.</Text>
        <Text style={styles.instructionText}>Please connect your charge point</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Charge Point Schedules</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSchedule}
            disabled={schedules.length >= 10}
          >
            <Text style={styles.addButtonText}>+ Add Schedule</Text>
          </TouchableOpacity>
        </View>

        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No schedules created yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Tap "Add Schedule" to create your first charging schedule
            </Text>
          </View>
        ) : (
          <FlatList
            data={schedules}
            renderItem={renderScheduleItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scheduleList}
          />
        )}
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScheduleForm
          schedule={editingSchedule}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSchedule(null);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleList: {
    paddingBottom: 24,
  },
  scheduleCard: {
    backgroundColor: '#2A2A2A', 
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#3A3A3A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
  scheduleDetails: {
    gap: 4,
  },
  scheduleType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#60A5FA',
  },
  scheduleDays: {
    fontSize: 14,
    color: '#A0A0A0', 
  },
  scheduleTime: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  scheduleValue: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  logoutButton: {
    backgroundColor: '#3A3A3A', // Light gray background like the image
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF', // White border
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ScheduleScreen;
