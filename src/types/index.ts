export type AttendanceStatus = 'not_present' | 'checked_in' | 'checked_out';

export interface Student {
  id: string;
  name: string;
  studentNo: string;
  gradeClass: string;
  phone?: string;
  notes?: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss or HH:mm
  checkOutTime?: string; // HH:mm:ss or HH:mm
  durationMinutes?: number; // Calculated duration in minutes
  status: AttendanceStatus;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = 'completed' | 'in_progress' | 'needs_review';

export interface HomeworkRecord {
  id: string;
  studentId: string;
  studentName: string;
  subject: string; // 学科，如 数学, 英语, 语文, 物理...
  taskName: string; // 完成什么作业事项
  date: string; // YYYY-MM-DD
  startTime?: string; // 开始时间 HH:mm
  completedAt: string; // 几点完成的 HH:mm
  endTime: string; // 结束时间 HH:mm
  durationMinutes: number; // 持续时间（分钟）
  status: TaskStatus;
  notes?: string; // 评价/心得/备注
  scoreOrQuality?: 'A' | 'B' | 'C' | 'D'; // 评价等级
  images?: string[]; // 作业卷面/批改拍照图片 (Base64/Data URLs)
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceEvent {
  id: string;
  studentId: string;
  studentName: string;
  type: 'check_in' | 'check_out';
  timestamp: number;
  timeStr: string;
  date: string;
  note?: string;
}

export interface SubjectConfig {
  id: string;
  name: string;
  color: string;
  bgColor: string;
}

export interface AppDatabaseBackup {
  version: number;
  exportTime: string;
  students: Student[];
  attendance: AttendanceRecord[];
  homework: HomeworkRecord[];
  events: AttendanceEvent[];
  subjects: SubjectConfig[];
}
