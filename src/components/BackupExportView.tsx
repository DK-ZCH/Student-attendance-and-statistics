import React, { useState } from 'react';
import {
  Student,
  AttendanceRecord,
  HomeworkRecord,
  AttendanceEvent,
  SubjectConfig,
  AppDatabaseBackup,
} from '../types';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  PackageCheck,
  FileCode2,
} from 'lucide-react';
import { AndroidInstallModal } from './AndroidInstallModal';

interface BackupExportViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  homeworkRecords: HomeworkRecord[];
  events: AttendanceEvent[];
  subjects: SubjectConfig[];
  onExportFullBackup: () => Promise<AppDatabaseBackup>;
  onImportFullBackup: (backup: AppDatabaseBackup, overwrite: boolean) => Promise<void>;
  onLoadSampleData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
}

export const BackupExportView: React.FC<BackupExportViewProps> = ({
  students,
  attendanceRecords,
  homeworkRecords,
  events,
  subjects,
  onExportFullBackup,
  onImportFullBackup,
  onLoadSampleData,
  onClearAllData,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [modalTab, setModalTab] = useState<'apk' | 'pwa'>('apk');

  // 1. Export Full Statistical CSV Report
  const handleExportFullCSV = () => {
    const today = new Date().toISOString().split('T')[0];

    // Compute student aggregate stats
    const rows: string[][] = [
      ['学生学业作业与考勤统计总报表'],
      ['导出日期', today, '生成系统', '学生签到与学业统计本地App'],
      [],
      ['【一、学生学业与考勤总览】'],
      ['学号', '姓名', '班级', '累计考勤天数', '作业完成数', '作业累计总时长(小时)', '作业总时长(分钟)', '联系电话', '备注'],
    ];

    students.forEach((s) => {
      const studentAtt = attendanceRecords.filter((a) => a.studentId === s.id);
      const studentHw = homeworkRecords.filter((h) => h.studentId === s.id);
      const attDays = new Set(studentAtt.map((a) => a.date)).size;
      const totalHwMins = studentHw.reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);

      rows.push([
        s.studentNo || '',
        s.name,
        s.gradeClass || '',
        attDays.toString(),
        studentHw.length.toString(),
        (totalHwMins / 60).toFixed(1),
        totalHwMins.toString(),
        s.phone || '',
        `"${(s.notes || '').replace(/"/g, '""')}"`,
      ]);
    });

    rows.push([]);
    rows.push(['【二、全部作业事项明细记录】']);
    rows.push(['日期', '学生姓名', '学号', '学科', '完成作业事项', '开始时间', '结束时间', '完成时间', '持续时长(分钟)', '完成状态', '掌握评级', '心得与评语']);

    homeworkRecords.forEach((h) => {
      const stu = students.find((s) => s.id === h.studentId);
      rows.push([
        h.date,
        h.studentName,
        stu?.studentNo || '',
        h.subject,
        `"${h.taskName.replace(/"/g, '""')}"`,
        h.startTime || '',
        h.endTime || '',
        h.completedAt || '',
        (h.durationMinutes || 0).toString(),
        h.status === 'completed' ? '已完成' : h.status === 'in_progress' ? '进行中' : '待订正',
        h.scoreOrQuality || '',
        `"${(h.notes || '').replace(/"/g, '""')}"`,
      ]);
    });

    rows.push([]);
    rows.push(['【三、考勤签到签退流水日志】']);
    rows.push(['日期', '学生姓名', '签到时间', '签退时间', '在场时长(分钟)', '状态', '考勤备注']);

    attendanceRecords.forEach((a) => {
      rows.push([
        a.date,
        a.studentName,
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
    link.setAttribute('download', `学业与考勤综合统计报表_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Export Full JSON Database Backup
  const handleExportJSON = async () => {
    setIsProcessing(true);
    try {
      const backup = await onExportFullBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.setAttribute('download', `本地数据库全量备份_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Restore Database from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData: AppDatabaseBackup = JSON.parse(text);

        if (!backupData.students || !Array.isArray(backupData.students)) {
          alert('无效的备份文件格式');
          return;
        }

        const confirmOverwrite = confirm(
          `备份包含：\n- ${backupData.students.length} 名学生\n- ${backupData.homework?.length || 0} 条作业记录\n- ${backupData.attendance?.length || 0} 条考勤记录\n\n点击「确定」完全覆盖当前数据库，点击「取消」将备份数据与现有数据合并。`
        );

        setIsProcessing(true);
        await onImportFullBackup(backupData, confirmOverwrite);
        setImportStatus('数据库恢复成功！');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err) {
        alert('解析备份文件失败，请检查文件是否正确。');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  // 4. Clear data
  const handleClear = async () => {
    if (confirm('警告：此操作将清空本地数据库中的所有学生、签到与作业记录！\n建议在清空前先下载备份。\n\n确定要继续清空吗？')) {
      if (confirm('请再次确认：清空后将无法撤销！')) {
        await onClearAllData();
        alert('本地数据库已重置清空');
      }
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              数据管理、报表导出与本地数据库备份
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              纯本地数据库存储，无需联网或后端服务器，数据私密安全且支持秒级导出
            </p>
          </div>
        </div>

        {/* Database Health Card */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                本地存储引擎：IndexedDB + 离线缓存
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              零服务器依赖 / 本地运行
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-center text-xs">
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <div className="text-[10px] text-slate-400">学生总数</div>
              <div className="text-base font-bold text-slate-800">{students.length} 人</div>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <div className="text-[10px] text-slate-400">作业记录</div>
              <div className="text-base font-bold text-blue-600">{homeworkRecords.length} 条</div>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <div className="text-[10px] text-slate-400">考勤记录</div>
              <div className="text-base font-bold text-indigo-600">{attendanceRecords.length} 条</div>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <div className="text-[10px] text-slate-400">流水事件</div>
              <div className="text-base font-bold text-emerald-600">{events.length} 次</div>
            </div>
          </div>
        </div>
      </div>

      {/* 核心重点：手机端安装与 Android APK 打包 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-xs">
                <Smartphone className="w-5 h-5 text-white" />
              </span>
              <h3 className="text-base font-bold">安卓手机客户端安装与 APK 打包下载</h3>
              <span className="text-[10px] bg-emerald-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full">
                原生工程已生成
              </span>
            </div>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              支持直接生成 Android 原生 APK 安装包，也支持手机浏览器一键免编译添加到桌面（支持断网完全离线打卡、拍照保存与本地数据库存储）。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              id="open-apk-modal-btn"
              onClick={() => {
                setModalTab('apk');
                setShowInstallModal(true);
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4 text-blue-600" />
              <span>打包获取 Android APK</span>
            </button>
            <button
              id="open-pwa-modal-btn"
              onClick={() => {
                setModalTab('pwa');
                setShowInstallModal(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-blue-500/40 hover:bg-blue-500/60 border border-white/30 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>手机桌面一键秒装</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: 统计报表导出 (Excel / CSV) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>导出学业与考勤综合统计报表</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            一键将全量学生名单、各学科作业完成明细、持续时长、评语心得以及签到签退流水整理为带 BOM 编码的 CSV / Excel 报表，可直接使用 Excel 或 WPS 打开分析。
          </p>

          <button
            id="export-csv-btn"
            onClick={handleExportFullCSV}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>立即下载综合统计报表 (.csv)</span>
          </button>
        </div>

        {/* Card 2: 本地数据库全量备份 (.json) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <Database className="w-4 h-4 text-blue-600" />
            <span>本地数据库完整备份与恢复</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            将当前手机或电脑上的所有学生数据、学科设置与作业流水导出为结构化 JSON 备份文件，方便更换设备或数据迁移。
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              id="export-json-btn"
              onClick={handleExportJSON}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出整库备份</span>
            </button>

            <label className="flex-1 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>从备份恢复</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg text-center animate-in fade-in">
              {importStatus}
            </div>
          )}
        </div>

        {/* Card 3: 演示体验数据 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>载入示例演示数据</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            为初次使用的用户提供真实的学生打卡记录、多学科作业事项和图表数据，方便快速体验饼状图、柱状图、折线图及独立详情页。
          </p>

          <button
            onClick={async () => {
              if (confirm('载入示例演示数据将添加预设的学生与考勤作业记录，是否继续？')) {
                await onLoadSampleData();
                alert('示例数据载入成功！');
              }
            }}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>一键载入真实示例数据</span>
          </button>
        </div>

        {/* Card 4: 重置与清空 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>清空重置本地数据库</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            清空浏览器本地数据库中存储的所有学生名单、签到记录与作业记录。请谨慎操作，建议先导出备份。
          </p>

          <button
            onClick={handleClear}
            className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空重置本地数据</span>
          </button>
        </div>
      </div>

      <AndroidInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        defaultTab={modalTab}
      />
    </div>
  );
};
