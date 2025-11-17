export enum Role {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  department: string;
  position: string;
  avatarInitial: string;
  profilePictureUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLocation: GeolocationData | null;
  checkOutLocation: GeolocationData | null;
  checkInSelfie: string | null;
  checkOutSelfie: string | null;
  date: string;
}

export interface GeolocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export enum LeaveType {
  SICK = 'sick',
  CASUAL = 'casual',
  ANNUAL = 'annual',
  MEDICAL = 'medical'
}

export enum LeaveStatus {
  PENDING_MANAGER = 'Pending Manager',
  PENDING_ADMIN = 'Pending Admin',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userFullName: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  days: number;
  department: string;
}

export interface Department {
  id: string;
  name: string;
  managerId: string;
  employeeCount: number;
}

export interface AdminSettings {
  radiusInMeters: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  allowEmployeeLocationView: boolean;
}

export interface AISuggestion extends AdminSettings {
    radiusReasoning: string;
    workingHoursReasoning: string;
    locationAccuracy: 'high' | 'balanced';
    locationAccuracyReasoning: string;
}