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
  startTime?: string; // For time-based schedules (HH:MM)
  endTime?: string; // For time-based schedules (HH:MM)
  readyByTime?: string; // For charge/mileage schedules (HH:MM)
  desiredChargeLevel?: number; // For charge-based schedules (0-100)
  desiredMileage?: number; // For mileage-based schedules (0-250)
  isActive: boolean;
  createdAt: string;
}

class DatabaseService {
  private db: any = null;
  private dbName = 'andersenev.db';
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = SQLite.openDatabase(
        { name: this.dbName, location: 'default' },
        () => {
          console.log('Database opened successfully');
        },
        (error: any) => {
          console.error('Database error:', error);
        }
      );

      // Create tables
      await this.createTables();
      
      await this.insertDemoData();

      this.isInitialized = true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          createdAt TEXT NOT NULL
        )
      `;

      const createSchedulesTable = `
        CREATE TABLE IF NOT EXISTS schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('time', 'charge', 'mileage')),
          name TEXT NOT NULL,
          days TEXT NOT NULL,
          startTime TEXT,
          endTime TEXT,
          readyByTime TEXT,
          desiredChargeLevel INTEGER,
          desiredMileage INTEGER,
          isActive INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        )
      `;

      this.db.transaction((tx: any) => {
        tx.executeSql(createUsersTable, [], () => {
          console.log('Users table created');
        });
        
        tx.executeSql(createSchedulesTable, [], () => {
          console.log('Schedules table created');
          resolve();
        });
      }, (error: any) => {
        console.error('Error creating tables:', error);
        reject(error);
      });
    });
  }

  private insertDemoData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        // Check if demo user exists
        tx.executeSql(
          'SELECT id FROM users WHERE username = ?',
          ['demo'],
          (tx: any, results: any) => {
            if (results.rows.length === 0) {
              // Insert demo user
              tx.executeSql(
                'INSERT INTO users (username, email, password, createdAt) VALUES (?, ?, ?, ?)',
                ['demo', 'demo@andersenev.com', 'demo123', new Date().toISOString()],
                (tx: any, results: any) => {
                  const userId = results.insertId;
                  
                  // Insert sample schedules
                  tx.executeSql(
                    `INSERT INTO schedules (userId, type, name, days, startTime, endTime, isActive, createdAt) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      userId,
                      'time',
                      'Morning Charge',
                      JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
                      '06:00',
                      '08:00',
                      1,
                      new Date().toISOString()
                    ]
                  );

                  tx.executeSql(
                    `INSERT INTO schedules (userId, type, name, days, readyByTime, desiredChargeLevel, isActive, createdAt) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      userId,
                      'charge',
                      'Weekend Full Charge',
                      JSON.stringify(['Sat', 'Sun']),
                      '09:00',
                      100,
                      1,
                      new Date().toISOString()
                    ]
                  );
                }
              );
            }
            resolve();
          }
        );
      }, (error: any) => {
        console.error('Error inserting demo data:', error);
        reject(error);
      });
    });
  }

  // User operations
  async createUser(username: string, email: string, password: string): Promise<User> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'INSERT INTO users (username, email, password, createdAt) VALUES (?, ?, ?, ?)',
          [username, email, password, new Date().toISOString()],
          (tx: any, results: any) => {
            const userId = results.insertId;
            tx.executeSql(
              'SELECT * FROM users WHERE id = ?',
              [userId],
              (tx: any, results: any) => {
                resolve(results.rows.item(0) as User);
              }
            );
          }
        );
      }, (error: any) => {
        console.error('Error creating user:', error);
        reject(error);
      });
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM users WHERE username = ?',
          [username],
          (tx: any, results: any) => {
            if (results.rows.length > 0) {
              resolve(results.rows.item(0) as User);
            } else {
              resolve(null);
            }
          }
        );
      }, (error: any) => {
        console.error('Error getting user:', error);
        reject(error);
      });
    });
  }

  async getUserById(id: number): Promise<User | null> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM users WHERE id = ?',
          [id],
          (tx: any, results: any) => {
            if (results.rows.length > 0) {
              resolve(results.rows.item(0) as User);
            } else {
              resolve(null);
            }
          }
        );
      }, (error: any) => {
        console.error('Error getting user by ID:', error);
        reject(error);
      });
    });
  }

  // Schedule operations
  async createSchedule(scheduleData: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        // Check if user has reached the 10 schedule limit
        tx.executeSql(
          'SELECT COUNT(*) as count FROM schedules WHERE userId = ?',
          [scheduleData.userId],
          (tx: any, results: any) => {
            const count = results.rows.item(0).count;
            if (count >= 10) {
              reject(new Error('You can only have up to 10 schedules.'));
              return;
            }

            tx.executeSql(
              `INSERT INTO schedules (userId, type, name, days, startTime, endTime, readyByTime, desiredChargeLevel, desiredMileage, isActive, createdAt) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                scheduleData.userId,
                scheduleData.type,
                scheduleData.name,
                scheduleData.days,
                scheduleData.startTime || null,
                scheduleData.endTime || null,
                scheduleData.readyByTime || null,
                scheduleData.desiredChargeLevel || null,
                scheduleData.desiredMileage || null,
                scheduleData.isActive ? 1 : 0,
                new Date().toISOString()
              ],
              (tx: any, results: any) => {
                const scheduleId = results.insertId;
                tx.executeSql(
                  'SELECT * FROM schedules WHERE id = ?',
                  [scheduleId],
                  (tx: any, results: any) => {
                    resolve(results.rows.item(0) as Schedule);
                  }
                );
              }
            );
          }
        );
      }, (error: any) => {
        console.error('Error creating schedule:', error);
        reject(error);
      });
    });
  }

  async getSchedulesByUserId(userId: number): Promise<Schedule[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM schedules WHERE userId = ? ORDER BY createdAt DESC',
          [userId],
          (tx: any, results: any) => {
            const schedules: Schedule[] = [];
            for (let i = 0; i < results.rows.length; i++) {
              schedules.push(results.rows.item(i) as Schedule);
            }
            resolve(schedules);
          }
        );
      }, (error: any) => {
        console.error('Error getting schedules:', error);
        reject(error);
      });
    });
  }

  async updateSchedule(id: number, updatedFields: Partial<Schedule>): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      Object.entries(updatedFields).forEach(([key, value]) => {
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
          () => {
            resolve();
          }
        );
      }, (error: any) => {
        console.error('Error updating schedule:', error);
        reject(error);
      });
    });
  }

  async deleteSchedule(id: number): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'DELETE FROM schedules WHERE id = ?',
          [id],
          () => {
            resolve();
          }
        );
      }, (error: any) => {
        console.error('Error deleting schedule:', error);
        reject(error);
      });
    });
  }

  async close(): Promise<void> {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

export default new DatabaseService();