import React, { createContext, useState, useContext, ReactNode } from 'react';

// --- TRANSLATION DICTIONARY ---
const translations = {
  en: {
    // Header
    welcome: 'Welcome',
    logout: 'Logout',
    viewMyHistory: 'View My History',
    languageToggle: '中文',
    companyName: 'China Railway Sixth Group Co Ltd',

    // Login
    loginTitle: 'Attendance System Login',
    loginSubtitle: 'Access your dashboard',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    loginButton: 'Log In',
    loginError: 'Invalid username or password. Use "employee", "manager", or "admin" with password "password".',

    // Employee Dashboard
    employeeDashboardTitle: 'Employee Dashboard',
    employeeDashboardSubtitle: 'Manage your attendance and leave requests',
    tabAttendance: 'Attendance',
    tabMap: 'Map',
    tabLeave: 'Leave',
    welcomeUser: 'Welcome, {name}!',
    statusCheckedIn: 'Checked In',
    statusCheckedOut: 'Checked Out for the day',
    statusNotCheckedIn: 'Not Checked In',
    checkInButton: 'Check In with Selfie',
    checkOutButton: 'Check Out with Selfie',
    monthlySummary: "This Month's Summary",
    chartPresent: 'Present',
    chartAbsent: 'Absent',
    chartSundays: 'Sundays',
    todayStatus: "Today's Status",
    checkInTime: 'Check In Time',
    checkOutTime: 'Check Out Time',
    lastLocationAccuracy: 'Last Location Accuracy',
    locationNotRecorded: 'No location recorded',
    // Map View
    mapTitle: 'Real-Time Project Map',
    mapError: 'Location Error: {message}',
    mapProjectCenter: 'Project Center',
    mapYourLocation: 'Your Location',
    mapAttendanceZone: 'Attendance Zone ({radius}m)',
    // Leave View
    leaveManagement: 'Leave Management',
    requestNewLeave: 'Request New Leave',
    newLeaveRequestTitle: 'New Leave Request',
    leaveType: 'Leave Type',
    fromDate: 'From Date',
    toDate: 'To Date',
    reason: 'Reason',
    submitRequest: 'Submit Request',
    cancel: 'Cancel',
    formErrors: {
      allFieldsRequired: 'All fields are required.',
      toDateBeforeFrom: '"To" date cannot be before "From" date.',
      noCurrentUser: 'Could not identify current user.',
    },
    // Camera Modal
    cameraModalTitle: 'Selfie for {action}',
    initializingCamera: 'Initializing camera and verifying location...',
    cameraAccessDenied: 'Camera access denied. Please enable permissions.',
    inProjectZone: 'In Project Zone',
    outsideProjectZone: 'Outside Project Zone',
    locationStatusWithin: 'Within project area ({distance}m / {radius}m).',
    locationStatusOutside: 'Outside project area ({distance}m / {radius}m). Move closer.',
    locationAccuracy: 'Accuracy: +/- {accuracy}m',
    captureButton: 'Capture',
    retakeButton: 'Retake',
    confirmButton: 'Confirm',
    // Offline Banner
    offlineMessage: 'You are in Offline Mode. Actions will be synced later.',
    syncingMessage: 'Syncing {count} offline record(s)...',
    syncCompleteMessage: 'All offline records have been synced!',
    syncErrorMessage: 'Error syncing offline data. Records are saved locally.',

    // Manager Dashboard
    managerDashboardTitle: 'Manager Dashboard',
    managerDashboardSubtitle: "Manage your department's attendance and leave.",
    tabDashboard: 'Dashboard',
    tabLiveMap: 'Live Map',
    statDepartmentEmployees: 'Department Employees',
    statPresentToday: 'Present Today',
    statOnLeave: 'On Leave',
    statLateToday: 'Late Today',
    departmentEmployeesTitle: 'Department Employees',
    pendingLeaveRequestsTitle: 'Pending Leave Requests',
    noPendingLeaves: 'No pending leave requests for your department.',
    liveMapTitle: 'Live Employee Locations',
    
    // Admin Dashboard
    adminDashboardTitle: 'Admin Dashboard',
    adminDashboardSubtitle: 'System-wide management and configuration.',
    tabEmployees: 'Employees',
    tabDepartments: 'Departments',
    // FIX: Removed duplicate `tabAttendance` key.
    tabReports: 'Reports',
    tabSettings: 'Settings',
    // Admin Stats
    statTotalEmployees: 'Total Employees',
    statAbsentToday: 'Absent Today',
    statActiveLocations: 'Active Locations',
    statPendingLeaves: 'Pending Leaves',
    // Employee Management
    employeeManagement: 'Employee Management',
    addEmployee: 'Add Employee',
    editEmployee: 'Edit Employee',
    // Department Management
    departmentManagement: 'Department Management',
    addDepartment: 'Add Department',
    editDepartment: 'Edit Department',
    managerNotAssigned: 'Not Assigned',
    // Leave Management
    leaveRequestManagement: 'Leave Request Management',
    // Attendance Records
    attendanceRecordsTitle: 'Attendance Records',
    filterByDate: 'Filter by Date',
    selfie: 'Selfie',
    noRecordsFound: 'No records found for the selected date.',
    viewSelfie: 'View Selfie',
    // Reports
    reportsTitle: 'Attendance Reports',
    filterByMonth: 'Filter by Month',
    generateReport: 'Generate Report',
    downloadReport: 'Download Report',
    downloadPDF: 'Download PDF',
    downloadExcel: 'Download Excel',
    downloadCSV: 'Download CSV',
    reportFor: 'Report for {month} {year}',
    // AI Settings
    aiSettingsTitle: 'AI-Powered System Configuration',
    projectContextLabel: 'Project Context',
    getAISuggestions: 'Get AI Suggestions',
    radiusLabel: 'Attendance Radius (meters)',
    allowLocationViewLabel: 'Allow Employee Location View',
    workingHoursStartLabel: 'Working Hours Start',
    workingHoursEndLabel: 'Working Hours End',
    saveSettings: 'Save Settings',
    settingsSaved: 'Settings saved and applied globally!',

    // Global History Modal
    historyModalTitle: 'Attendance History for {name}',
    noHistoryRecords: 'No attendance records found for this employee.',
  },
  zh: {
    // Header
    welcome: '欢迎',
    logout: '登出',
    viewMyHistory: '查看我的历史记录',
    languageToggle: 'English',
    companyName: '中国中铁六局集团有限公司',

    // Login
    loginTitle: '考勤系统登录',
    loginSubtitle: '访问您的仪表板',
    usernameLabel: '用户名',
    passwordLabel: '密码',
    loginButton: '登录',
    loginError: '无效的用户名或密码。请使用 "employee"、"manager" 或 "admin"，密码为 "password"。',

    // Employee Dashboard
    employeeDashboardTitle: '员工仪表板',
    employeeDashboardSubtitle: '管理您的考勤和休假申请',
    tabAttendance: '考勤',
    tabMap: '地图',
    tabLeave: '休假',
    welcomeUser: '欢迎, {name}!',
    statusCheckedIn: '已上班打卡',
    statusCheckedOut: '今日已下班打卡',
    statusNotCheckedIn: '未上班打卡',
    checkInButton: '自拍上班打卡',
    checkOutButton: '自拍下班打卡',
    monthlySummary: '本月总结',
    chartPresent: '出勤',
    chartAbsent: '缺勤',
    chartSundays: '周日',
    todayStatus: '今日状态',
    checkInTime: '上班打卡时间',
    checkOutTime: '下班打卡时间',
    lastLocationAccuracy: '最后记录的位置精度',
    locationNotRecorded: '未记录位置',
    // Map View
    mapTitle: '实时项目地图',
    mapError: '位置错误: {message}',
    mapProjectCenter: '项目中心',
    mapYourLocation: '您的位置',
    mapAttendanceZone: '考勤区域 ({radius}米)',
    // Leave View
    leaveManagement: '休假管理',
    requestNewLeave: '申请新休假',
    newLeaveRequestTitle: '新休假申请',
    leaveType: '休假类型',
    fromDate: '开始日期',
    toDate: '结束日期',
    reason: '原因',
    submitRequest: '提交申请',
    cancel: '取消',
    formErrors: {
      allFieldsRequired: '所有字段均为必填项。',
      toDateBeforeFrom: '"结束日期"不能早于"开始日期"。',
      noCurrentUser: '无法识别当前用户。',
    },
    // Camera Modal
    cameraModalTitle: '为 {action} 自拍',
    initializingCamera: '正在初始化摄像头并验证位置...',
    cameraAccessDenied: '摄像头访问被拒绝。请启用权限。',
    inProjectZone: '在项目区域内',
    outsideProjectZone: '在项目区域外',
    locationStatusWithin: '在项目区域内 ({distance}米 / {radius}米)。',
    locationStatusOutside: '在项目区域外 ({distance}米 / {radius}米)。请靠近。',
    locationAccuracy: '精度: +/- {accuracy}米',
    captureButton: '拍摄',
    retakeButton: '重拍',
    confirmButton: '确认',
    // Offline Banner
    offlineMessage: '您处于离线模式。操作将在稍后同步。',
    syncingMessage: '正在同步 {count} 条离线记录...',
    syncCompleteMessage: '所有离线记录已同步！',
    syncErrorMessage: '同步离线数据时出错。记录已保存在本地。',

    // Manager Dashboard
    managerDashboardTitle: '经理仪表板',
    managerDashboardSubtitle: '管理您部门的考勤和休假。',
    tabDashboard: '仪表板',
    tabLiveMap: '实时地图',
    statDepartmentEmployees: '部门员工',
    statPresentToday: '今日出勤',
    statOnLeave: '休假中',
    statLateToday: '今日迟到',
    departmentEmployeesTitle: '部门员工',
    pendingLeaveRequestsTitle: '待处理的休假申请',
    noPendingLeaves: '您的部门没有待处理的休假申请。',
    liveMapTitle: '员工实时位置',
    
    // Admin Dashboard
    adminDashboardTitle: '管理员仪表板',
    adminDashboardSubtitle: '全系统管理和配置。',
    tabEmployees: '员工',
    tabDepartments: '部门',
    // FIX: Removed duplicate `tabAttendance` key. The admin dashboard will now use the existing '考勤' translation.
    tabReports: '报告',
    tabSettings: '设置',
    // Admin Stats
    statTotalEmployees: '总员工数',
    statAbsentToday: '今日缺勤',
    statActiveLocations: '活跃位置',
    statPendingLeaves: '待处理休假',
    // Employee Management
    employeeManagement: '员工管理',
    addEmployee: '添加员工',
    editEmployee: '编辑员工',
    // Department Management
    departmentManagement: '部门管理',
    addDepartment: '添加部门',
    editDepartment: '编辑部门',
    managerNotAssigned: '未分配',
    // Leave Management
    leaveRequestManagement: '休假申请管理',
     // Attendance Records
    attendanceRecordsTitle: '考勤记录',
    filterByDate: '按日期筛选',
    selfie: '自拍',
    noRecordsFound: '未找到所选日期的记录。',
    viewSelfie: '查看自拍',
    // Reports
    reportsTitle: '考勤报告',
    filterByMonth: '按月份筛选',
    generateReport: '生成报告',
    downloadReport: '下载报告',
    downloadPDF: '下载PDF',
    downloadExcel: '下载Excel',
    downloadCSV: '下载CSV',
    reportFor: '{year}年{month}报告',
    // AI Settings
    aiSettingsTitle: 'AI驱动的系统配置',
    projectContextLabel: '项目背景',
    getAISuggestions: '获取AI建议',
    radiusLabel: '考勤半径 (米)',
    allowLocationViewLabel: '允许员工查看位置',
    workingHoursStartLabel: '工作开始时间',
    workingHoursEndLabel: '工作结束时间',
    saveSettings: '保存设置',
    settingsSaved: '设置已保存并全局应用！',

    // Global History Modal
    historyModalTitle: '{name} 的考勤历史',
    noHistoryRecords: '未找到该员工的考勤记录。',
  },
};

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
  t: () => '',
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'zh' : 'en'));
  };

  const t = (key: string, options?: Record<string, string | number>): string => {
    const keys = key.split('.');
    // FIX: Changed result type to 'any' to allow dynamic key access on a nested object,
    // resolving a TypeScript error where the type was inferred as 'never'.
    let result: any = translations[language];
    for(const k of keys) {
        if(result[k] === undefined) return key;
        result = result[k];
    }

    if (typeof result === 'string' && options) {
        return result.replace(/\{(\w+)\}/g, (_, k) => String(options[k] || k));
    }
    
    return typeof result === 'string' ? result : key;
  };

  const value = { language, toggleLanguage, t };

  // FIX: The original code used JSX syntax in a .ts file, which is invalid.
  // Replaced with React.createElement to make it valid TypeScript and resolve
  // compilation errors in this file and the type error in App.tsx.
  return React.createElement(LanguageContext.Provider, { value }, children);
};

export const useTranslation = () => useContext(LanguageContext);
