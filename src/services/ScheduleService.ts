import DatabaseService, { Schedule } from './DatabaseService';

export { Schedule };

class ScheduleService {
  async createSchedule(scheduleData: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    return await DatabaseService.createSchedule(scheduleData);
  }

  async getSchedulesByUserId(userId: number): Promise<Schedule[]> {
    return await DatabaseService.getSchedulesByUserId(userId);
  }

  async updateSchedule(id: number, updatedFields: Partial<Schedule>): Promise<void> {
    return await DatabaseService.updateSchedule(id, updatedFields);
  }

  async deleteSchedule(id: number): Promise<void> {
    return await DatabaseService.deleteSchedule(id);
  }

  async getScheduleCount(userId: number): Promise<number> {
    const schedules = await DatabaseService.getSchedulesByUserId(userId);
    return schedules.length;
  }
}

export default new ScheduleService();