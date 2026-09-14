import React, { useState, useMemo } from 'react';
import {
  Student,
  AttendanceRecord,
  HomeworkRecord,
} from '../types';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  Edit2,
  Trash2,
  Eye,
  FileText,
  CheckCircle2,
  PlusCircle,
  X,
  Sparkles,
  Phone,
  CheckSquare,
  Square,
  AlertOctagon,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface StudentRosterViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  homeworkRecords: HomeworkRecord[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<Student>;
  onBatchImportStudents: (students: Array<Omit<Student, 'id' | 'createdAt'>>) => Promise<void>;
  onUpdateStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onBatchDeleteStudents?: (ids: string[]) => Promise<void>;
  onClearSampleStudents?: () => Promise<void>;
  onOpenStudentDetail: (student: Student) => void;
  onQuickAddHomework: (student: Student) => void;
  onLoadSampleData: () => Promise<void>;
}

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({
  students,
  attendanceRecords,
  homeworkRecords,
  onAddStudent,
  onBatchImportStudents,
  onUpdateStudent,
  onDeleteStudent,
  onBatchDeleteStudents,
  onClearSampleStudents,
  onOpenStudentDetail,
  onQuickAddHomework,
  onLoadSampleData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Batch selection state
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    description?: string;
    variant: 'danger' | 'warning';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    onConfirm: async () => {},
  });

  // Modals
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single form state
  const [name, setName] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [gradeClass, setGradeClass] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Batch import text state
  const [batchText, setBatchText] = useState('');

  // Unique classes for filter
  const classesList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.gradeClass && s.gradeClass.trim()) {
        set.add(s.gradeClass.trim());
      }
    });
    return Array.from(set);
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'all' && s.gradeClass !== selectedClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNo = s.studentNo.toLowerCase().includes(q);
        const matchClass = (s.gradeClass || '').toLowerCase().includes(q);
        if (!matchName && !matchNo && !matchClass) return false;
      }
      return true;
    });
  }, [students, selectedClass, searchQuery]);

  // Batch selection helpers
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const promptSingleDelete = (student: Student, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: '删除学生确认',
      message: `确定要删除学生「${student.name}」吗？`,
      description: '删除后将同时清理该学生的考勤签到流水与作业事项记录，此操作不可撤销。',
      variant: 'danger',
      onConfirm: async () => {
        await onDeleteStudent(student.id);
        setSelectedIds((prev) => prev.filter((id) => id !== student.id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const promptBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: '批量删除学生确认',
      message: `确定要永久删除已选中的 ${selectedIds.length} 名学生吗？`,
      description: '所选学生的全部作业记录与考勤签到记录也将一并彻底移除。',
      variant: 'danger',
      onConfirm: async () => {
        if (onBatchDeleteStudents) {
          await onBatchDeleteStudents(selectedIds);
        } else {
          for (const id of selectedIds) {
            await onDeleteStudent(id);
          }
        }
        setSelectedIds([]);
        setIsBatchMode(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const promptClearSample = () => {
    setConfirmModal({
      isOpen: true,
      title: '清空测试数据确认',
      message: `确定要清空全部 ${students.length} 名测试学生名单吗？`,
      description: '此操作将清空当前测试学生、考勤及作业数据，以便您导入或添加真实的正式学生名单。',
      variant: 'danger',
      onConfirm: async () => {
        if (onClearSampleStudents) {
          await onClearSampleStudents();
        } else {
          const allIds = students.map((s) => s.id);
          for (const id of allIds) {
            await onDeleteStudent(id);
          }
        }
        setSelectedIds([]);
        setIsBatchMode(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Open add / edit modal
  const openSingleModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setName(student.name);
      setStudentNo(student.studentNo);
      setGradeClass(student.gradeClass);
      setPhone(student.phone || '');
      setNotes(student.notes || '');
    } else {
      setEditingStudent(null);
      setName('');
      // Auto suggest studentNo
      setStudentNo(`2024${(students.length + 1).toString().padStart(2, '0')}`);
      setGradeClass(classesList[0] || '初二(1)班');
      setPhone('');
      setNotes('');
    }
    setIsSingleModalOpen(true);
  };

  // Save single student
  const handleSaveSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingStudent) {
      await onUpdateStudent({
        ...editingStudent,
        name: name.trim(),
        studentNo: studentNo.trim(),
        gradeClass: gradeClass.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      });
    } else {
      await onAddStudent({
        name: name.trim(),
        studentNo: studentNo.trim() || `2024${(students.length + 1).toString().padStart(2, '0')}`,
        gradeClass: gradeClass.trim() || '未分班',
        phone: phone.trim(),
        notes: notes.trim(),
      });
    }
    setIsSingleModalOpen(false);
  };

  // Handle batch import parse
  const handleParseBatchImport = async () => {
    if (!batchText.trim()) {
      alert('请粘贴或输入名单内容');
      return;
    }

    const lines = batchText.split('\n');
    const parsed: Array<Omit<Student, 'id' | 'createdAt'>> = [];

    let autoNo = students.length + 1;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      // Check if comma or tab separated
      const parts = line.split(/[,，\t\s]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 1) {
        const studentName = parts[0];
        // Check if looks like a header
        if (studentName === '姓名' || studentName === 'name') continue;

        const stuNo = parts[1] || `2024${(autoNo++).toString().padStart(2, '0')}`;
        const stuClass = parts[2] || '未分班';
        const stuPhone = parts[3] || '';
        const stuNotes = parts.slice(4).join(' ') || '';

        parsed.push({
          name: studentName,
          studentNo: stuNo,
          gradeClass: stuClass,
          phone: stuPhone,
          notes: stuNotes,
        });
      }
    }

    if (parsed.length === 0) {
      alert('未能识别到有效的学生姓名，请确认格式');
      return;
    }

    await onBatchImportStudents(parsed);
    setBatchText('');
    setIsBatchModalOpen(false);
    alert(`成功导入 ${parsed.length} 名学生！`);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBatchText(content);
        setIsBatchModalOpen(true);
      }
    };
    reader.readAsText(file);
  };

  // Download template
  const downloadTemplate = () => {
    const content = `姓名,学号,班级,电话,备注\n张伟,202401,初二(1)班,13800138000,数学课代表\n王芳,202402,初二(1)班,13800138001,英语流利\n李强,202403,初二(2)班,13800138002,物理思维好`;
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '学生名单导入模板.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>学生名单管理与导入</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              支持一键批量导入、班级分类、编辑档案与个人独立学业主页
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {students.length > 0 && (
              <>
                <button
                  id="batch-mode-toggle-btn"
                  onClick={() => {
                    setIsBatchMode(!isBatchMode);
                    if (isBatchMode) setSelectedIds([]);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    isBatchMode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{isBatchMode ? '退出批量' : '批量管理'}</span>
                </button>

                <button
                  id="clear-sample-btn"
                  onClick={promptClearSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition"
                  title="清空测试学生数据，便于录入或导入真实班级学生"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>清空测试数据</span>
                </button>
              </>
            )}

            {students.length === 0 && (
              <button
                onClick={onLoadSampleData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition"
                title="载入示例学生与作业数据"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>载入示例数据</span>
              </button>
            )}

            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition"
              title="支持多行文字或CSV快速导入名单"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>批量导入名单</span>
            </button>

            <button
              onClick={() => openSingleModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>新增学生</span>
            </button>
          </div>
        </div>

        {/* Batch Selection Action Bar */}
        {isBatchMode && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between flex-wrap gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-blue-400" />
                )}
                <span>
                  {selectedIds.length === filteredStudents.length && filteredStudents.length > 0
                    ? '取消全选'
                    : '全选当前'}
                </span>
              </button>
              <span className="text-xs text-blue-800">
                已选中 <strong className="text-blue-950 font-bold">{selectedIds.length}</strong> / {filteredStudents.length} 人
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="batch-delete-btn"
                onClick={promptBatchDelete}
                disabled={selectedIds.length === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition ${
                  selectedIds.length > 0
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                    : 'bg-rose-300 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>批量删除 ({selectedIds.length})</span>
              </button>

              <button
                onClick={() => {
                  setIsBatchMode(false);
                  setSelectedIds([]);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
              >
                完成
              </button>
            </div>
          </div>
        )}

        {/* Search & Class Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="快速搜索学生姓名、学号、班级..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">所有班级 (全部 {students.length} 人)</option>
              {classesList.map((c) => {
                const count = students.filter((s) => s.gradeClass === c).length;
                return (
                  <option key={c} value={c}>
                    {c} ({count}人)
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">
            {students.length === 0 ? '还没有学生名单' : '未找到匹配学生'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {students.length === 0
              ? '点击「批量导入名单」直接粘贴学生名字，或载入全真演示数据快速体验。'
              : '请尝试修改搜索词或重置班级筛选条件。'}
          </p>
          {students.length === 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
              >
                立即导入名单
              </button>
              <button
                onClick={onLoadSampleData}
                className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold rounded-xl"
              >
                载入演示数据
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents.map((student) => {
            // Stats for this student
            const attCount = attendanceRecords.filter((a) => a.studentId === student.id).length;
            const hwList = homeworkRecords.filter((h) => h.studentId === student.id);
            const hwDurationTotal = hwList.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
            const isSelected = selectedIds.includes(student.id);

            return (
              <div
                key={student.id}
                id={`roster-card-${student.id}`}
                onClick={(e) => {
                  if (isBatchMode) {
                    handleToggleSelect(student.id, e);
                  }
                }}
                className={`bg-white rounded-2xl p-3.5 border transition group ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/20'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
                } ${isBatchMode ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Checkbox for batch mode */}
                    {isBatchMode && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelect(student.id, e)}
                        className="text-blue-600 shrink-0 p-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-50" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                    )}

                    <div
                      onClick={(e) => {
                        if (isBatchMode) {
                          handleToggleSelect(student.id, e);
                        } else {
                          onOpenStudentDetail(student);
                        }
                      }}
                      className="cursor-pointer group flex items-center gap-2.5 flex-1 min-w-0"
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition shrink-0">
                        {student.name.substring(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition truncate">
                            {student.name}
                          </span>
                          {student.gradeClass && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded">
                              {student.gradeClass}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          学号: {student.studentNo || '未分配'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isBatchMode && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSingleModal(student);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                        title="编辑学生资料"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-student-btn-${student.id}`}
                        onClick={(e) => promptSingleDelete(student, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                        title="删除学生"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info snippet */}
                {student.notes && (
                  <div className="mt-2 text-xs text-slate-500 truncate bg-slate-50 px-2 py-1 rounded-md">
                    备注: {student.notes}
                  </div>
                )}

                {/* Quick stats bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50 rounded-lg p-1.5">
                    <div className="text-[10px] text-slate-400">考勤签到</div>
                    <div className="font-bold text-slate-800">{attCount} 次</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-1.5">
                    <div className="text-[10px] text-slate-400">作业总学时</div>
                    <div className="font-bold text-blue-700">
                      {(hwDurationTotal / 60).toFixed(1)} 小时
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onQuickAddHomework(student)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>加作业</span>
                  </button>

                  <button
                    onClick={() => onOpenStudentDetail(student)}
                    className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>独立主页</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Single Student Add / Edit */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{editingStudent ? '编辑学生信息' : '新增学生'}</span>
              </h3>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleStudent} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  学生姓名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="如：张子轩"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    学号 / 编号
                  </label>
                  <input
                    type="text"
                    placeholder="如：202401"
                    value={studentNo}
                    onChange={(e) => setStudentNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    班级 / 年级
                  </label>
                  <input
                    type="text"
                    placeholder="如：初二(3)班"
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  家长联系电话 (选填)
                </label>
                <input
                  type="tel"
                  placeholder="如：13800138000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  学生备注 (选填)
                </label>
                <input
                  type="text"
                  placeholder="如：擅长数学与物理、需多关注英语..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="flex-1 py-2 border rounded-xl text-xs font-semibold text-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {editingStudent ? '保存修改' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Import Modal (批量名单导入) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <span>批量导入学生名单</span>
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="text-xs text-slate-600 leading-relaxed bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                <strong className="text-indigo-900">支持格式说明：</strong>
                <p className="mt-1">
                  1. 每行一个名字，如：<code className="bg-white px-1 py-0.5 rounded text-indigo-700 font-mono">张三</code>
                </p>
                <p>
                  2. 包含多字段，逗号或空格隔开：<code className="bg-white px-1 py-0.5 rounded text-indigo-700 font-mono">张三, 202401, 初二(1)班, 13800000000</code>
                </p>
              </div>

              {/* Upload file or Download template */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <label className="cursor-pointer inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>上传 CSV/TXT 文件</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载Excel/CSV模板</span>
                </button>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  rows={8}
                  placeholder={`粘贴学生名单到此处，例如：
张子轩, 202401, 初二(3)班
李雨桐, 202402, 初二(3)班
王嘉尔, 202403, 初二(1)班
赵梓涵, 202404, 初二(2)班`}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-semibold text-slate-700"
                >
                  取消
                </button>
                <button
                  onClick={handleParseBatchImport}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  解析并导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-app Confirmation Modal (Never blocked by iframe/browser) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        description={confirmModal.description}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
