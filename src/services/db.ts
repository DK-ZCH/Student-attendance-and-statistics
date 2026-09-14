import {
  Student,
  AttendanceRecord,
  HomeworkRecord,
  AttendanceEvent,
  SubjectConfig,
  AppDatabaseBackup,
} from '../types';

const DB_NAME = 'StudentAttendanceStudyDB';
const DB_VERSION = 1;

export const DEFAULT_SUBJECTS: SubjectConfig[] = [
  { id: 'sub-1', name: '数学', color: '#2563eb', bgColor: '#eff6ff' },
  { id: 'sub-2', name: '英语', color: '#7c3aed', bgColor: '#f5f3ff' },
  { id: 'sub-3', name: '语文', color: '#dc2626', bgColor: '#fef2f2' },
  { id: 'sub-4', name: '物理', color: '#0891b2', bgColor: '#ecfeff' },
  { id: 'sub-5', name: '化学', color: '#059669', bgColor: '#ecfdf5' },
  { id: 'sub-6', name: '生物', color: '#65a30d', bgColor: '#f7fee7' },
  { id: 'sub-7', name: '历史', color: '#d97706', bgColor: '#fffbeb' },
  { id: 'sub-8', name: '地理', color: '#ea580c', bgColor: '#fff7ed' },
  { id: 'sub-9', name: '政治', color: '#db2777', bgColor: '#fdf2f8' },
  { id: 'sub-10', name: '其他', color: '#4b5563', bgColor: '#f3f4f6' },
];

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase | null>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported, fallback to memory/localStorage');
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('students')) {
            const studentStore = db.createObjectStore('students', { keyPath: 'id' });
            studentStore.createIndex('name', 'name', { unique: false });
            studentStore.createIndex('studentNo', 'studentNo', { unique: false });
          }
          if (!db.objectStoreNames.contains('attendance')) {
            const attStore = db.createObjectStore('attendance', { keyPath: 'id' });
            attStore.createIndex('studentId', 'studentId', { unique: false });
            attStore.createIndex('date', 'date', { unique: false });
            attStore.createIndex('student_date', ['studentId', 'date'], { unique: false });
          }
          if (!db.objectStoreNames.contains('homework')) {
            const hwStore = db.createObjectStore('homework', { keyPath: 'id' });
            hwStore.createIndex('studentId', 'studentId', { unique: false });
            hwStore.createIndex('subject', 'subject', { unique: false });
            hwStore.createIndex('date', 'date', { unique: false });
          }
          if (!db.objectStoreNames.contains('events')) {
            const evStore = db.createObjectStore('events', { keyPath: 'id' });
            evStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!db.objectStoreNames.contains('subjects')) {
            db.createObjectStore('subjects', { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('IndexedDB open error:', request.error);
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB init caught error:', err);
        resolve(null);
      }
    });
  }

  // Generic fallback using localStorage
  private getLocal<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`app_db_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`app_db_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  }

  // --- Students CRUD ---
  async getStudents(): Promise<Student[]> {
    const db = await this.dbPromise;
    if (!db) return this.getLocal<Student[]>('students', []);

    return new Promise((resolve) => {
      const tx = db.transaction('students', 'readonly');
      const store = tx.objectStore('students');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve(this.getLocal<Student[]>('students', []));
    });
  }

  async saveStudents(students: Student[]): Promise<void> {
    this.setLocal('students', students);
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('students', 'readwrite');
      const store = tx.objectStore('students');
      store.clear();
      students.forEach((s) => store.put(s));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async addStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
    const newStudent: Student = {
      ...student,
      id: 'stu-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
    };
    const students = await this.getStudents();
    students.unshift(newStudent);
    await this.saveStudents(students);
    return newStudent;
  }

  async updateStudent(student: Student): Promise<void> {
    const students = await this.getStudents();
    const index = students.findIndex((s) => s.id === student.id);
    if (index !== -1) {
      students[index] = student;
      await this.saveStudents(students);
    }
  }

  async deleteStudent(studentId: string, cascade: boolean = true): Promise<void> {
    const students = await this.getStudents();
    await this.saveStudents(students.filter((s) => s.id !== studentId));
    if (cascade) {
      const att = await this.getAttendanceRecords();
      await this.saveAttendanceRecords(att.filter((a) => a.studentId !== studentId));
      const hw = await this.getHomework();
      await this.saveHomework(hw.filter((h) => h.studentId !== studentId));
      const ev = await this.getEvents();
      await this.saveEvents(ev.filter((e) => e.studentId !== studentId));
    }
  }

  async deleteStudents(studentIds: string[], cascade: boolean = true): Promise<void> {
    const idSet = new Set(studentIds);
    const students = await this.getStudents();
    await this.saveStudents(students.filter((s) => !idSet.has(s.id)));
    if (cascade) {
      const att = await this.getAttendanceRecords();
      await this.saveAttendanceRecords(att.filter((a) => !idSet.has(a.studentId)));
      const hw = await this.getHomework();
      await this.saveHomework(hw.filter((h) => !idSet.has(h.studentId)));
      const ev = await this.getEvents();
      await this.saveEvents(ev.filter((e) => !idSet.has(e.studentId)));
    }
  }

  async clearAllStudents(): Promise<void> {
    await this.saveStudents([]);
    await this.saveAttendanceRecords([]);
    await this.saveHomework([]);
    await this.saveEvents([]);
  }

  // --- Attendance CRUD ---
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const db = await this.dbPromise;
    if (!db) return this.getLocal<AttendanceRecord[]>('attendance', []);

    return new Promise((resolve) => {
      const tx = db.transaction('attendance', 'readonly');
      const store = tx.objectStore('attendance');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve(this.getLocal<AttendanceRecord[]>('attendance', []));
    });
  }

  async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    this.setLocal('attendance', records);
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('attendance', 'readwrite');
      const store = tx.objectStore('attendance');
      store.clear();
      records.forEach((r) => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async recordCheckIn(studentId: string, studentName: string, customTime?: string, customDate?: string): Promise<{ record: AttendanceRecord; event: AttendanceEvent }> {
    const now = new Date();
    const dateStr = customDate || now.toISOString().split('T')[0];
    const timeStr = customTime || now.toTimeString().substring(0, 5); // HH:mm

    const records = await this.getAttendanceRecords();
    const existingIndex = records.findIndex((r) => r.studentId === studentId && r.date === dateStr);

    let record: AttendanceRecord;
    const timestamp = Date.now();

    if (existingIndex !== -1) {
      record = {
        ...records[existingIndex],
        checkInTime: timeStr,
        status: 'checked_in',
        updatedAt: timestamp,
      };
      // Reset checkout if re-checking in
      if (record.checkOutTime) {
        delete record.checkOutTime;
        delete record.durationMinutes;
      }
      records[existingIndex] = record;
    } else {
      record = {
        id: 'att-' + timestamp + '-' + Math.random().toString(36).substring(2, 6),
        studentId,
        studentName,
        date: dateStr,
        checkInTime: timeStr,
        status: 'checked_in',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      records.unshift(record);
    }

    await this.saveAttendanceRecords(records);

    const event: AttendanceEvent = {
      id: 'ev-' + timestamp + '-' + Math.random().toString(36).substring(2, 6),
      studentId,
      studentName,
      type: 'check_in',
      timestamp,
      date: dateStr,
      timeStr,
      note: '签到成功',
    };
    await this.addEvent(event);

    return { record, event };
  }

  async recordCheckOut(studentId: string, studentName: string, customTime?: string, customDate?: string): Promise<{ record: AttendanceRecord; event: AttendanceEvent } | null> {
    const now = new Date();
    const dateStr = customDate || now.toISOString().split('T')[0];
    const timeStr = customTime || now.toTimeString().substring(0, 5);

    const records = await this.getAttendanceRecords();
    const existingIndex = records.findIndex((r) => r.studentId === studentId && r.date === dateStr);

    const timestamp = Date.now();

    if (existingIndex !== -1) {
      const existing = records[existingIndex];
      // Calculate duration between check-in and check-out
      let durationMinutes = 0;
      try {
        const [inH, inM] = existing.checkInTime.split(':').map(Number);
        const [outH, outM] = timeStr.split(':').map(Number);
        const inTotal = inH * 60 + inM;
        const outTotal = outH * 60 + outM;
        durationMinutes = Math.max(0, outTotal - inTotal);
      } catch {
        durationMinutes = 0;
      }

      const updatedRecord: AttendanceRecord = {
        ...existing,
        checkOutTime: timeStr,
        durationMinutes,
        status: 'checked_out',
        updatedAt: timestamp,
      };

      records[existingIndex] = updatedRecord;
      await this.saveAttendanceRecords(records);

      const event: AttendanceEvent = {
        id: 'ev-' + timestamp + '-' + Math.random().toString(36).substring(2, 6),
        studentId,
        studentName,
        type: 'check_out',
        timestamp,
        date: dateStr,
        timeStr,
        note: `签退成功，在场时长约 ${Math.floor(durationMinutes / 60)}小时${durationMinutes % 60}分钟`,
      };
      await this.addEvent(event);

      return { record: updatedRecord, event };
    } else {
      // If no check-in record exists today, create one with default 1 hr duration
      const record: AttendanceRecord = {
        id: 'att-' + timestamp + '-' + Math.random().toString(36).substring(2, 6),
        studentId,
        studentName,
        date: dateStr,
        checkInTime: timeStr,
        checkOutTime: timeStr,
        durationMinutes: 0,
        status: 'checked_out',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      records.unshift(record);
      await this.saveAttendanceRecords(records);

      const event: AttendanceEvent = {
        id: 'ev-' + timestamp + '-' + Math.random().toString(36).substring(2, 6),
        studentId,
        studentName,
        type: 'check_out',
        timestamp,
        date: dateStr,
        timeStr,
        note: '直接签退',
      };
      await this.addEvent(event);

      return { record, event };
    }
  }

  // --- Events Logs ---
  async getEvents(): Promise<AttendanceEvent[]> {
    const db = await this.dbPromise;
    if (!db) return this.getLocal<AttendanceEvent[]>('events', []);

    return new Promise((resolve) => {
      const tx = db.transaction('events', 'readonly');
      const store = tx.objectStore('events');
      const request = store.getAll();
      request.onsuccess = () => {
        const list = (request.result || []) as AttendanceEvent[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      request.onerror = () => resolve(this.getLocal<AttendanceEvent[]>('events', []));
    });
  }

  async addEvent(event: AttendanceEvent): Promise<void> {
    const events = await this.getEvents();
    events.unshift(event);
    const limited = events.slice(0, 500); // keep recent 500
    this.setLocal('events', limited);

    const db = await this.dbPromise;
    if (!db) return;

    try {
      const tx = db.transaction('events', 'readwrite');
      const store = tx.objectStore('events');
      store.put(event);
    } catch (e) {
      console.error(e);
    }
  }

  async saveEvents(events: AttendanceEvent[]): Promise<void> {
    const limited = events.slice(0, 500);
    this.setLocal('events', limited);
    const db = await this.dbPromise;
    if (!db) return;
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('events', 'readwrite');
        const store = tx.objectStore('events');
        store.clear();
        limited.forEach((e) => store.put(e));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        resolve();
      }
    });
  }

  // --- Homework Records CRUD ---
  async getHomework(): Promise<HomeworkRecord[]> {
    const db = await this.dbPromise;
    if (!db) return this.getLocal<HomeworkRecord[]>('homework', []);

    return new Promise((resolve) => {
      const tx = db.transaction('homework', 'readonly');
      const store = tx.objectStore('homework');
      const request = store.getAll();
      request.onsuccess = () => {
        const list = (request.result || []) as HomeworkRecord[];
        list.sort((a, b) => b.createdAt - a.createdAt);
        resolve(list);
      };
      request.onerror = () => resolve(this.getLocal<HomeworkRecord[]>('homework', []));
    });
  }

  async saveHomework(homeworkList: HomeworkRecord[]): Promise<void> {
    this.setLocal('homework', homeworkList);
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('homework', 'readwrite');
      const store = tx.objectStore('homework');
      store.clear();
      homeworkList.forEach((hw) => store.put(hw));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async addHomework(record: Omit<HomeworkRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HomeworkRecord> {
    const now = Date.now();
    const newRecord: HomeworkRecord = {
      ...record,
      id: 'hw-' + now + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: now,
      updatedAt: now,
    };
    const list = await this.getHomework();
    list.unshift(newRecord);
    await this.saveHomework(list);
    return newRecord;
  }

  async updateHomework(record: HomeworkRecord): Promise<void> {
    const list = await this.getHomework();
    const idx = list.findIndex((h) => h.id === record.id);
    if (idx !== -1) {
      list[idx] = {
        ...record,
        updatedAt: Date.now(),
      };
      await this.saveHomework(list);
    }
  }

  async deleteHomework(id: string): Promise<void> {
    const list = await this.getHomework();
    await this.saveHomework(list.filter((h) => h.id !== id));
  }

  // --- Subjects Config CRUD ---
  async getSubjects(): Promise<SubjectConfig[]> {
    const db = await this.dbPromise;
    const defaultSubs = DEFAULT_SUBJECTS;
    if (!db) return this.getLocal<SubjectConfig[]>('subjects', defaultSubs);

    return new Promise((resolve) => {
      const tx = db.transaction('subjects', 'readonly');
      const store = tx.objectStore('subjects');
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result;
        if (!result || result.length === 0) {
          resolve(defaultSubs);
        } else {
          resolve(result);
        }
      };
      request.onerror = () => resolve(this.getLocal<SubjectConfig[]>('subjects', defaultSubs));
    });
  }

  async saveSubjects(subjects: SubjectConfig[]): Promise<void> {
    this.setLocal('subjects', subjects);
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('subjects', 'readwrite');
      const store = tx.objectStore('subjects');
      store.clear();
      subjects.forEach((s) => store.put(s));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async addSubject(name: string, color: string, bgColor: string): Promise<SubjectConfig> {
    const subjects = await this.getSubjects();
    const newSub: SubjectConfig = {
      id: 'sub-' + Date.now(),
      name,
      color,
      bgColor,
    };
    subjects.push(newSub);
    await this.saveSubjects(subjects);
    return newSub;
  }

  async deleteSubject(id: string): Promise<void> {
    const subjects = await this.getSubjects();
    await this.saveSubjects(subjects.filter((s) => s.id !== id));
  }

  // --- Full Backup & Restore ---
  async exportFullBackup(): Promise<AppDatabaseBackup> {
    const [students, attendance, homework, events, subjects] = await Promise.all([
      this.getStudents(),
      this.getAttendanceRecords(),
      this.getHomework(),
      this.getEvents(),
      this.getSubjects(),
    ]);

    return {
      version: DB_VERSION,
      exportTime: new Date().toISOString(),
      students,
      attendance,
      homework,
      events,
      subjects,
    };
  }

  async importFullBackup(backup: AppDatabaseBackup, overwrite: boolean = true): Promise<void> {
    if (overwrite) {
      await this.saveStudents(backup.students || []);
      await this.saveAttendanceRecords(backup.attendance || []);
      await this.saveHomework(backup.homework || []);
      this.setLocal('events', backup.events || []);
      await this.saveSubjects(backup.subjects?.length ? backup.subjects : DEFAULT_SUBJECTS);
    } else {
      // Merge
      const currentStudents = await this.getStudents();
      const studentMap = new Map(currentStudents.map((s) => [s.id, s]));
      (backup.students || []).forEach((s) => studentMap.set(s.id, s));
      await this.saveStudents(Array.from(studentMap.values()));

      const currentAtt = await this.getAttendanceRecords();
      const attMap = new Map(currentAtt.map((a) => [a.id, a]));
      (backup.attendance || []).forEach((a) => attMap.set(a.id, a));
      await this.saveAttendanceRecords(Array.from(attMap.values()));

      const currentHw = await this.getHomework();
      const hwMap = new Map(currentHw.map((h) => [h.id, h]));
      (backup.homework || []).forEach((h) => hwMap.set(h.id, h));
      await this.saveHomework(Array.from(hwMap.values()));
    }
  }

  async clearAllData(): Promise<void> {
    await this.saveStudents([]);
    await this.saveAttendanceRecords([]);
    await this.saveHomework([]);
    this.setLocal('events', []);
    await this.saveSubjects(DEFAULT_SUBJECTS);
  }
}

export const dbService = new LocalDatabase();
