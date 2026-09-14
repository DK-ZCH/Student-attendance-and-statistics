import React, { useState, useEffect, useCallback } from 'react';
import {
  Student,
  AttendanceRecord,
  HomeworkRecord,
  AttendanceEvent,
  SubjectConfig,
  AppDatabaseBackup,
} from './types';
import { dbService, DEFAULT_SUBJECTS } from './services/db';
import { generateSampleData } from './services/mockData';
import { Navbar, ActiveTab } from './components/Navbar';
import { AttendanceView } from './components/AttendanceView';
import { HomeworkView } from './components/HomeworkView';
import { ChartsView } from './components/ChartsView';
import { StudentRosterView } from './components/StudentRosterView';
import { BackupExportView } from './components/BackupExportView';
import { StudentDetailModal } from './components/StudentDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('attendance');
  const [isLoading, setIsLoading] = useState(true);

  // Core database state
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [homeworkRecords, setHomeworkRecords] = useState<HomeworkRecord[]>([]);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>(DEFAULT_SUBJECTS);

  // Selected student for dedicated independent detail page
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  // Pre-selected student when navigating to homework view
  const [preSelectedStudentHw, setPreSelectedStudentHw] = useState<Student | null>(null);

  // Load all data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      const [stu, att, hw, ev, sub] = await Promise.all([
        dbService.getStudents(),
        dbService.getAttendanceRecords(),
        dbService.getHomework(),
        dbService.getEvents(),
        dbService.getSubjects(),
      ]);

      // If completely empty first-time user, seed with sample data so the app comes to life instantly
      if (stu.length === 0) {
        const sample = generateSampleData();
        await dbService.saveStudents(sample.students);
        await dbService.saveAttendanceRecords(sample.attendance);
        await dbService.saveHomework(sample.homework);
        for (const evItem of sample.events) {
          await dbService.addEvent(evItem);
        }
        setStudents(sample.students);
        setAttendanceRecords(sample.attendance);
        setHomeworkRecords(sample.homework);
        setEvents(sample.events);
      } else {
        setStudents(stu);
        setAttendanceRecords(att);
        setHomeworkRecords(hw);
        setEvents(ev);
      }

      setSubjects(sub.length > 0 ? sub : DEFAULT_SUBJECTS);
    } catch (e) {
      console.error('Failed to load database:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep selectedStudentDetail in sync if students list changes
  useEffect(() => {
    if (selectedStudentDetail) {
      const updated = students.find((s) => s.id === selectedStudentDetail.id);
      if (updated) {
        setSelectedStudentDetail(updated);
      }
    }
  }, [students, selectedStudentDetail]);

  // Attendance Handlers
  const handleCheckIn = async (
    studentId: string,
    studentName: string,
    customTime?: string,
    customDate?: string
  ) => {
    const res = await dbService.recordCheckIn(studentId, studentName, customTime, customDate);
    const updatedAtt = await dbService.getAttendanceRecords();
    const updatedEv = await dbService.getEvents();
    setAttendanceRecords(updatedAtt);
    setEvents(updatedEv);
  };

  const handleCheckOut = async (
    studentId: string,
    studentName: string,
    customTime?: string,
    customDate?: string
  ) => {
    await dbService.recordCheckOut(studentId, studentName, customTime, customDate);
    const updatedAtt = await dbService.getAttendanceRecords();
    const updatedEv = await dbService.getEvents();
    setAttendanceRecords(updatedAtt);
    setEvents(updatedEv);
  };

  // Homework Handlers
  const handleAddHomework = async (
    record: Omit<HomeworkRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    await dbService.addHomework(record);
    const updatedHw = await dbService.getHomework();
    setHomeworkRecords(updatedHw);
  };

  const handleUpdateHomework = async (record: HomeworkRecord) => {
    await dbService.updateHomework(record);
    const updatedHw = await dbService.getHomework();
    setHomeworkRecords(updatedHw);
  };

  const handleDeleteHomework = async (id: string) => {
    await dbService.deleteHomework(id);
    const updatedHw = await dbService.getHomework();
    setHomeworkRecords(updatedHw);
  };

  // Subject Handlers
  const handleAddSubject = async (name: string, color: string, bgColor: string) => {
    await dbService.addSubject(name, color, bgColor);
    const updatedSubjects = await dbService.getSubjects();
    setSubjects(updatedSubjects);
  };

  const handleDeleteSubject = async (id: string) => {
    await dbService.deleteSubject(id);
    const updatedSubjects = await dbService.getSubjects();
    setSubjects(updatedSubjects);
  };

  // Student Roster Handlers
  const handleAddStudent = async (student: Omit<Student, 'id' | 'createdAt'>) => {
    const created = await dbService.addStudent(student);
    const updatedStudents = await dbService.getStudents();
    setStudents(updatedStudents);
    return created;
  };

  const handleBatchImportStudents = async (
    newStudents: Array<Omit<Student, 'id' | 'createdAt'>>
  ) => {
    const current = await dbService.getStudents();
    const timestamp = Date.now();
    const prepared: Student[] = newStudents.map((s, idx) => ({
      ...s,
      id: 'stu-' + (timestamp + idx) + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: timestamp + idx,
    }));
    const merged = [...prepared, ...current];
    await dbService.saveStudents(merged);
    setStudents(merged);
  };

  const handleUpdateStudent = async (student: Student) => {
    await dbService.updateStudent(student);
    const updatedStudents = await dbService.getStudents();
    setStudents(updatedStudents);
  };

  const handleDeleteStudent = async (id: string) => {
    await dbService.deleteStudent(id);
    const updatedStudents = await dbService.getStudents();
    setStudents(updatedStudents);
    if (selectedStudentDetail?.id === id) {
      setSelectedStudentDetail(null);
    }
  };

  // Backup & Restore Handlers
  const handleExportFullBackup = async (): Promise<AppDatabaseBackup> => {
    return dbService.exportFullBackup();
  };

  const handleImportFullBackup = async (backup: AppDatabaseBackup, overwrite: boolean) => {
    await dbService.importFullBackup(backup, overwrite);
    await loadData();
  };

  const handleLoadSampleData = async () => {
    const sample = generateSampleData();
    await dbService.saveStudents(sample.students);
    await dbService.saveAttendanceRecords(sample.attendance);
    await dbService.saveHomework(sample.homework);
    for (const evItem of sample.events) {
      await dbService.addEvent(evItem);
    }
    await loadData();
  };

  const handleClearAllData = async () => {
    await dbService.clearAllData();
    setStudents([]);
    setAttendanceRecords([]);
    setHomeworkRecords([]);
    setEvents([]);
    setSubjects(DEFAULT_SUBJECTS);
    setSelectedStudentDetail(null);
  };

  // Quick action from Student Card to Homework view
  const handleQuickAddHomework = (student: Student) => {
    setPreSelectedStudentHw(student);
    setActiveTab('homework');
  };

  // Today checked-in count
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckedInCount = attendanceRecords.filter(
    (a) => a.date === todayStr && a.status === 'checked_in'
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl animate-bounce shadow-lg shadow-blue-500/20">
          学
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-600 tracking-wider">
          正在加载本地数据库...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        todayCheckedInCount={todayCheckedInCount}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4">
        {activeTab === 'attendance' && (
          <AttendanceView
            students={students}
            attendanceRecords={attendanceRecords}
            events={events}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onOpenStudentDetail={(stu) => setSelectedStudentDetail(stu)}
            onQuickAddHomework={handleQuickAddHomework}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'homework' && (
          <HomeworkView
            students={students}
            homeworkRecords={homeworkRecords}
            subjects={subjects}
            onAddHomework={handleAddHomework}
            onUpdateHomework={handleUpdateHomework}
            onDeleteHomework={handleDeleteHomework}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
            onOpenStudentDetail={(stu) => setSelectedStudentDetail(stu)}
            preSelectedStudent={preSelectedStudentHw}
            onClearPreSelectedStudent={() => setPreSelectedStudentHw(null)}
          />
        )}

        {activeTab === 'charts' && (
          <ChartsView
            students={students}
            attendanceRecords={attendanceRecords}
            homeworkRecords={homeworkRecords}
            subjects={subjects}
            onOpenStudentDetail={(stu) => setSelectedStudentDetail(stu)}
          />
        )}

        {activeTab === 'roster' && (
          <StudentRosterView
            students={students}
            attendanceRecords={attendanceRecords}
            homeworkRecords={homeworkRecords}
            onAddStudent={handleAddStudent}
            onBatchImportStudents={handleBatchImportStudents}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenStudentDetail={(stu) => setSelectedStudentDetail(stu)}
            onQuickAddHomework={handleQuickAddHomework}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {activeTab === 'backup' && (
          <BackupExportView
            students={students}
            attendanceRecords={attendanceRecords}
            homeworkRecords={homeworkRecords}
            events={events}
            subjects={subjects}
            onExportFullBackup={handleExportFullBackup}
            onImportFullBackup={handleImportFullBackup}
            onLoadSampleData={handleLoadSampleData}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* Independent Dedicated Student Detail Page Modal */}
      {selectedStudentDetail && (
        <StudentDetailModal
          student={selectedStudentDetail}
          onClose={() => setSelectedStudentDetail(null)}
          attendanceRecords={attendanceRecords}
          homeworkRecords={homeworkRecords}
          subjects={subjects}
          onAddHomework={handleAddHomework}
          onUpdateHomework={handleUpdateHomework}
          onDeleteHomework={handleDeleteHomework}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />
      )}
    </div>
  );
}
