import React, { createContext, useState, ReactNode } from 'react';
import { User, Department, LeaveRequest, Role, LeaveType, LeaveStatus, AttendanceRecord, GeolocationData } from '../types';

// --- MOCK DATA ---
const mockInitialUsers: User[] = [
    { id: 'user001', username: 'johndoe', fullName: 'John Doe', role: Role.EMPLOYEE, department: 'Construction', position: 'Site Worker', avatarInitial: 'J', profilePictureUrl: '' },
    { id: 'user002', username: 'peterjones', fullName: 'Peter Jones', role: Role.EMPLOYEE, department: 'Construction', position: 'Electrician', avatarInitial: 'P', profilePictureUrl: '' },
    { id: 'user003', username: 'samwilson', fullName: 'Sam Wilson', role: Role.EMPLOYEE, department: 'Logistics', position: 'Driver', avatarInitial: 'S', profilePictureUrl: '' },
    { id: 'mgr001', username: 'janesmith', fullName: 'Jane Smith', role: Role.MANAGER, department: 'Construction', position: 'Site Manager', avatarInitial: 'J', profilePictureUrl: '' },
    { id: 'mgr002', username: 'billturner', fullName: 'Bill Turner', role: Role.MANAGER, department: 'Logistics', position: 'Logistics Head', avatarInitial: 'B', profilePictureUrl: '' },
    { id: 'adm001', username: 'alexjohnson', fullName: 'Alex Johnson', role: Role.ADMIN, department: 'HQ', position: 'System Admin', avatarInitial: 'A', profilePictureUrl: '' },
];

const mockInitialDepartments: Department[] = [
    { id: 'dept01', name: 'Construction', managerId: 'mgr001', employeeCount: 25 },
    { id: 'dept02', name: 'Logistics', managerId: 'mgr002', employeeCount: 10 },
    { id: 'dept03', name: 'Surveying', managerId: '', employeeCount: 5 },
];

const mockInitialLeaveRequests: LeaveRequest[] = [
    { id: 'lr001', userId: 'user001', userFullName: 'John Doe', department: 'Construction', leaveType: LeaveType.SICK, fromDate: '2024-07-29', toDate: '2024-07-29', reason: 'Fever and headache', status: LeaveStatus.PENDING_MANAGER, days: 1 },
    { id: 'lr002', userId: 'user003', userFullName: 'Sam Wilson', department: 'Logistics', leaveType: LeaveType.ANNUAL, fromDate: '2024-08-01', toDate: '2024-08-05', reason: 'Family vacation', status: LeaveStatus.PENDING_MANAGER, days: 5 },
    { id: 'lr003', userId: 'user002', userFullName: 'Peter Jones', department: 'Construction', leaveType: LeaveType.CASUAL, fromDate: '2024-07-25', toDate: '2024-07-25', reason: 'Personal appointment', status: LeaveStatus.PENDING_ADMIN, days: 1 },
    { id: 'lr004', userId: 'user001', userFullName: 'John Doe', department: 'Construction', leaveType: LeaveType.ANNUAL, fromDate: '2024-06-15', toDate: '2024-06-16', reason: 'Family vacation.', status: LeaveStatus.APPROVED, days: 2 },
    { id: 'lr005', userId: 'user001', userFullName: 'John Doe', department: 'Construction', leaveType: LeaveType.SICK, fromDate: '2024-07-10', toDate: '2024-07-10', reason: 'Sudden illness.', status: LeaveStatus.REJECTED, days: 1 },
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const mockInitialAttendanceRecords: AttendanceRecord[] = [
    {
        id: 'att001',
        userId: 'user001',
        date: yesterday.toISOString().split('T')[0],
        checkInTime: new Date(yesterday.setHours(8, 5, 0)).toISOString(),
        checkOutTime: new Date(yesterday.setHours(17, 32, 0)).toISOString(),
        checkInLocation: { latitude: 26.6814, longitude: 68.0169, accuracy: 15 },
        checkOutLocation: { latitude: 26.6815, longitude: 68.0170, accuracy: 12 },
        checkInSelfie: 'https://i.pravatar.cc/150?u=user001_in',
        checkOutSelfie: 'https://i.pravatar.cc/150?u=user001_out',
    },
    {
        id: 'att002',
        userId: 'user002',
        date: yesterday.toISOString().split('T')[0],
        checkInTime: new Date(yesterday.setHours(8, 1, 0)).toISOString(),
        checkOutTime: new Date(yesterday.setHours(17, 29, 0)).toISOString(),
        checkInLocation: { latitude: 26.6812, longitude: 68.0167, accuracy: 25 },
        checkOutLocation: { latitude: 26.6813, longitude: 68.0168, accuracy: 22 },
        checkInSelfie: 'https://i.pravatar.cc/150?u=user002_in',
        checkOutSelfie: 'https://i.pravatar.cc/150?u=user002_out',
    },
     {
        id: 'att003',
        userId: 'mgr001',
        date: yesterday.toISOString().split('T')[0],
        checkInTime: new Date(yesterday.setHours(7, 55, 0)).toISOString(),
        checkOutTime: new Date(yesterday.setHours(18, 2, 0)).toISOString(),
        checkInLocation: { latitude: 26.6810, longitude: 68.0165, accuracy: 10 },
        checkOutLocation: { latitude: 26.6811, longitude: 68.0166, accuracy: 11 },
        checkInSelfie: 'https://i.pravatar.cc/150?u=mgr001_in',
        checkOutSelfie: 'https://i.pravatar.cc/150?u=mgr001_out',
    },
];
// --- END MOCK DATA ---


interface DataContextType {
    users: User[];
    departments: Department[];
    leaveRequests: LeaveRequest[];
    attendanceRecords: AttendanceRecord[];
    updateLeaveStatus: (leaveRequestId: string, newStatus: LeaveStatus) => void;
    addLeaveRequest: (newRequest: Omit<LeaveRequest, 'id'>) => void;
    addUser: (newUser: Omit<User, 'id' | 'avatarInitial'>) => void;
    updateUser: (updatedUser: User) => void;
    deleteUser: (userId: string) => void;
    addOrUpdateAttendanceRecord: (payload: {
        userId: string;
        action: 'check-in' | 'check-out';
        time: Date;
        location: GeolocationData | null;
        selfie: string | null;
    }) => void;
}

export const DataContext = createContext<DataContextType>({
    users: [],
    departments: [],
    leaveRequests: [],
    attendanceRecords: [],
    updateLeaveStatus: () => {},
    addLeaveRequest: () => {},
    addUser: () => {},
    updateUser: () => {},
    deleteUser: () => {},
    addOrUpdateAttendanceRecord: () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [users, setUsers] = useState<User[]>(mockInitialUsers);
    const [departments, setDepartments] = useState<Department[]>(mockInitialDepartments);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockInitialLeaveRequests);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockInitialAttendanceRecords);

    const updateLeaveStatus = (leaveRequestId: string, newStatus: LeaveStatus) => {
        setLeaveRequests(prev => 
            prev.map(req => req.id === leaveRequestId ? { ...req, status: newStatus } : req)
        );
    };

    const addLeaveRequest = (newRequestData: Omit<LeaveRequest, 'id'>) => {
        const newRequest: LeaveRequest = {
            id: `lr${Date.now()}`,
            ...newRequestData
        };
        setLeaveRequests(prev => [newRequest, ...prev]);
    };
    
    const addUser = (newUserData: Omit<User, 'id' | 'avatarInitial'>) => {
        const newUser: User = {
            id: `user${Date.now()}`,
            avatarInitial: newUserData.fullName.charAt(0).toUpperCase(),
            ...newUserData
        };
        setUsers(prev => [newUser, ...prev]);
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const deleteUser = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    };

    const addOrUpdateAttendanceRecord = (payload: {
        userId: string;
        action: 'check-in' | 'check-out';
        time: Date;
        location: GeolocationData | null;
        selfie: string | null;
    }) => {
        const today = payload.time.toISOString().split('T')[0];
        const existingRecordIndex = attendanceRecords.findIndex(
            rec => rec.userId === payload.userId && rec.date === today
        );

        if (payload.action === 'check-in') {
            const newRecord: AttendanceRecord = {
                id: `att${Date.now()}`,
                userId: payload.userId,
                date: today,
                checkInTime: payload.time.toISOString(),
                checkInLocation: payload.location,
                checkInSelfie: payload.selfie,
                checkOutTime: null,
                checkOutLocation: null,
                checkOutSelfie: null,
            };
            setAttendanceRecords(prev => [...prev, newRecord]);
        } else if (payload.action === 'check-out' && existingRecordIndex > -1) {
            setAttendanceRecords(prev => {
                const updatedRecords = [...prev];
                updatedRecords[existingRecordIndex] = {
                    ...updatedRecords[existingRecordIndex],
                    checkOutTime: payload.time.toISOString(),
                    checkOutLocation: payload.location,
                    checkOutSelfie: payload.selfie,
                };
                return updatedRecords;
            });
        }
    };


    const dataContextValue = {
        users,
        departments,
        leaveRequests,
        attendanceRecords,
        updateLeaveStatus,
        addLeaveRequest,
        addUser,
        updateUser,
        deleteUser,
        addOrUpdateAttendanceRecord,
    };

    // FIX: The original code used JSX syntax in a .ts file, which is invalid.
    // Replaced with React.createElement to make it valid TypeScript and resolve
    // compilation errors in this file and the type error in App.tsx.
    return React.createElement(DataContext.Provider, { value: dataContextValue }, children);
};