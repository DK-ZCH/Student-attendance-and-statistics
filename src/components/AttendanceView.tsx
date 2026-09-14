import React, { useState, useMemo } from 'react';
import {
  Student,
  AttendanceRecord,
  AttendanceEvent,
} from '../types';
import {
  Search,
  LogIn,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  History,
  PlusCircle,
  Eye,
  Edit2,
  X,
  User,
} from 'lucide-react';

interface AttendanceViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  events: AttendanceEvent[];
  onCheckIn: (studentId: string, studentName: string, customTime?: string, customDate?: string) => Promise<void>;
  onCheckOut: (studentId: string, studentName: string, customTime?: string, customDate?: string) => Promise<void>;
  onOpenStudentDetail: (student: Student) => void;
  onQuickAddHomework: (student: Student) => void;
  onNavigateToRoster: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendanceRecords,
  events,
  onCheckIn,
  onCheckOut,
  onOpenStudentDetail,
  onQuickAddHomework,
  onNavigateToRoster,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'checked_out' | 'not_present'>('all');
  const [showEventDrawer, setShowEventDrawer] = useState(false);

  // Time adjust modal state
  const [timeModalStudent, setTimeModalStudent] = useState<Student | null>(null);
  const [timeModalType, setTimeModalType] = useState<'check_in' | 'check_out'>('check_in');
  const [customTimeInput, setCustomTimeInput] = useState('');

  // Map of studentId -> today's record
  const studentAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach((record) => {
      if (record.date === selectedDate) {
        map.set(record.studentId, record);
      }
    });
    return map;
  }, [attendanceRecords, selectedDate]);

  // Attendance stats for selected date
  const stats = useMemo(() => {
    let checkedIn = 0;
    let checkedOut = 0;
    let inProgress = 0;

    students.forEach((s) => {
      const rec = studentAttendanceMap.get(s.id);
      if (rec) {
        if (rec.status === 'checked_out') {
          checkedOut++;
          checkedIn++;
        } else if (rec.status === 'checked_in') {
          inProgress++;
          checkedIn++;
        }
      }
    });

    const notPresent = Math.max(0, students.length - checkedIn);

    return {
      total: students.length,
      checkedIn,
      inProgress,
      checkedOut,
      notPresent,
    };
  }, [students, studentAttendanceMap]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.gradeClass && student.gradeClass.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const record = studentAttendanceMap.get(student.id);
      const status = record ? record.status : 'not_present';

      if (statusFilter === 'all') return true;
      if (statusFilter === 'checked_in') return status === 'checked_in';
      if (statusFilter === 'checked_out') return status === 'checked_out';
      if (statusFilter === 'not_present') return status === 'not_present';
      return true;
    });
  }, [students, searchQuery, statusFilter, studentAttendanceMap]);

  // Format minutes to readable hours and minutes
  const formatDuration = (mins?: number) => {
    if (mins === undefined || mins === null || mins <= 0) return '0分钟';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}小时${m}分`;
    if (h > 0) return `${h}小时`;
    return `${m}分钟`;
  };

  const handleOpenTimeModal = (student: Student, type: 'check_in' | 'check_out') => {
    setTimeModalStudent(student);
    setTimeModalType(type);
    const now = new Date();
    const currentHHMM = now.toTimeString().substring(0, 5);
    setCustomTimeInput(currentHHMM);
  };

  const handleConfirmCustomTime = async () => {
    if (!timeModalStudent) return;
    if (timeModalType === 'check_in') {
      await onCheckIn(timeModalStudent.id, timeModalStudent.name, customTimeInput, selectedDate);
    } else {
      await onCheckOut(timeModalStudent.id, timeModalStudent.name, customTimeInput, selectedDate);
    }
    setTimeModalStudent(null);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Date & Quick Action Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>考勤日期:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-slate-900 border-none outline-hidden cursor-pointer"
              />
            </div>
            {selectedDate !== new Date().toISOString().split('T')[0] && (
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs text-blue-600 hover:underline px-2 py-1"
              >
                回到今日
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEventDrawer(!showEventDrawer)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
              title="查看签到签退实时流水事件"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>签到流水事件 ({events.length})</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-100">
          <div
            onClick={() => setStatusFilter('all')}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                : 'bg-slate-50/70 border-slate-200/60 hover:bg-slate-100'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-500">应到总人数</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.total} <span className="text-xs font-normal text-slate-500">人</span></div>
          </div>

          <div
            onClick={() => setStatusFilter('checked_in')}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
              statusFilter === 'checked_in'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              在场学习中
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{stats.inProgress} <span className="text-xs font-normal text-emerald-600">人</span></div>
          </div>

          <div
            onClick={() => setStatusFilter('checked_out')}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
              statusFilter === 'checked_out'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                : 'bg-blue-50/40 border-blue-100 hover:bg-blue-50'
            }`}
          >
            <div className="text-[11px] font-medium text-blue-700">今日已签退</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5">{stats.checkedOut} <span className="text-xs font-normal text-blue-600">人</span></div>
          </div>

          <div
            onClick={() => setStatusFilter('not_present')}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
              statusFilter === 'not_present'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-amber-50/40 border-amber-100 hover:bg-amber-50'
            }`}
          >
            <div className="text-[11px] font-medium text-amber-700">尚未签到</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{stats.notPresent} <span className="text-xs font-normal text-amber-600">人</span></div>
          </div>
        </div>
      </div>

      {/* Events Timeline Drawer (Collapsible) */}
      {showEventDrawer && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">签到签退事件流水记录</h3>
            </div>
            <button
              onClick={() => setShowEventDrawer(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {events.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">暂无签到或签退事件记录</div>
          ) : (
            <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-50">
              {events.slice(0, 30).map((ev) => (
                <div key={ev.id} className="pt-2 flex items-start justify-between text-xs">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ev.type === 'check_in'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ev.type === 'check_in' ? '签到' : '签退'}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{ev.studentName}</span>
                      <span className="text-slate-500 ml-1.5">{ev.note || (ev.type === 'check_in' ? '完成签到' : '完成签退')}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{ev.date} {ev.timeStr}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索学生姓名、学号、班级..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            全部 ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('checked_in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'checked_in'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            在场中 ({stats.inProgress})
          </button>
          <button
            onClick={() => setStatusFilter('checked_out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'checked_out'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            已签退 ({stats.checkedOut})
          </button>
          <button
            onClick={() => setStatusFilter('not_present')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              statusFilter === 'not_present'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            未签到 ({stats.notPresent})
          </button>
        </div>
      </div>

      {/* Student List Cards */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {students.length === 0 ? '暂无学生名单' : '未找到匹配学生'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {students.length === 0
              ? '请先前往「学生名单」页面一键导入或手动添加学生名单。'
              : '请尝试修改搜索词或状态筛选条件。'}
          </p>
          {students.length === 0 && (
            <button
              onClick={onNavigateToRoster}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
            >
              前往导入学生名单
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents.map((student) => {
            const record = studentAttendanceMap.get(student.id);
            const isCheckedIn = record?.status === 'checked_in';
            const isCheckedOut = record?.status === 'checked_out';
            const notPresent = !record || record.status === 'not_present';

            return (
              <div
                key={student.id}
                id={`student-card-${student.id}`}
                className={`bg-white rounded-2xl p-3.5 border transition-all duration-150 relative ${
                  isCheckedIn
                    ? 'border-emerald-300 ring-1 ring-emerald-500/10 shadow-xs'
                    : isCheckedOut
                    ? 'border-blue-200 shadow-2xs'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Header: Student basic info */}
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => onOpenStudentDetail(student)}
                    className="cursor-pointer group flex items-center gap-2.5"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs transition group-hover:scale-105 ${
                        isCheckedIn
                          ? 'bg-emerald-600'
                          : isCheckedOut
                          ? 'bg-blue-600'
                          : 'bg-slate-400'
                      }`}
                    >
                      {student.name.substring(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                          {student.name}
                        </span>
                        {student.gradeClass && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {student.gradeClass}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        学号: {student.studentNo || '未分配'}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCheckedIn && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        在场自习
                      </span>
                    )}
                    {isCheckedOut && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        已签退
                      </span>
                    )}
                    {notPresent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3 text-slate-400" />
                        未签到
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamps & Duration Display */}
                <div className="mt-3 py-2 px-2.5 bg-slate-50/80 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <LogIn className="w-3 h-3 text-emerald-600" />
                      签到时间:
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {record?.checkInTime || '--:--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <LogOut className="w-3 h-3 text-blue-600" />
                      签退时间:
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {record?.checkOutTime || (isCheckedIn ? '在场中...' : '--:--')}
                    </span>
                  </div>

                  {(record?.durationMinutes !== undefined || isCheckedIn) && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-slate-700 font-medium">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        在场耗时:
                      </span>
                      <span className="font-bold text-indigo-700">
                        {isCheckedOut
                          ? formatDuration(record?.durationMinutes)
                          : '正在统计中...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Check-In Button */}
                    {!isCheckedIn && !isCheckedOut && (
                      <button
                        onClick={() => onCheckIn(student.id, student.name, undefined, selectedDate)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>签到</span>
                      </button>
                    )}

                    {/* Check-Out Button */}
                    {isCheckedIn && (
                      <button
                        onClick={() => onCheckOut(student.id, student.name, undefined, selectedDate)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>签退</span>
                      </button>
                    )}

                    {/* If already checked out, allow re-check in or edit */}
                    {isCheckedOut && (
                      <button
                        onClick={() => handleOpenTimeModal(student, 'check_in')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                        title="修改签到签退时间"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>改时间</span>
                      </button>
                    )}

                    {/* Specific time adjust button */}
                    {!isCheckedOut && (
                      <button
                        onClick={() => handleOpenTimeModal(student, isCheckedIn ? 'check_out' : 'check_in')}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                        title="自定义签到/签退时间"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick Add Homework for this student */}
                    <button
                      onClick={() => onQuickAddHomework(student)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold transition"
                      title="为该学生添加作业记录"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>加作业</span>
                    </button>

                    {/* Open dedicated student detail page */}
                    <button
                      onClick={() => onOpenStudentDetail(student)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="打开独立详情页面"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for adjusting specific check-in / check-out time */}
      {timeModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                指定{timeModalType === 'check_in' ? '签到' : '签退'}时间
              </h3>
              <button
                onClick={() => setTimeModalStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-600">
                学生：<strong className="text-slate-900">{timeModalStudent.name}</strong> ({timeModalStudent.gradeClass || '无班级'})
              </div>
              <div className="text-xs text-slate-600">
                考勤日期：<span className="font-mono text-slate-800">{selectedDate}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  选择时间 (时:分)
                </label>
                <input
                  type="time"
                  value={customTimeInput}
                  onChange={(e) => setCustomTimeInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  onClick={() => setTimeModalStudent(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmCustomTime}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition"
                >
                  确认记录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
