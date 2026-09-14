import React, { useState, useMemo } from 'react';
import {
  Student,
  AttendanceRecord,
  HomeworkRecord,
  SubjectConfig,
  TaskStatus,
} from '../types';
import {
  X,
  User,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Download,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Phone,
  Tag,
  FileSpreadsheet,
  Camera,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { compressMultipleImageFiles } from '../utils/imageUtils';
import { ConfirmModal } from './ConfirmModal';
import { ImageLightboxModal } from './ImageLightboxModal';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
  attendanceRecords: AttendanceRecord[];
  homeworkRecords: HomeworkRecord[];
  subjects: SubjectConfig[];
  onAddHomework: (record: Omit<HomeworkRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateHomework: (record: HomeworkRecord) => Promise<void>;
  onDeleteHomework: (id: string) => Promise<void>;
  onUpdateStudent: (student: Student) => Promise<void>;
  onDeleteStudent?: (id: string) => Promise<void>;
  onCheckIn: (studentId: string, studentName: string, customTime?: string, customDate?: string) => Promise<void>;
  onCheckOut: (studentId: string, studentName: string, customTime?: string, customDate?: string) => Promise<void>;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  attendanceRecords,
  homeworkRecords,
  subjects,
  onAddHomework,
  onUpdateHomework,
  onDeleteHomework,
  onUpdateStudent,
  onDeleteStudent,
  onCheckIn,
  onCheckOut,
}) => {
  const [activeTab, setActiveTab] = useState<'homework' | 'attendance' | 'charts'>('homework');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Edit profile form
  const [editName, setEditName] = useState(student.name);
  const [editStudentNo, setEditStudentNo] = useState(student.studentNo);
  const [editGradeClass, setEditGradeClass] = useState(student.gradeClass);
  const [editPhone, setEditPhone] = useState(student.phone || '');
  const [editNotes, setEditNotes] = useState(student.notes || '');

  // Add/Edit homework form modal inside detail page
  const [isHwModalOpen, setIsHwModalOpen] = useState(false);
  const [editingHw, setEditingHw] = useState<HomeworkRecord | null>(null);
  const [hwSubject, setHwSubject] = useState(subjects[0]?.name || '数学');
  const [hwTaskName, setHwTaskName] = useState('');
  const [hwDate, setHwDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hwStartTime, setHwStartTime] = useState('14:00');
  const [hwEndTime, setHwEndTime] = useState('14:45');
  const [hwDuration, setHwDuration] = useState<number>(45);
  const [hwStatus, setHwStatus] = useState<TaskStatus>('completed');
  const [hwNotes, setHwNotes] = useState('');
  const [hwImages, setHwImages] = useState<string[]>([]);
  const [isUploadingHwImage, setIsUploadingHwImage] = useState(false);

  // Lightbox & Confirm modals state
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    description?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // Student's records
  const studentHwRecords = useMemo(() => {
    return homeworkRecords.filter((h) => h.studentId === student.id);
  }, [homeworkRecords, student.id]);

  const studentAttRecords = useMemo(() => {
    return attendanceRecords.filter((a) => a.studentId === student.id);
  }, [attendanceRecords, student.id]);

  // Filtered homework
  const filteredHw = useMemo(() => {
    if (subjectFilter === 'all') return studentHwRecords;
    return studentHwRecords.filter((h) => h.subject === subjectFilter);
  }, [studentHwRecords, subjectFilter]);

  // Aggregate stats for this student
  const stats = useMemo(() => {
    const totalMinutes = studentHwRecords.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
    const attendanceDays = new Set(studentAttRecords.map((a) => a.date)).size;

    // Total in-house attendance duration
    const totalAttMins = studentAttRecords.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);

    // Subject breakdown
    const subjectMap = new Map<string, number>();
    studentHwRecords.forEach((h) => {
      subjectMap.set(h.subject, (subjectMap.get(h.subject) || 0) + (h.durationMinutes || 0));
    });

    let topSubject = '暂无';
    let maxMins = 0;
    subjectMap.forEach((mins, sub) => {
      if (mins > maxMins) {
        maxMins = mins;
        topSubject = sub;
      }
    });

    return {
      totalHwHours: (totalMinutes / 60).toFixed(1),
      totalHwMinutes: totalMinutes,
      totalTasks: studentHwRecords.length,
      attendanceDays,
      totalAttHours: (totalAttMins / 60).toFixed(1),
      topSubject,
    };
  }, [studentHwRecords, studentAttRecords]);

  // Personal Pie Chart Data
  const personalPieData = useMemo(() => {
    const map = new Map<string, number>();
    studentHwRecords.forEach((h) => {
      map.set(h.subject, (map.get(h.subject) || 0) + (h.durationMinutes || 0));
    });

    const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#65a30d'];
    return Array.from(map.entries()).map(([name, val], idx) => {
      const subjectObj = subjects.find((s) => s.name === name);
      return {
        name,
        value: val,
        color: subjectObj?.color || colors[idx % colors.length],
      };
    });
  }, [studentHwRecords, subjects]);

  // Personal Line Chart Data (Trend)
  const personalTrendData = useMemo(() => {
    const map = new Map<string, number>();
    studentHwRecords.forEach((h) => {
      map.set(h.date, (map.get(h.date) || 0) + (h.durationMinutes || 0));
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, mins]) => ({
        date: date.substring(5), // MM-DD
        hours: Number((mins / 60).toFixed(1)),
        minutes: mins,
      }));
  }, [studentHwRecords]);

  // Open homework modal
  const openHwModal = (record?: HomeworkRecord) => {
    if (record) {
      setEditingHw(record);
      setHwSubject(record.subject);
      setHwTaskName(record.taskName);
      setHwDate(record.date);
      setHwStartTime(record.startTime || '14:00');
      setHwEndTime(record.endTime);
      setHwDuration(record.durationMinutes);
      setHwStatus(record.status);
      setHwNotes(record.notes || '');
      setHwImages(record.images || []);
    } else {
      setEditingHw(null);
      setHwSubject(subjects[0]?.name || '数学');
      setHwTaskName('');
      setHwDate(new Date().toISOString().split('T')[0]);
      const now = new Date();
      const currentHHMM = now.toTimeString().substring(0, 5);
      const endHHMM = new Date(now.getTime() + 45 * 60000).toTimeString().substring(0, 5);
      setHwStartTime(currentHHMM);
      setHwEndTime(endHHMM);
      setHwDuration(45);
      setHwStatus('completed');
      setHwNotes('');
      setHwImages([]);
    }
    setIsHwModalOpen(true);
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingHwImage(true);
      const compressedDataUrls = await compressMultipleImageFiles(files, 1280, 0.82);
      setHwImages((prev) => [...prev, ...compressedDataUrls]);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsUploadingHwImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setHwImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveHw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTaskName.trim()) return;

    if (editingHw) {
      await onUpdateHomework({
        ...editingHw,
        subject: hwSubject,
        taskName: hwTaskName.trim(),
        date: hwDate,
        startTime: hwStartTime,
        completedAt: hwEndTime,
        endTime: hwEndTime,
        durationMinutes: Number(hwDuration) || 0,
        status: hwStatus,
        notes: hwNotes.trim(),
        images: hwImages,
      });
    } else {
      await onAddHomework({
        studentId: student.id,
        studentName: student.name,
        subject: hwSubject,
        taskName: hwTaskName.trim(),
        date: hwDate,
        startTime: hwStartTime,
        completedAt: hwEndTime,
        endTime: hwEndTime,
        durationMinutes: Number(hwDuration) || 0,
        status: hwStatus,
        scoreOrQuality: 'A',
        notes: hwNotes.trim(),
        images: hwImages,
      });
    }
    setIsHwModalOpen(false);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    await onUpdateStudent({
      ...student,
      name: editName.trim(),
      studentNo: editStudentNo.trim(),
      gradeClass: editGradeClass.trim(),
      phone: editPhone.trim(),
      notes: editNotes.trim(),
    });
    setIsEditingProfile(false);
  };

  // Export individual student report as CSV
  const exportStudentReport = () => {
    const rows = [
      ['学生学业与考勤专属报告'],
      ['姓名', student.name, '学号', student.studentNo, '班级', student.gradeClass],
      ['导出时间', new Date().toLocaleString('zh-CN')],
      ['累计考勤天数', stats.attendanceDays, '完成作业总数', stats.totalTasks, '作业累计总时长', `${stats.totalHwHours} 小时`],
      [],
      ['【作业与学习事项明细】'],
      ['日期', '学科', '完成作业事项', '开始时间', '结束/完成时间', '持续时长(分钟)', '状态', '评语/备注'],
    ];

    studentHwRecords.forEach((r) => {
      rows.push([
        r.date,
        r.subject,
        `"${r.taskName.replace(/"/g, '""')}"`,
        r.startTime || '',
        r.endTime || '',
        r.durationMinutes.toString(),
        r.status === 'completed' ? '已完成' : '进行中',
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ]);
    });

    rows.push([]);
    rows.push(['【考勤签到签退记录】']);
    rows.push(['日期', '签到时间', '签退时间', '在场时长(分钟)', '考勤状态', '备注']);
    studentAttRecords.forEach((a) => {
      rows.push([
        a.date,
        a.checkInTime || '',
        a.checkOutTime || '',
        (a.durationMinutes || 0).toString(),
        a.status === 'checked_out' ? '已签退' : '在场中',
        `"${(a.note || '').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${student.name}_学业与考勤报告_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 my-auto flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header: Student Profile Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 sm:p-5 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl shadow-inner border border-white/30">
                {student.name.substring(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-white">{student.name}</h2>
                  {student.gradeClass && (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
                      {student.gradeClass}
                    </span>
                  )}
                  <span className="font-mono text-xs text-blue-100">
                    学号: {student.studentNo || '未分配'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-blue-100 mt-1 flex-wrap">
                  {student.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {student.phone}
                    </span>
                  )}
                  {student.notes && (
                    <span className="text-blue-200 truncate max-w-xs">
                      备注: {student.notes}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportStudentReport}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition"
                title="导出该学生专属统计报表"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>导出个人报表</span>
              </button>

              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
                title="编辑学生基本资料"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {onDeleteStudent && (
                <button
                  id="delete-student-profile-btn"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: '删除该学生档案',
                      message: `确定要彻底删除学生「${student.name}」吗？`,
                      description: '删除后，该学生的考勤签到记录、作业事项以及相关拍照附件将全部级联清除，此操作无法撤销。',
                      variant: 'danger',
                      onConfirm: async () => {
                        await onDeleteStudent(student.id);
                        onClose();
                      },
                    });
                  }}
                  className="p-1.5 rounded-xl bg-white/20 hover:bg-rose-600 text-white transition"
                  title="删除学生"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Profile Edit Drawer */}
          {isEditingProfile && (
            <div className="mt-3 p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 text-xs space-y-2">
              <div className="font-bold text-white mb-1">编辑学生基本信息:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="姓名"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-2 py-1.5 bg-white text-slate-900 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="学号"
                  value={editStudentNo}
                  onChange={(e) => setEditStudentNo(e.target.value)}
                  className="px-2 py-1.5 bg-white text-slate-900 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="班级/年级"
                  value={editGradeClass}
                  onChange={(e) => setEditGradeClass(e.target.value)}
                  className="px-2 py-1.5 bg-white text-slate-900 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="联系电话"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="px-2 py-1.5 bg-white text-slate-900 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-1 bg-white text-blue-700 font-bold rounded text-xs hover:bg-blue-50"
                >
                  保存修改
                </button>
              </div>
            </div>
          )}

          {/* KPI Mini-bar */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/20 text-center">
            <div className="bg-white/10 rounded-xl p-2">
              <div className="text-[10px] text-blue-200">累计作业时长</div>
              <div className="text-base sm:text-lg font-bold text-white">{stats.totalHwHours}h</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <div className="text-[10px] text-blue-200">完成事项数</div>
              <div className="text-base sm:text-lg font-bold text-white">{stats.totalTasks}项</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <div className="text-[10px] text-blue-200">考勤签到天数</div>
              <div className="text-base sm:text-lg font-bold text-white">{stats.attendanceDays}天</div>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <div className="text-[10px] text-blue-200">主攻学科</div>
              <div className="text-base sm:text-lg font-bold text-white truncate">{stats.topSubject}</div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('homework')}
              className={`py-3 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'homework'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>作业事项明细 ({studentHwRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-3 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>签到签退历史 ({studentAttRecords.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`py-3 px-3 border-b-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'charts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
              <span>个人图表分析</span>
            </button>
          </div>

          <button
            onClick={() => openHwModal()}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>加作业</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: 作业事项明细 */}
          {activeTab === 'homework' && (
            <div className="space-y-3">
              {/* Subject Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-xs text-slate-400 whitespace-nowrap">学科:</span>
                <button
                  onClick={() => setSubjectFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    subjectFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部 ({studentHwRecords.length})
                </button>
                {subjects.map((sub) => {
                  const count = studentHwRecords.filter((h) => h.subject === sub.name).length;
                  if (count === 0 && subjectFilter !== sub.name) return null;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSubjectFilter(sub.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 border ${
                        subjectFilter === sub.name
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span>{sub.name}</span>
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              {filteredHw.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  该学生暂无相关作业记录
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHw.map((rec) => {
                    const subObj = subjects.find((s) => s.name === rec.subject);
                    return (
                      <div
                        key={rec.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-bold text-white"
                                style={{ backgroundColor: subObj?.color || '#2563eb' }}
                              >
                                {rec.subject}
                              </span>
                              <span className="text-xs font-mono text-slate-500">
                                {rec.date}
                              </span>
                              {rec.scoreOrQuality && (
                                <span className="text-[10px] px-1 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                  评级: {rec.scoreOrQuality}
                                </span>
                              )}
                            </div>

                            <div className="text-sm font-semibold text-slate-900">
                              {rec.taskName}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                              <span className="flex items-center gap-1 font-bold text-indigo-700">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                耗时: {rec.durationMinutes} 分钟
                              </span>
                              <span className="text-slate-400">
                                时段: {rec.startTime || '--:--'} ~ {rec.endTime}
                              </span>
                              <span className="text-emerald-600 font-medium">
                                完成于 {rec.completedAt || rec.endTime}
                              </span>
                            </div>

                            {rec.notes && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">
                                {rec.notes}
                              </div>
                            )}

                            {/* Homework Photos Preview */}
                            {rec.images && rec.images.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-slate-500">
                                  <Camera className="w-3 h-3 text-blue-600" />
                                  <span>作业/批改照片 ({rec.images.length}张)</span>
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                  {rec.images.map((imgUrl, imgIdx) => (
                                    <button
                                      key={imgIdx}
                                      type="button"
                                      onClick={() => {
                                        setLightboxImages(rec.images || []);
                                        setLightboxIndex(imgIdx);
                                      }}
                                      className="relative group shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-blue-500 transition"
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`照片 ${imgIdx + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-150"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition">
                                        查看
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openHwModal(rec)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                              title="编辑作业记录"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: '删除作业记录',
                                  message: `确认删除「${student.name}」的作业「${rec.taskName}」吗？`,
                                  description: '删除后此作业记录及附带照片将从本地数据库彻底清除。',
                                  variant: 'danger',
                                  onConfirm: async () => {
                                    await onDeleteHomework(rec.id);
                                  },
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                              title="删除作业记录"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 签到签退历史 */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>该学生所有签到打卡历史记录 (按日期排序)</span>
                <span className="font-bold text-slate-700">累计在场: {stats.totalAttHours} 小时</span>
              </div>

              {studentAttRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  暂无考勤签到记录
                </div>
              ) : (
                <div className="space-y-2">
                  {studentAttRecords.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center font-mono">
                          <span className="text-[10px] text-blue-500">{att.date.substring(5, 7)}月</span>
                          <span className="font-bold text-xs leading-none">{att.date.substring(8, 10)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                            <span>签到: {att.checkInTime}</span>
                            <span>•</span>
                            <span>签退: {att.checkOutTime || '在场自习中'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {att.note || '正常自习考勤'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === 'checked_out'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {att.status === 'checked_out' ? '已签退' : '在场中'}
                        </span>
                        <div className="font-mono text-indigo-700 font-bold mt-1">
                          {att.durationMinutes ? `${Math.floor(att.durationMinutes / 60)}h ${att.durationMinutes % 60}m` : '--'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 个人图表分析 */}
          {activeTab === 'charts' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Pie Chart */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <PieChartIcon className="w-3.5 h-3.5 text-blue-600" />
                    各学科作业耗时分布 (个人饼状图)
                  </h4>
                  {personalPieData.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                      暂无作业时长数据
                    </div>
                  ) : (
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={personalPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={65}
                            innerRadius={35}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {personalPieData.map((e, idx) => (
                              <Cell key={`p-cell-${idx}`} fill={e.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(val: any) => [`${val} 分钟`, '作业耗时']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Personal Daily Trend */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    个人每日作业时长走势 (折线图)
                  </h4>
                  {personalTrendData.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                      记录更多作业后将生成走势
                    </div>
                  ) : (
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={personalTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} unit="h" />
                          <RechartsTooltip formatter={(val: any) => [`${val} 小时`, '当日耗时']} />
                          <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
          <button
            onClick={exportStudentReport}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出该学生报表</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition"
          >
            关闭页面
          </button>
        </div>
      </div>

      {/* Internal Sub-modal for Add/Edit Homework for this student */}
      {isHwModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingHw ? '修改作业事项' : `为 ${student.name} 记录作业`}
              </h3>
              <button onClick={() => setIsHwModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHw} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">学科</label>
                  <select
                    value={hwSubject}
                    onChange={(e) => setHwSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">日期</label>
                  <input
                    type="date"
                    value={hwDate}
                    onChange={(e) => setHwDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">完成什么作业事项</label>
                <input
                  type="text"
                  placeholder="如：数学期末模拟卷、单词背诵50个..."
                  value={hwTaskName}
                  onChange={(e) => setHwTaskName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">开始时间</label>
                  <input
                    type="time"
                    value={hwStartTime}
                    onChange={(e) => setHwStartTime(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">结束/完成时间</label>
                  <input
                    type="time"
                    value={hwEndTime}
                    onChange={(e) => setHwEndTime(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">时长(分钟)</label>
                  <input
                    type="number"
                    value={hwDuration}
                    onChange={(e) => setHwDuration(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">心得/批改备注</label>
                <textarea
                  rows={2}
                  placeholder="掌握情况良好..."
                  value={hwNotes}
                  onChange={(e) => setHwNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Photo Upload & Camera Feature (拍照上传图片功能) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>作业/试卷拍照与照片附件</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    已选 {hwImages.length} 张图片
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {/* Camera Capture Button */}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition">
                      <Camera className="w-3.5 h-3.5" />
                      <span>拍照上传</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageFileSelect}
                        disabled={isUploadingHwImage}
                        className="hidden"
                      />
                    </label>

                    {/* Album Selection */}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>相册选择</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFileSelect}
                        disabled={isUploadingHwImage}
                        className="hidden"
                      />
                    </label>

                    {isUploadingHwImage && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 animate-pulse font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>正在压缩优化图片...</span>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Photos Preview List */}
                  {hwImages.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                      {hwImages.map((dataUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-2xs"
                        >
                          <img
                            src={dataUrl}
                            alt={`作业照片 ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-xs transition"
                            title="删除照片"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      支持手机直接拍照记录作业、试卷，自动压缩保存在手机本地，离线随开随查。
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHwModalOpen(false)}
                  className="flex-1 py-2 border rounded-xl text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        description={confirmModal.description}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Fullscreen Lightbox Modal */}
      {lightboxImages && (
        <ImageLightboxModal
          isOpen={true}
          images={lightboxImages}
          initialIndex={lightboxIndex}
          title={`${student.name} 的作业拍照附件`}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
};
