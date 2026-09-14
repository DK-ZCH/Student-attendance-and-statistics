import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidInstallModal } from './AndroidInstallModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        {isInstalled ? (
          <button
            onClick={() => setShowAndroidModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
            title="已添加到手机，点击查看打包与离线配置"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>已安装 · 查看设置</span>
          </button>
        ) : (
          <button
            id="download-app-btn"
            onClick={() => setShowAndroidModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs transition-all whitespace-nowrap"
            title="下载客户端 / 安卓安装与APK打包"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">下载APP / 手机安装</span>
            <span className="sm:hidden">下载APP</span>
          </button>
        )}
      </div>

      <AndroidInstallModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />
    </>
  );
};
