import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Schedule } from '../services/ScheduleService';

interface ScheduleFormProps {
  schedule?: Schedule | null;
  onSubmit: (scheduleData: Partial<Schedule>) => void;
  onCancel: () => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({
  schedule,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'time' as 'time' | 'charge' | 'mileage',
    days: [] as string[],
    startTime: '',
    endTime: '',
    readyByTime: '',
    desiredChargeLevel: '',
    desiredMileage: '',
  });

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name,
        type: schedule.type,
        days: JSON.parse(schedule.days),
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        readyByTime: schedule.readyByTime || '',
        desiredChargeLevel: schedule.desiredChargeLevel?.toString() || '',
        desiredMileage: schedule.desiredMileage?.toString() || '',
      });
    }
  }, [schedule]);

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a schedule name');
      return;
    }

    if (formData.days.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    if (formData.type === 'time') {
      if (!formData.startTime || !formData.endTime) {
        Alert.alert('Error', 'Please enter both start and end times');
        return;
      }
    } else {
      if (!formData.readyByTime) {
        Alert.alert('Error', 'Please enter a ready by time');
        return;
      }
    }

    if (formData.type === 'charge') {
      const chargeLevel = parseInt(formData.desiredChargeLevel);
      if (isNaN(chargeLevel) || chargeLevel < 0 || chargeLevel > 100) {
        Alert.alert('Error', 'Charge level must be between 0 and 100');
        return;
      }
    }

    if (formData.type === 'mileage') {
      const mileage = parseInt(formData.desiredMileage);
      if (isNaN(mileage) || mileage < 0 || mileage > 250) {
        Alert.alert('Error', 'Mileage must be between 0 and 250');
        return;
      }
    }

    const scheduleData: Partial<Schedule> = {
      name: formData.name.trim(),
      type: formData.type,
      days: JSON.stringify(formData.days),
      startTime: formData.type === 'time' ? formData.startTime : undefined,
      endTime: formData.type === 'time' ? formData.endTime : undefined,
      readyByTime: formData.type !== 'time' ? formData.readyByTime : undefined,
      desiredChargeLevel: formData.type === 'charge' ? parseInt(formData.desiredChargeLevel) : undefined,
      desiredMileage: formData.type === 'mileage' ? parseInt(formData.desiredMileage) : undefined,
      isActive: true,
    };

    onSubmit(scheduleData);
  };

  const renderTimeInputs = () => {
    if (formData.type !== 'time') return null;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.groupTitle}>Time Settings</Text>
        
        <View style={styles.timeInputContainer}>
          <View style={styles.timeInput}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              value={formData.startTime}
              onChangeText={(text) => setFormData(prev => ({ ...prev, startTime: text }))}
              placeholder="HH:MM"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.timeInput}>
            <Text style={styles.label}>End Time</Text>
            <TextInput
              style={styles.input}
              value={formData.endTime}
              onChangeText={(text) => setFormData(prev => ({ ...prev, endTime: text }))}
              placeholder="HH:MM"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderChargeInputs = () => {
    if (formData.type !== 'charge') return null;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.groupTitle}>Charge Settings</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ready By Time</Text>
          <TextInput
            style={styles.input}
            value={formData.readyByTime}
            onChangeText={(text) => setFormData(prev => ({ ...prev, readyByTime: text }))}
            placeholder="HH:MM"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Desired Charge Level (%)</Text>
          <TextInput
            style={styles.input}
            value={formData.desiredChargeLevel}
            onChangeText={(text) => setFormData(prev => ({ ...prev, desiredChargeLevel: text }))}
            placeholder="0-100"
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  };

  const renderMileageInputs = () => {
    if (formData.type !== 'mileage') return null;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.groupTitle}>Mileage Settings</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ready By Time</Text>
          <TextInput
            style={styles.input}
            value={formData.readyByTime}
            onChangeText={(text) => setFormData(prev => ({ ...prev, readyByTime: text }))}
            placeholder="HH:MM"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Desired Mileage (mi)</Text>
          <TextInput
            style={styles.input}
            value={formData.desiredMileage}
            onChangeText={(text) => setFormData(prev => ({ ...prev, desiredMileage: text }))}
            placeholder="0-250"
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {schedule ? 'Edit Schedule' : 'New Schedule'}
        </Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.groupTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Schedule Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter schedule name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Schedule Type</Text>
            <View style={styles.typeSelector}>
              {[
                { key: 'time', label: 'Time Based' },
                { key: 'charge', label: 'Charge Level Based' },
                { key: 'mileage', label: 'Mileage Based' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    formData.type === type.key && styles.typeOptionSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: type.key as any }))}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      formData.type === type.key && styles.typeOptionTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.groupTitle}>Days of Week</Text>
          <View style={styles.daysContainer}>
            {daysOfWeek.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  formData.days.includes(day) && styles.dayButtonSelected,
                ]}
                onPress={() => handleDayToggle(day)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    formData.days.includes(day) && styles.dayButtonTextSelected,
                  ]}
                >
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderTimeInputs()}
        {renderChargeInputs()}
        {renderMileageInputs()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    color: '#6B7280',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    color: '#1E3A8A',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 32,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  dayButtonSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  timeInputContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInput: {
    flex: 1,
  },
});

export default ScheduleForm;
