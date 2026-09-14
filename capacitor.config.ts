import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.school.attendance',
  appName: '学生签到与学业统计',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
