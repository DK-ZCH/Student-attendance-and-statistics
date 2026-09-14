import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  WifiOff, 
  Sparkles, 
  X, 
  Layers, 
  ExternalLink,
  PackageCheck,
  Terminal,
  FileCode2,
  FolderArchive,
  Copy,
  Check
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'apk' | 'pwa';
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ 
  isOpen, 
  onClose,
  defaultTab = 'apk'
}) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa'>(defaultTab);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>安卓手机端安装与 APK 打包</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">
                  已配置原生工程
                </span>
              </h3>
              <p className="text-xs text-slate-500">标准 Android Studio 工程 · GitHub 自动编译 · PWA 极速安装</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mt-3 shrink-0">
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>打包标准 Android APK</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>手机桌面秒装 (免编译)</span>
          </button>
        </div>

        {/* TAB 1: APK PACKAGING */}
        {activeTab === 'apk' && (
          <div className="mt-4 space-y-4 text-xs">
            {/* Status overview */}
            <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>已完成标准 Android 原生工程的初始化与配置</span>
              </div>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                本项目已成功集成 <strong>Capacitor</strong> 原生容器架构，在根目录下生成了完整的 <code>/android</code> 工程目录，包含标准 <code>AndroidManifest.xml</code>、Java 主活动、相机及相册存储权限，以及全套离线 Web 前端静态打包文件。
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-blue-950">
                <span className="bg-blue-100/80 px-2 py-0.5 rounded font-mono">包名: com.school.attendance</span>
                <span className="bg-blue-100/80 px-2 py-0.5 rounded">应用名: 学生签到与学业统计</span>
                <span className="bg-blue-100/80 px-2 py-0.5 rounded">离线存储: 本地 IndexedDB</span>
              </div>
            </div>

            {/* Packaging options */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span>生成与获取 APK 安装包的 3 种方式：</span>
              </h4>

              {/* Clarification on AI Studio Export Menu */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-[11px] text-amber-900">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span>💡 常见疑问：「Export to ZIP」或「Export to GitHub」在哪里？</span>
                </div>
                <p className="leading-relaxed text-amber-800">
                  这两个选项<strong>不在网页内部</strong>，而是在 <strong>Google AI Studio 最顶部的页面栏</strong>（整个浏览器界面的右上角）：
                </p>
                <div className="pl-3 border-l-2 border-amber-300 space-y-0.5 text-amber-900 font-medium">
                  <div>1. 看浏览器最顶栏右侧（在蓝色的「Share」或「Deploy」按钮附近）；</div>
                  <div>2. 点击 <strong>「⚙️ 设置 (Settings)」</strong> 图标或 <strong>「··· (更多操作)」</strong> 图标；</div>
                  <div>3. 在弹出的菜单列表中即可看到 <strong>「Export to GitHub」</strong> 或 <strong>「Download as ZIP」</strong>。</div>
                </div>
              </div>

              {/* Option 1: GitHub Actions CI/CD */}
              <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <span>方式一：GitHub Actions 云端 0 配置全自动打包（最省心）</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">推荐</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  项目中已预先创建好 <code>.github/workflows/build-apk.yml</code> 自动构建配置文件。
                </p>
                <div className="space-y-1.5 pl-6 text-[11px] text-slate-600">
                  <p>① 在 AI Studio 右上角设置菜单中点击 <strong>"Export to GitHub"</strong> 将代码导出到你的 GitHub 仓库；</p>
                  <p>② 仓库中会自动触发 <strong>Build Android APK</strong> 工作流，在云端 Ubuntu 上自动下载 Android SDK 并编译出 <code>app-debug.apk</code>；</p>
                  <p>③ 编译完成后，在 GitHub Actions 页面直接点击 <strong>Artifacts</strong> 即可下载 APK 安装包发送到手机安装！</p>
                </div>
              </div>

              {/* Option 2: Local One-Click Script */}
              <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <span>方式二：本地电脑一键脚本打包（或 Android Studio 打开）</span>
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  如果在本地电脑（Mac、Windows 或 Linux）上安装了 Android Studio 或 JDK：
                </p>
                <div className="relative p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto">
                  <code>
                    # 1. 导出项目后解压，在终端运行打包脚本：<br />
                    ./build-android-apk.sh<br /><br />
                    # 或在 Android Studio 中直接打开 android/ 文件夹，<br />
                    # 点击菜单：Build → Build Bundle(s) / APK(s) → Build APK(s)
                  </code>
                  <button
                    onClick={() => handleCopy('./build-android-apk.sh', 'script')}
                    className="absolute top-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1"
                  >
                    {copiedCommand === 'script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>复制</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  生成的 APK 位于：<code>android/app/build/outputs/apk/debug/app-debug.apk</code>
                </p>
              </div>

              {/* Option 3: PWABuilder */}
              <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <span>方式三：PWABuilder 在线 1 键打包生成 APK</span>
                  </span>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <span>打开官网</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  微软官方提供的免费打包工具 <strong>PWABuilder</strong>。输入当前系统的线上网址，点击 <strong>Package for Android</strong>，即可在线直接下载已签名的 APK 安装包或 Google Play 上架包。
                </p>
              </div>
            </div>

            {/* Sync script tips */}
            <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800">已配置的 npm 快捷指令：</span>
              <div className="font-mono text-[10px] text-slate-700 space-y-0.5">
                <div>• <code>npm run android:sync</code> - 前端编译并同步至 Android 工程</div>
                <div>• <code>npm run android:open</code> - 在本地 Android Studio 中打开工程</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PWA MOBILE QUICK INSTALL */}
        {activeTab === 'pwa' && (
          <div className="mt-4 space-y-4 text-xs">
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">
                  无需下载 APK 文件的手机秒级安装方案
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                本项目基于 <strong>PWA + 本地数据库</strong> 构建。在安卓手机（Chrome、Edge 或自带浏览器）打开本系统后，可直接在桌面生成专属独立 App 图标，拥有<strong>无浏览器地址栏的全屏沉浸体验</strong>，即使断网或飞行模式下也能秒开使用！
              </p>
            </div>

            {/* One-click install if supported */}
            {isInstallable && (
              <div>
                <button
                  onClick={async () => {
                    await install();
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  <span>一键安装到安卓手机桌面</span>
                </button>
              </div>
            )}

            {/* 3 Step Guide */}
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-800">主流安卓浏览器 3 秒安装步骤：</h4>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-800">手机浏览器打开本网址</strong>
                  <p className="text-slate-500 mt-0.5">
                    推荐使用 Chrome、Edge 或手机自带浏览器，点击右上角或底部的菜单图标 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-bold">⋮</code>。
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-800">点击「添加到主屏幕」或「安装应用」</strong>
                  <p className="text-slate-500 mt-0.5">
                    系统将弹出快捷安装提示，点击确认添加。
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-slate-800">从手机桌面图标直接启动</strong>
                  <p className="text-slate-500 mt-0.5">
                    手机桌面生成专属高清应用图标，点击进入是独立的无边框全屏界面，与 APK 体验完全一致！
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="pt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <WifiOff className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">100% 离线可用</div>
                <div className="text-[10px] text-slate-400">无网正常签到记录</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">本地隐私存储</div>
                <div className="text-[10px] text-slate-400">数据保存在手机内置库</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <Layers className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <div className="font-bold text-slate-800 text-[11px]">支持拍照上传</div>
                <div className="text-[10px] text-slate-400">自动压缩存入本地库</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-bold transition"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
