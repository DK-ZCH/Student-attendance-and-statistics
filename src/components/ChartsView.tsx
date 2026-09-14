import React, { useState, useMemo } from 'react';
import {
  Student,
  AttendanceRecord,
  HomeworkRecord,
  SubjectConfig,
} from '../types';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  Users,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

interface ChartsViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  homeworkRecords: HomeworkRecord[];
  subjects: SubjectConfig[];
  onOpenStudentDetail: (student: Student) => void;
}

export const ChartsView: React.FC<ChartsViewProps> = ({
  students,
  attendanceRecords,
  homeworkRecords,
  subjects,
  onOpenStudentDetail,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [pieMetric, setPieMetric] = useState<'duration' | 'count'>('duration');

  // Filter records by time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let startDateStr = '';
    if (timeRange === 'today') {
      startDateStr = todayStr;
    } else if (timeRange === '7days') {
      const d = new Date(now.getTime() - 7 * 86400000);
      startDateStr = d.toISOString().split('T')[0];
    } else if (timeRange === '30days') {
      const d = new Date(now.getTime() - 30 * 86400000);
      startDateStr = d.toISOString().split('T')[0];
    }

    const filteredHw = homeworkRecords.filter((h) => {
      if (timeRange === 'all') return true;
      if (timeRange === 'today') return h.date === todayStr;
      return h.date >= startDateStr;
    });

    const filteredAtt = attendanceRecords.filter((a) => {
      if (timeRange === 'all') return true;
      if (timeRange === 'today') return a.date === todayStr;
      return a.date >= startDateStr;
    });

    return {
      homework: filteredHw,
      attendance: filteredAtt,
    };
  }, [homeworkRecords, attendanceRecords, timeRange]);

  // Subject color map
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((s) => map.set(s.name, s.color));
    return map;
  }, [subjects]);

  const defaultColors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#4b5563'];

  // 1. 饼状图数据 (Pie Chart: 学科耗时与任务分布)
  const pieChartData = useMemo(() => {
    const map = new Map<string, { duration: number; count: number }>();

    filteredData.homework.forEach((hw) => {
      const existing = map.get(hw.subject) || { duration: 0, count: 0 };
      existing.duration += hw.durationMinutes || 0;
      existing.count += 1;
      map.set(hw.subject, existing);
    });

    const result = Array.from(map.entries()).map(([name, val], index) => {
      const color = subjectColorMap.get(name) || defaultColors[index % defaultColors.length];
      return {
        name,
        value: pieMetric === 'duration' ? val.duration : val.count,
        duration: val.duration,
        count: val.count,
        color,
      };
    });

    result.sort((a, b) => b.value - a.value);
    return result;
  }, [filteredData.homework, pieMetric, subjectColorMap]);

  // 2. 柱状图数据 (Bar Chart: 各学生作业耗时对比 & 各学科平均耗时)
  const studentBarData = useMemo(() => {
    const map = new Map<string, { studentId: string; name: string; duration: number; count: number }>();

    filteredData.homework.forEach((hw) => {
      const existing = map.get(hw.studentId) || {
        studentId: hw.studentId,
        name: hw.studentName,
        duration: 0,
        count: 0,
      };
      existing.duration += hw.durationMinutes || 0;
      existing.count += 1;
      map.set(hw.studentId, existing);
    });

    const result = Array.from(map.values()).map((s) => ({
      ...s,
      hours: Number((s.duration / 60).toFixed(1)),
    }));

    result.sort((a, b) => b.duration - a.duration);
    return result.slice(0, 10); // top 10 students
  }, [filteredData.homework]);

  // 3. 折线图数据 (Line Chart: 每日作业完成时长趋势)
  const lineChartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; duration: number; count: number }>();

    filteredData.homework.forEach((hw) => {
      const existing = dateMap.get(hw.date) || { date: hw.date, duration: 0, count: 0 };
      existing.duration += hw.durationMinutes || 0;
      existing.count += 1;
      dateMap.set(hw.date, existing);
    });

    const result = Array.from(dateMap.values()).map((d) => ({
      date: d.date.substring(5), // MM-DD
      fullDate: d.date,
      duration: d.duration,
      hours: Number((d.duration / 60).toFixed(1)),
      count: d.count,
    }));

    result.sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    return result;
  }, [filteredData.homework]);

  // Total summary KPI
  const totalHomeworkMinutes = useMemo(() => {
    return filteredData.homework.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
  }, [filteredData.homework]);

  const totalTasks = filteredData.homework.length;
  const totalAttendanceDays = filteredData.attendance.length;

  // Export aggregated statistics report as CSV/Excel
  const handleExportReport = () => {
    const rangeName =
      timeRange === 'today'
        ? '今日'
        : timeRange === '7days'
        ? '近7天'
        : timeRange === '30days'
        ? '近30天'
        : '全部历史';

    let csvContent = `【学生学业与考勤统计分析报表】\r\n`;
    csvContent += `统计范围,${rangeName}\r\n`;
    csvContent += `导出时间,${new Date().toLocaleString()}\r\n`;
    csvContent += `学生总人数,${students.length} 人\r\n`;
    csvContent += `作业完成总数,${totalTasks} 项\r\n`;
    csvContent += `作业总学时,${(totalHomeworkMinutes / 60).toFixed(1)} 小时\r\n`;
    csvContent += `考勤打卡人次,${totalAttendanceDays} 人次\r\n\r\n`;

    // 1. 各学科统计
    csvContent += `【一、各学科作业与耗时统计】\r\n`;
    csvContent += `学科名称,完成项数,累计耗时(分钟),累计耗时(小时),耗时占比(%)\r\n`;
    pieChartData.forEach((p) => {
      const pct = totalHomeworkMinutes > 0 ? ((p.duration / totalHomeworkMinutes) * 100).toFixed(1) : '0';
      csvContent += `"${p.name}",${p.count},${p.duration},${p.hours},${pct}%\r\n`;
    });
    csvContent += `\r\n`;

    // 2. 学生学业投入统计
    csvContent += `【二、学生学业投入统计榜】\r\n`;
    csvContent += `学生姓名,学号,班级,完成作业项数,作业总时长(分钟),作业总时长(小时),考勤出勤次数\r\n`;
    students.forEach((stu) => {
      const hw = filteredData.homework.filter((h) => h.studentId === stu.id);
      const att = filteredData.attendance.filter((a) => a.studentId === stu.id);
      const dur = hw.reduce((sum, h) => sum + (h.durationMinutes || 0), 0);
      csvContent += `"${stu.name}","${stu.studentNo || ''}","${stu.gradeClass || ''}",${hw.length},${dur},${(dur / 60).toFixed(1)},${att.length}\r\n`;
    });
    csvContent += `\r\n`;

    // 3. 每日趋势
    csvContent += `【三、每日作业耗时趋势】\r\n`;
    csvContent += `日期,作业项数,总时长(分钟),总时长(小时)\r\n`;
    lineChartData.forEach((d) => {
      csvContent += `"${d.fullDate}",${d.count},${d.duration},${d.hours}\r\n`;
    });
    csvContent += `\r\n`;

    // 4. 详细作业明细台账
    csvContent += `【四、作业完成明细台账】\r\n`;
    csvContent += `日期,学生姓名,班级,学科,作业事项,开始时间,结束/完成时间,用时(分钟),完成状态,掌握评级,评语\r\n`;
    filteredData.homework.forEach((h) => {
      csvContent += `"${h.date}","${h.studentName}","${h.gradeClass || ''}","${h.subject}","${(h.title || '').replace(/"/g, '""')}","${h.startTime || ''}","${h.completionTime || ''}",${h.durationMinutes || 0},"${h.status === 'completed' ? '已完成' : '进行中'}","${h.masteryLevel || 'good'}","${(h.teacherNote || '').replace(/"/g, '""')}"\r\n`;
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `学业统计分析报表_${rangeName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Top Banner & Time Range Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              <span>数据统计与图表可视化</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              饼状图、柱状图与折线图多维度展示学科耗时、学生学业投入与每日趋势
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  timeRange === 'today'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                今日
              </button>
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  timeRange === '7days'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                近7天
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  timeRange === '30days'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                近30天
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  timeRange === 'all'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部历史
              </button>
            </div>

            {/* Export Stats Report Button */}
            <button
              id="export-stats-report-btn"
              onClick={handleExportReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              title="导出当前时间段内的各学科、各学生及每日走势完整统计报表"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>导出统计报表</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <div className="text-[11px] font-medium text-blue-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              作业总耗时
            </div>
            <div className="text-xl font-bold text-blue-900 mt-1">
              {(totalHomeworkMinutes / 60).toFixed(1)}{' '}
              <span className="text-xs font-normal text-blue-700">小时</span>
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">
              约 {totalHomeworkMinutes} 分钟
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <div className="text-[11px] font-medium text-indigo-700 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              完成事项数
            </div>
            <div className="text-xl font-bold text-indigo-900 mt-1">
              {totalTasks}{' '}
              <span className="text-xs font-normal text-indigo-700">项</span>
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5">
              涉及 {pieChartData.length} 个学科
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              考勤签到人次
            </div>
            <div className="text-xl font-bold text-emerald-900 mt-1">
              {totalAttendanceDays}{' '}
              <span className="text-xs font-normal text-emerald-700">人次</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              签退完整率高
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              人均作业时长
            </div>
            <div className="text-xl font-bold text-amber-900 mt-1">
              {studentBarData.length > 0
                ? (totalHomeworkMinutes / studentBarData.length / 60).toFixed(1)
                : '0'}{' '}
              <span className="text-xs font-normal text-amber-700">小时/人</span>
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5">
              共有 {studentBarData.length} 人记录
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. 饼状图 (Pie Chart) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">学科占比饼状图</h3>
                <p className="text-[11px] text-slate-400">各学科作业耗时与任务分布</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setPieMetric('duration')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition ${
                  pieMetric === 'duration'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                按时长
              </button>
              <button
                onClick={() => setPieMetric('count')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition ${
                  pieMetric === 'count'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                按任务数
              </button>
            </div>
          </div>

          {pieChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <PieChartIcon className="w-8 h-8 text-slate-300 mb-1" />
              暂无学科作业数据
            </div>
          ) : (
            <div className="pt-3">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any, name: any, item: any) => {
                        if (pieMetric === 'duration') {
                          return [`${val} 分钟 (${(Number(val) / 60).toFixed(1)}小时)`, '作业耗时'];
                        }
                        return [`${val} 项作业`, '任务数量'];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Subject Breakdown List */}
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-xs">
                {pieChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-slate-600 font-bold ml-1">
                      {pieMetric === 'duration' ? `${item.duration}分` : `${item.count}项`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. 柱状图 (Bar Chart: 学生作业耗时排行榜) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">学生作业耗时柱状图</h3>
                <p className="text-[11px] text-slate-400">各学生作业投入时长对比 (小时)</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">前 10 名</span>
          </div>

          {studentBarData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <BarChart3 className="w-8 h-8 text-slate-300 mb-1" />
              暂无学生作业统计
            </div>
          ) : (
            <div className="pt-3">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={studentBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="h" />
                    <RechartsTooltip
                      formatter={(val: any) => [`${val} 小时 (${Number(val) * 60} 分钟)`, '累计作业时长']}
                    />
                    <Bar dataKey="hours" name="作业时长(小时)" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                      {studentBarData.map((_, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={index === 0 ? '#2563eb' : index === 1 ? '#4f46e5' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick links to top students */}
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 whitespace-nowrap text-[11px]">查看详情:</span>
                {studentBarData.slice(0, 5).map((s) => {
                  const stu = students.find((item) => item.id === s.studentId);
                  return (
                    <button
                      key={s.studentId}
                      onClick={() => stu && onOpenStudentDetail(stu)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-md font-medium text-[11px] whitespace-nowrap text-slate-700 transition"
                    >
                      {s.name} ({s.hours}h)
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. 折线图 (Line Chart: 每日作业完成时长趋势) */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">作业完成时长趋势折线图</h3>
              <p className="text-[11px] text-slate-400">每日学业投入与作业总时长变动走势</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            共 {lineChartData.length} 个活跃记录日
          </span>
        </div>

        {lineChartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            <TrendingUp className="w-8 h-8 text-slate-300 mb-1" />
            暂无趋势数据，记录更多作业后将自动绘制折线图
          </div>
        ) : (
          <div className="pt-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineChartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="h" />
                  <RechartsTooltip
                    formatter={(val: any, name: string) => {
                      if (name === 'hours') return [`${val} 小时`, '当日作业总耗时'];
                      return [`${val} 项`, '完成作业事项数'];
                    }}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    name="当日作业时长(小时)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-2">
              <span>起止日期: {lineChartData[0]?.fullDate} ~ {lineChartData[lineChartData.length - 1]?.fullDate}</span>
              <span className="text-emerald-700 font-bold">
                日均耗时: {(totalHomeworkMinutes / Math.max(1, lineChartData.length) / 60).toFixed(1)} 小时
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
