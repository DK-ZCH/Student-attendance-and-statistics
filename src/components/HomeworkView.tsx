import React, { useState, useMemo } from 'react';
import {
  Student,
  HomeworkRecord,
  SubjectConfig,
  TaskStatus,
} from '../types';
import {
  Plus,
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  Tag,
  User,
  Check,
  Camera,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { compressMultipleImageFiles } from '../utils/imageUtils';
import { ConfirmModal } from './ConfirmModal';
import { ImageLightboxModal } from './ImageLightboxModal';

interface HomeworkViewProps {
  students: Student[];
  homeworkRecords: HomeworkRecord[];
  subjects: SubjectConfig[];
  onAddHomework: (record: Omit<HomeworkRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateHomework: (record: HomeworkRecord) => Promise<void>;
  onDeleteHomework: (id: string) => Promise<void>;
  onAddSubject: (name: string, color: string, bgColor: string) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
  onOpenStudentDetail: (student: Student) => void;
  preSelectedStudent?: Student | null;
  onClearPreSelectedStudent?: () => void;
}

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  students,
  homeworkRecords,
  subjects,
  onAddHomework,
  onUpdateHomework,
  onDeleteHomework,
  onAddSubject,
  onDeleteSubject,
  onOpenStudentDetail,
  preSelectedStudent,
  onClearPreSelectedStudent,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HomeworkRecord | null>(null);

  // Manage subjects modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#2563eb');

  // Form Fields for Add/Edit
  const [formStudentId, setFormStudentId] = useState('');
  const [formSubject, setFormSubject] = useState('数学');
  const [formTaskName, setFormTaskName] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('14:00');
  const [formCompletedAt, setFormCompletedAt] = useState('14:45');
  const [formEndTime, setFormEndTime] = useState('14:45');
  const [formDuration, setFormDuration] = useState<number>(45);
  const [formStatus, setFormStatus] = useState<TaskStatus>('completed');
  const [formQuality, setFormQuality] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formNotes, setFormNotes] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  // Handle preSelectedStudent trigger from other views
  React.useEffect(() => {
    if (preSelectedStudent) {
      openAddModal(preSelectedStudent);
      if (onClearPreSelectedStudent) {
        onClearPreSelectedStudent();
      }
    }
  }, [preSelectedStudent]);

  // Open modal for Adding
  const openAddModal = (student?: Student) => {
    setEditingRecord(null);
    const initialStudentId = student ? student.id : (students[0]?.id || '');
    setFormStudentId(initialStudentId);
    setFormSubject(subjects[0]?.name || '数学');
    setFormTaskName('');
    setFormDate(new Date().toISOString().split('T')[0]);

    const now = new Date();
    const currentHHMM = now.toTimeString().substring(0, 5);
    // End time 45 mins later
    const end = new Date(now.getTime() + 45 * 60000);
    const endHHMM = end.toTimeString().substring(0, 5);

    setFormStartTime(currentHHMM);
    setFormCompletedAt(endHHMM);
    setFormEndTime(endHHMM);
    setFormDuration(45);
    setFormStatus('completed');
    setFormQuality('A');
    setFormNotes('');
    setFormImages([]);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const openEditModal = (record: HomeworkRecord) => {
    setEditingRecord(record);
    setFormStudentId(record.studentId);
    setFormSubject(record.subject);
    setFormTaskName(record.taskName);
    setFormDate(record.date);
    setFormStartTime(record.startTime || record.completedAt);
    setFormCompletedAt(record.completedAt);
    setFormEndTime(record.endTime);
    setFormDuration(record.durationMinutes);
    setFormStatus(record.status);
    setFormQuality(record.scoreOrQuality || 'A');
    setFormNotes(record.notes || '');
    setFormImages(record.images || []);
    setIsModalOpen(true);
  };

  // Image Upload / Camera handler with client-side compression
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const compressedDataUrls = await compressMultipleImageFiles(files, 1280, 0.82);
      setFormImages((prev) => [...prev, ...compressedDataUrls]);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsUploadingImage(false);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Duration recalculation when start or end time changes
  const handleStartTimeChange = (newStart: string) => {
    setFormStartTime(newStart);
    recalcDuration(newStart, formEndTime);
  };

  const handleEndTimeChange = (newEnd: string) => {
    setFormEndTime(newEnd);
    setFormCompletedAt(newEnd);
    recalcDuration(formStartTime, newEnd);
  };

  const recalcDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) {
        setFormDuration(diff);
      }
    } catch {
      // Ignore
    }
  };

  const handleDurationInputChange = (mins: number) => {
    setFormDuration(mins);
    // adjust end time based on start time + mins
    try {
      const [sh, sm] = formStartTime.split(':').map(Number);
      const totalMins = sh * 60 + sm + mins;
      const eh = Math.floor((totalMins % 1440) / 60).toString().padStart(2, '0');
      const em = (totalMins % 60).toString().padStart(2, '0');
      const newEnd = `${eh}:${em}`;
      setFormEndTime(newEnd);
      setFormCompletedAt(newEnd);
    } catch {
      // Ignore
    }
  };

  // Save form
  const handleSaveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formTaskName.trim()) {
      alert('请选择学生并填写作业完成事项');
      return;
    }

    const student = students.find((s) => s.id === formStudentId);
    const studentName = student ? student.name : '未知学生';

    if (editingRecord) {
      await onUpdateHomework({
        ...editingRecord,
        studentId: formStudentId,
        studentName,
        subject: formSubject,
        taskName: formTaskName.trim(),
        date: formDate,
        startTime: formStartTime,
        completedAt: formCompletedAt || formEndTime,
        endTime: formEndTime,
        durationMinutes: Number(formDuration) || 0,
        status: formStatus,
        scoreOrQuality: formQuality,
        notes: formNotes.trim(),
        images: formImages,
      });
    } else {
      await onAddHomework({
        studentId: formStudentId,
        studentName,
        subject: formSubject,
        taskName: formTaskName.trim(),
        date: formDate,
        startTime: formStartTime,
        completedAt: formCompletedAt || formEndTime,
        endTime: formEndTime,
        durationMinutes: Number(formDuration) || 0,
        status: formStatus,
        scoreOrQuality: formQuality,
        notes: formNotes.trim(),
        images: formImages,
      });
    }

    setIsModalOpen(false);
  };

  // Filtered homework items
  const filteredRecords = useMemo(() => {
    return homeworkRecords.filter((rec) => {
      // Subject filter
      if (selectedSubject !== 'all' && rec.subject !== selectedSubject) {
        return false;
      }
      // Student filter
      if (selectedStudentFilter !== 'all' && rec.studentId !== selectedStudentFilter) {
        return false;
      }
      // Date filter
      if (selectedDateFilter !== 'all' && rec.date !== selectedDateFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(query);
        const matchTask = rec.taskName.toLowerCase().includes(query);
        const matchSub = rec.subject.toLowerCase().includes(query);
        const matchNote = (rec.notes || '').toLowerCase().includes(query);
        if (!matchName && !matchTask && !matchSub && !matchNote) {
          return false;
        }
      }
      return true;
    });
  }, [homeworkRecords, selectedSubject, selectedStudentFilter, selectedDateFilter, searchQuery]);

  // Aggregate stats for filtered records
  const totalMinutes = useMemo(() => {
    return filteredRecords.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
  }, [filteredRecords]);

  // Handle Add Subject
  const handleAddNewSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const exists = subjects.some((s) => s.name === newSubjectName.trim());
    if (exists) {
      alert('该学科已存在');
      return;
    }
    // Generate light bg color from color
    const bgColor = `${newSubjectColor}15`;
    await onAddSubject(newSubjectName.trim(), newSubjectColor, bgColor);
    setNewSubjectName('');
    setIsSubjectModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>学生作业与自习事项管理</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              记录学生完成的具体作业事项、完成时间点、持续时长与评价
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              title="增添删改学科类别"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>管理学科</span>
            </button>

            <button
              id="add-homework-btn"
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>记录新作业</span>
            </button>
          </div>
        </div>

        {/* Subject Filter Pills (学科筛选) */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              按学科筛选:
            </span>
            <span className="text-[11px] text-slate-500">
              共 {filteredRecords.length} 项记录，合计 {(totalMinutes / 60).toFixed(1)} 小时
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedSubject === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部学科 ({homeworkRecords.length})
            </button>

            {subjects.map((sub) => {
              const count = homeworkRecords.filter((h) => h.subject === sub.name).length;
              const isSelected = selectedSubject === sub.name;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#ffffff' : sub.color }}
                  />
                  <span>{sub.name}</span>
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Row: Student & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索作业事项、学生名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">所有学生 (不限)</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.gradeClass || '无班级'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">所有日期 (全部历史)</option>
              {Array.from(new Set(homeworkRecords.map((r) => r.date))).sort().reverse().map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Homework Cards List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">暂无符合条件的作业记录</h4>
          <p className="text-xs text-slate-400 mt-1">
            点击右上角「记录新作业」，添加学生的作业完成情况、时长与时间点。
          </p>
          <button
            onClick={() => openAddModal()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
          >
            立即添加作业记录
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRecords.map((rec) => {
            const subjectObj = subjects.find((s) => s.name === rec.subject);
            const badgeColor = subjectObj?.color || '#2563eb';
            const student = students.find((s) => s.id === rec.studentId);

            return (
              <div
                key={rec.id}
                id={`homework-card-${rec.id}`}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-slate-300 shadow-2xs transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Badges & Student Name */}
                    <div className="flex items-center flex-wrap gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-md text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {rec.subject}
                      </span>

                      <button
                        onClick={() => student && onOpenStudentDetail(student)}
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.studentName}</span>
                      </button>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {rec.date}
                      </span>

                      {rec.scoreOrQuality && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          质量: {rec.scoreOrQuality}等
                        </span>
                      )}
                    </div>

                    {/* Task Title (完成什么作业事项) */}
                    <h3 className="text-sm font-semibold text-slate-900 mt-2 leading-snug">
                      {rec.taskName}
                    </h3>

                    {/* Completion Details (几点完成的，持续时间多久，结束时间是什么时候) */}
                    <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>持续时长:</span>
                        <strong className="text-indigo-700 font-bold">
                          {rec.durationMinutes} 分钟
                        </strong>
                        <span className="text-slate-400">
                          ({(rec.durationMinutes / 60).toFixed(1)}小时)
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-500 font-mono">
                        <span>时段:</span>
                        <span className="font-semibold text-slate-800">
                          {rec.startTime || '--:--'} ~ {rec.endTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>完成时间: {rec.completedAt || rec.endTime}</span>
                      </div>
                    </div>

                    {/* Notes if any */}
                    {rec.notes && (
                      <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <span className="font-medium text-slate-500 mr-1">评语/心得:</span>
                        {rec.notes}
                      </div>
                    )}

                    {/* Attached Photos */}
                    {rec.images && rec.images.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-slate-500">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>作业/试卷批改照片 ({rec.images.length}张)</span>
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
                              className="relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-blue-500 transition"
                            >
                              <img
                                src={imgUrl}
                                alt={`作业照片 ${imgIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-150"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                                放大
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-start">
                    <button
                      onClick={() => openEditModal(rec)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="修改作业事项"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-hw-${rec.id}`}
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: '删除作业记录',
                          message: `确定要删除学生「${rec.studentName}」的作业「${rec.taskName}」吗？`,
                          description: '删除后此作业记录及附带照片将从本地数据库彻底清除。',
                          variant: 'danger',
                          onConfirm: async () => {
                            await onDeleteHomework(rec.id);
                          },
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Homework Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>{editingRecord ? '修改作业事项' : '增添作业完成记录'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHomework} className="mt-4 space-y-3.5">
              {/* Student Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  选择学生 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- 请选择学生 --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentNo || '无学号'} - {s.gradeClass || '无班级'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject & Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    学科 (科目) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    日期 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Task Name (完成什么作业事项) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  完成什么作业事项 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例如：二次函数综合大题训练5道、英语阅读真题精读..."
                  value={formTaskName}
                  onChange={(e) => setFormTaskName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Time & Duration Grid: 几点完成的，持续时间多久，结束时间是什么时候 */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>作业时间与时长详情</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      开始时间
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      结束/完成时间
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      持续时间(分钟)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={formDuration}
                      onChange={(e) => handleDurationInputChange(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-700"
                    />
                  </div>
                </div>

                {/* Quick duration presets */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  <span>快捷时长:</span>
                  {[30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleDurationInputChange(mins)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        formDuration === mins
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {mins}分钟
                    </button>
                  ))}
                </div>
              </div>

              {/* Status & Quality */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    完成状态
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="completed">已完成</option>
                    <option value="in_progress">进行中</option>
                    <option value="needs_review">待订正/复盘</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    质量/掌握评级
                  </label>
                  <select
                    value={formQuality}
                    onChange={(e) => setFormQuality(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="A">A 优 (熟练掌握)</option>
                    <option value="B">B 良 (个别小错)</option>
                    <option value="C">C 中 (基本理解)</option>
                    <option value="D">D 需巩固强化</option>
                  </select>
                </div>
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  评语 / 错题要点 / 心得备注 (选填)
                </label>
                <textarea
                  rows={2}
                  placeholder="可记录知识点盲区、错题编号或教师鼓励评语..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                    已选 {formImages.length} 张图片
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {/* Camera Capture Button (Calls native camera on phones/Android) */}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition">
                      <Camera className="w-4 h-4" />
                      <span>拍照拍照</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageFileSelect}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>

                    {/* Album / Photo Library Multi-select */}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition">
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                      <span>相册选择(多选)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFileSelect}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>

                    {isUploadingImage && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 animate-pulse font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>正在压缩优化图片...</span>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Photos Preview List */}
                  {formImages.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200/80">
                      {formImages.map((dataUrl, idx) => (
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
                            title="删除这张照片"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      支持手机直接拍照记录作业、批改卷子，高清自动压缩后保存至本地数据库，无需网络也能查看。
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition"
                >
                  {editingRecord ? '保存修改' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Management Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>学科类别管理</span>
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add new subject input */}
            <form onSubmit={handleAddNewSubject} className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="新学科名称 (如: 编程, 竞赛)"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                required
              />
              <input
                type="color"
                value={newSubjectColor}
                onChange={(e) => setNewSubjectColor(e.target.value)}
                className="w-9 h-8 p-0.5 border border-slate-300 rounded-xl cursor-pointer"
                title="选择学科代表颜色"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 whitespace-nowrap"
              >
                添加
              </button>
            </form>

            {/* Existing Subjects List */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-600 mb-2">当前学科列表：</h4>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="font-semibold text-slate-800">{sub.name}</span>
                    </div>

                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: '删除学科分类',
                          message: `确定要删除学科「${sub.name}」吗？`,
                          description: '删除后已有作业仍会保留原学科名称，但新作业选择列表中将不再出现。',
                          variant: 'danger',
                          onConfirm: async () => {
                            await onDeleteSubject(sub.id);
                          },
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="删除学科"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsSubjectModalOpen(false)}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              完成
            </button>
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

      {/* Homework Photos Fullscreen Lightbox Modal */}
      {lightboxImages && (
        <ImageLightboxModal
          isOpen={true}
          images={lightboxImages}
          initialIndex={lightboxIndex}
          title="作业拍照附件查看"
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
};
