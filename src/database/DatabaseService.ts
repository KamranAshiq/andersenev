import SQLite from 'react-native-sqlite-2';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Schedule {
  id: number;
  userId: number;
  type: 'time' | 'charge' | 'mileage';
  name: string;
  days: string; // JSON string of days array
  startTime?: string; // For time-based schedules
  endTime?: string; // For time-based schedules
  readyByTime?: string; // For charge/mileage schedules
  desiredChargeLevel?: number; // For charge-based schedules (0-100)
  desiredMileage?: number; // For mileage-based schedules (0-250)
  isActive: boolean;
  createdAt: string;
}

class DatabaseService {
  private db: any = null;

  async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.db = SQLite.openDatabase('AndersenEV.db', '1.0', 'Andersen EV Database', 200000);
        this.createTables().then(resolve).catch(reject);
      } catch (error) {
        console.error('Database initialization failed:', error);
        reject(error);
      }
    });
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Create users table
      this.db.transaction((tx: any) => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }, (error: any) => {
        if (error) {
          console.error('Error creating users table:', error);
          reject(error);
        } else {
          // Create schedules table
          this.db.transaction((tx: any) => {
            tx.executeSql(`
              CREATE TABLE IF NOT EXISTS schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('time', 'charge', 'mileage')),
                name TEXT NOT NULL,
                days TEXT NOT NULL,
                startTime TEXT,
                endTime TEXT,
                readyByTime TEXT,
                desiredChargeLevel INTEGER CHECK (desiredChargeLevel >= 0 AND desiredChargeLevel <= 100),
                desiredMileage INTEGER CHECK (desiredMileage >= 0 AND desiredMileage <= 250),
                isActive BOOLEAN DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users (id)
              )
            `);
          }, (error: any) => {
            if (error) {
              console.error('Error creating schedules table:', error);
              reject(error);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  // User methods
  async createUser(username: string, email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction((tx: any) => {
        tx.executeSql(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          [username, email, password],
          (tx: any, results: any) => {
            const userId = results.insertId;
            tx.executeSql(
              'SELECT * FROM users WHERE id = ?',
              [userId],
              (tx: any, userResults: any) => {
                resolve(userResults.rows.item(0));
              },
              (tx: any, error: any) => {
                reject(error);
              }
            );
          },
          (tx: any, error: any) => {
            reject(error);
          }
        );
      });
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM users WHERE username = ?',
          [username],
          (tx: any, results: any) => {
            if (results.rows.length > 0) {
              resolve(results.rows.item(0));
            } else {
              resolve(null);
            }
          },
          (tx: any, error: any) => {
            reject(error);
          }
        );
      });
    });
  }

  async getUserById(id: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM users WHERE id = ?',
          [id],
          (tx: any, results: any) => {
            if (results.rows.length > 0) {
              resolve(results.rows.item(0));
            } else {
              resolve(null);
            }
          },
          (tx: any, error: any) => {
            reject(error);
          }
        );
      });
    });
  }

  // Schedule methods
  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction((tx: any) => {
        tx.executeSql(
          `INSERT INTO schedules (userId, type, name, days, startTime, endTime, readyByTime, desiredChargeLevel, desiredMileage, isActive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            schedule.userId,
            schedule.type,
            schedule.name,
            schedule.days,
            schedule.startTime || null,
            schedule.endTime || null,
            schedule.readyByTime || null,
            schedule.desiredChargeLevel || null,
            schedule.desiredMileage || null,
            schedule.isActive ? 1 : 0,
          ],
          (tx: any, results: any) => {
            const scheduleId = results.insertId;
            tx.executeSql(
              'SELECT * FROM schedules WHERE id = ?',
              [scheduleId],
              (tx: any, scheduleResults: any) => {
                resolve(scheduleResults.rows.item(0));
              },
              (tx: any, error: any) => {
                reject(error);
              }
            );
          },
          (tx: any, error: any) => {
            reject(error);
          }
        );
      });
    });
  }

  async getSchedulesByUserId(userId: number): Promise<Schedule[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM schedules WHERE userId = ? ORDER BY createdAt DESC',
          [userId],
          (tx: any, results: any) => {
            const schedules: Schedule[] = [];
            for (let i = 0; i < results.rows.length; i++) {
              schedules.push(results.rows.item(i));
            }
            resolve(schedules);
          },
          (tx: any, error: any) => {
            reject(error);
          }
        );
      });
    });
  }

  async updateSchedule(id: number, schedule: Partial<Schedule>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(schedule).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (fields.length === 0) {
        resolve();
        return;
      }

      values.push(id);

      this.db.transaction((tx: any) => {
        tx.executeSql(
          `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`,
          values,
          () => resolve(),
          (tx: any, error: any) => reject(error)
        );
      });
    });
  }

  async deleteSchedule(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction((tx: any) => {
        tx.executeSql(
          'DELETE FROM schedules WHERE id = ?',
          [id],
          () => resolve(),
          (tx: any, error: any) => reject(error)
        );
      });
    });
  }

  async getScheduleCount(userId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM schedules WHERE userId = ?',
          [userId],
          (tx: any, results: any) => {
            resolve(results.rows.item(0).count);
          },
          (tx: any, error: any) => {
            reject(error);
          }
        );
      });
    });
  }
}

export default new DatabaseService();