#!/usr/bin/env bash
set -e

echo "=========================================="
echo " 学生签到与学业统计 - Android APK 自动打包脚本"
echo "=========================================="

echo "[1/4] 正在构建前端离线资源..."
npm run build

echo "[2/4] 正在同步资源至原生 Android 工程..."
npx cap sync android

echo "[3/4] 检查 Android 构建环境..."
if [ -z "$JAVA_HOME" ]; then
  echo "提示: 未检测到 JAVA_HOME 环境变量，正在尝试使用系统默认 Java..."
fi

echo "[4/4] 正在编译生成 Android APK (Debug 版)..."
cd android
chmod +x ./gradlew
./gradlew assembleDebug

echo "=========================================="
echo "✅ APK 打包完成！安装包生成位置："
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo "=========================================="
