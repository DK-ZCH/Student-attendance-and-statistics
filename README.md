# 🎓 学生签到与学业统计系统 (Student Attendance & Academic Tracker)

<div align="center">

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2D8?logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-Android_8.x-119EFF?logo=capacitor&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-100%25_Offline_Ready-5A0FC8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**一款现代化、支持完全离线运行的学生签到、作业提交与学业统计分析管理系统。**  
零外部服务器依赖，支持电脑浏览器、手机 PWA 桌面秒装，并已内置标准 **Android 原生工程与 GitHub Actions 自动编译 APK**。

[功能演示](#-核心特性) • [快速上手](#-快速启动) • [打包-android-apk](#-android-apk-打包与手机安装) • [目录架构](#-目录结构) • [开源协议](#-开源协议)

</div>

---

## ✨ 核心特性

- 📱 **双端适配与沉浸体验**
  - **响应式设计**：完美适配 PC 宽屏、平板、各类折叠屏及智能手机屏幕。
  - **手机 PWA 桌面秒装**：手机浏览器直接「添加到主屏幕」，无需下载几十兆安装包，即可获得无浏览器地址栏的原生全屏沉浸体验。
  - **已集成 Capacitor Android 原生工程**：项目内置 `/android` 原生工程代码与权限配置，支持本地一键编译或云端 CI/CD 自动打包 APK。

- ⚡ **100% 离线可用 (Offline-First)**
  - 基于 **IndexedDB + 本地缓存策略**，所有学生名册、签到记录、作业评分均保存在本地设备。
  - 教学楼地下室、操场、网络不佳等无网络环境下，签到打卡、查看报表完全不受影响。

- 📅 **智能学生考勤点名**
  - 支持快捷批量打卡与单人精细化标记（已到、迟到、请假、旷课）。
  - 日历视图与快速日期切换，实时统计当日应到、实到、出勤率看板。

- 📚 **作业与学业成绩统计**
  - 轻松发布日常作业、测验与课堂考核。
  - 支持作业拍照留存与本地压缩归档，批改状态一览无余。
  - 智能多维度统计：平均分、最高/最低分、分数段分布区间、合格率柱状图。

- 📊 **报表导出与数据备份安全**
  - **数据一键导出**：支持一键导出格式标准的 Excel / CSV 考勤统计明细表和学业成绩汇总表。
  - **安全备份恢复**：支持全量 JSON 数据备份与还原，换手机、重装系统或多设备迁移数据无缝衔接。
  - **严格隐私保证**：数据不上云端第三方服务器，完全保留在使用者本地终端，保障师生个人信息安全。

---

## 🚀 快速启动

### 1. 环境准备
- [Node.js](https://nodejs.org/) (推荐 v18.0 或更高版本)
- npm、yarn 或 pnpm

### 2. 克隆与安装依赖
```bash
# 1. 克隆代码仓库
git clone https://github.com/your-username/student-attendance-tracker.git
cd student-attendance-tracker

# 2. 安装依赖包
npm install
```

### 3. 启动本地开发服务
```bash
npm run dev
```
打开浏览器访问 `http://localhost:3000` 即可开始体验。

### 4. 生产环境打包
```bash
npm run build
```
编译产物将生成在 `dist/` 目录下，可直接通过任何静态 Web 服务器（如 Nginx、Vercel、Cloudflare Pages、GitHub Pages）托管部署。

---

## 📱 Android APK 打包与手机安装

本项目已完成标准原生 Android 环境配置，提供 **3 种便捷的手机端使用方式**：

### 方式一：GitHub Actions 云端 0 配置自动打包（最推荐 ⭐️）
本项目已内置 `.github/workflows/build-apk.yml` 自动化构建工作流：
1. 将项目推送到您的 GitHub 仓库；
2. 进入仓库页面的 **Actions** 标签页；
3. 系统会自动触发 `Build Android APK` 编译流（或手动点击 Run workflow）；
4. 编译完成后，在当次运行结果的 **Artifacts** 区域即可直接下载 `学生签到与学业统计-Android-APK` 安装包！

### 方式二：本地电脑一键编译 APK
若您本地安装了 JDK 21 和 Android SDK / Android Studio：
```bash
# 赋予脚本执行权限并一键打包
chmod +x ./build-android-apk.sh
./build-android-apk.sh
```
或者使用 npm 指令同步后在 Android Studio 中打开：
```bash
# 编译前端静态代码并同步至 Android 工程
npm run android:sync

# 调起 Android Studio 打开工程并编译
npm run android:open
```
编译完成后，安装包位于：
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### 方式三：手机桌面 3 秒免编译安装（PWA）
无需生成任何安装包文件，轻量省电：
1. 手机自带浏览器或 Chrome 打开部署后的网址；
2. 点击页面右上角 **「下载APP / 手机安装」** 或浏览器自带的「···」菜单；
3. 选择 **「添加到主屏幕」** 或 **「安装应用」**；
4. 手机主屏幕立即生成专属 App 图标，断网、飞行模式下亦可秒开使用。

---

## 📂 目录结构

```text
├── android/                   # 标准 Android Studio 原生工程代码
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml # 安卓权限声明 (联网、相机、读写相册)
│   │   └── java/              # 原生主活动代码
│   ├── build.gradle           # Gradle 构建配置
│   └── gradlew                # Gradle 包装脚本
├── .github/workflows/         # GitHub Actions 云端自动构建配置
│   └── build-apk.yml          # 全自动编译 Android APK 工作流
├── public/                    # 静态公共资源与 PWA 图标
├── src/
│   ├── components/            # UI 组件层
│   │   ├── AttendanceView.tsx # 签到点名与考勤打卡模块
│   │   ├── HomeworkView.tsx   # 作业发布与批改打分模块
│   │   ├── StatisticsView.tsx # 学业数据可视化分析与图表看板
│   │   ├── StudentListView.tsx# 学生档案管理与导入
│   │   ├── BackupExportView.tsx# 报表导出、备份恢复与 APK 指南
│   │   ├── AndroidInstallModal.tsx # 安卓下载与离线引导弹窗
│   │   ├── Navbar.tsx         # 顶部导航栏
│   │   └── PWAInstallButton.tsx # 客户端快速安装入口
│   ├── hooks/                 # 自定义 React Hooks
│   │   └── usePWAInstall.ts   # PWA 安装状态与唤起 Hook
│   ├── services/              # 数据持久化层 (IndexedDB 引擎)
│   ├── types.ts               # TypeScript 核心类型定义
│   ├── App.tsx                # 应用主入口
│   └── main.tsx               # React 根挂载点
├── build-android-apk.sh       # 本地 Android APK 一键打包脚本
├── capacitor.config.ts        # Capacitor 跨平台容器配置
├── package.json               # 依赖管理与快捷指令
├── vite.config.ts             # Vite 构建与 PWA 插件配置
└── README.md                  # 项目中文说明文档
```

---

## 🛠️ 技术栈

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **核心框架** | React 18 + TypeScript | 强类型、模块化、高可维护性 |
| **构建工具** | Vite 6 | 秒级热更新、高效 Rollup 生产打包 |
| **界面样式** | Tailwind CSS 4 | 极简现代化 UI、深色浅色自然色彩搭配 |
| **图标库** | Lucide React | 精致一致的开源矢量图标体系 |
| **原生跨平台**| Capacitor 8 (Android) | 标准 Android 原生 Web 容器封装 |
| **离线引擎** | Workbox + Vite PWA | Service Worker 资源离线拦截与预缓存 |
| **本地存储** | Browser IndexedDB | 支持大数据量、结构化本地持久化存储 |
| **自动化集成**| GitHub Actions | 云端 Ubuntu 环境自动打包构建 Android APK |

---

## 🛡️ 数据隐私与安全性

- **全本地私有存储**：所有录入的学生个人信息、照片、作业与考勤历史数据仅存储在运行设备内部的 IndexedDB 本地数据库中。
- **无需账号注册**：开箱即用，无需手机号注册，没有第三方跟踪脚本或分析 SDK。
- **自主可控备份**：支持随时导出为加密/离线的标准 JSON 文件与 Excel 表格，方便学校、班级教师自行备份归档。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。您可以自由地商用、修改和二次分发。
