import React, { useState, useEffect, useContext } from 'react';
import Card, { CardContent, CardHeader } from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { AdminSettings, AttendanceRecord, Department, LeaveRequest, LeaveStatus, Role, User } from '../types';
import { getAIConfigurationSuggestion } from '../services/geminiService';
import { SettingsContext } from '../contexts/SettingsContext';
import { DataContext } from '../contexts/DataContext';
import { useTranslation } from '../contexts/LanguageContext';

const EmployeeManagementView: React.FC = () => {
    const { users, departments, addUser, updateUser, deleteUser } = useContext(DataContext);
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string } | null>(null);
    const [formError, setFormError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const emptyUser: Partial<User> & { password?: string } = {
        username: '',
        fullName: '',
        password: '',
        role: Role.EMPLOYEE,
        department: '',
        position: '',
        profilePictureUrl: '',
    };
    
    const handleAddNew = () => {
        setEditingUser(emptyUser);
        setIsModalOpen(true);
        setFormError('');
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
        setFormError('');
    };

    const handleDelete = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            deleteUser(userId);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        
        const { username, fullName, password, role, department, position } = editingUser;
        if (!username || !fullName || (!editingUser.id && !password) || !role || !department || !position) {
            setFormError(t('formErrors.allFieldsRequired'));
            return;
        }

        if (editingUser.id) {
            updateUser(editingUser as User);
        } else {
            addUser(editingUser as Omit<User, 'id' | 'avatarInitial'>);
        }
        handleCloseModal();
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormError('');
    }
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingUser(u => ({ ...u, profilePictureUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateAvatar = async () => {
        if (!editingUser?.fullName) {
            alert("Please enter a name before generating an avatar.");
            return;
        }
        setIsGenerating(true);
        try {
            const response = await fetch(`https://i.pravatar.cc/150?u=${editingUser.username || editingUser.fullName}`);
            if (!response.ok) throw new Error("Failed to fetch avatar");
            
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingUser(u => ({ ...u, profilePictureUrl: reader.result as string }));
                setIsGenerating(false);
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error("Avatar generation failed:", error);
            alert("Failed to generate avatar.");
            setIsGenerating(false);
        }
    };

    return (
         <Card>
            <CardHeader className="flex justify-between items-center">
                <span><i className="fas fa-users mr-2"></i> {t('employeeManagement')}</span>
                <Button variant="info" onClick={handleAddNew}>
                    <i className="fas fa-plus mr-2"></i> {t('addEmployee')}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-3">Avatar</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Department</th>
                                <th className="p-3">Position</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-white/10 last:border-b-0">
                                     <td className="p-3">
                                        {user.profilePictureUrl ? (
                                            <img src={user.profilePictureUrl} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                                                {user.avatarInitial}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">{user.fullName}</td>
                                    <td className="p-3 text-white/80">{user.department}</td>
                                    <td className="p-3 text-white/80">{user.position}</td>
                                    <td className="p-3 capitalize"><span className={`px-2 py-1 text-xs rounded-full ${user.role === Role.ADMIN ? 'bg-purple-500' : user.role === Role.MANAGER ? 'bg-blue-500' : 'bg-gray-500'}`}>{user.role}</span></td>
                                    <td className="p-3 space-x-2">
                                        <Button variant="warning" onClick={() => handleEdit(user)} className="py-1 px-2 text-xs"><i className="fas fa-edit"></i></Button>
                                        <Button variant="danger" onClick={() => handleDelete(user.id)} className="py-1 px-2 text-xs"><i className="fas fa-trash"></i></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            {isModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <h3 className="text-xl font-bold">{editingUser.id ? t('editEmployee') : t('addEmployee')}</h3>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-white/90 mb-2">Profile Picture</label>
                                    <div className="flex items-center gap-4">
                                        {editingUser.profilePictureUrl ? (
                                            <img src={editingUser.profilePictureUrl} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center font-bold text-3xl">
                                                {editingUser.fullName ? editingUser.fullName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        )}
                                        <div className="flex-grow space-y-2">
                                            <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg block text-center">
                                                <i className="fas fa-upload mr-2"></i> Upload Image
                                            </label>
                                            <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            <Button type="button" variant="info" className="w-full text-sm" onClick={handleGenerateAvatar} disabled={isGenerating}>
                                                {isGenerating ? <Spinner/> : <><i className="fas fa-robot mr-2"></i> Generate with AI</>}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white/90 mb-1">{t('usernameLabel')}</label>
                                        <input type="text" value={editingUser.username} onChange={e => setEditingUser(u => ({...u, username: e.target.value}))} className="w-full p-2 rounded-lg bg-white/20 border border-white/30" required disabled={!!editingUser.id} />
                                    </div>
                                    <div>
                                        <label className="block text-white/90 mb-1">{t('passwordLabel')}</label>
                                        <input type="password" placeholder={editingUser.id ? 'Leave blank to keep unchanged' : ''} onChange={e => setEditingUser(u => ({...u, password: e.target.value}))} className="w-full p-2 rounded-lg bg-white/20 border border-white/30" required={!editingUser.id} />
                                    </div>
                               </div>
                               <div>
                                    <label className="block text-white/90 mb-1">Full Name</label>
                                    <input type="text" value={editingUser.fullName} onChange={e => setEditingUser(u => ({...u, fullName: e.target.value}))} className="w-full p-2 rounded-lg bg-white/20 border border-white/30" required />
                               </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white/90 mb-1">Role</label>
                                        <select value={editingUser.role} onChange={e => setEditingUser(u => ({...u, role: e.target.value as Role}))} className="w-full p-2 rounded-lg bg-white/20 border border-white/30 text-white">
                                            {Object.values(Role).map(role => <option key={role} value={role} className="text-black capitalize">{role}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/90 mb-1">Department</label>
                                        <select value={editingUser.department} onChange={e => setEditingUser(u => ({...u, department: e.target.value}))} className="w-full p-2 rounded-lg bg-white/20 border border-white/30 text-white">
                                            <option value="">-- Select Department --</option>
                                            {departments.map(dept => <option key={dept.id} value={dept.name} className="text-black">{dept.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-white/90 mb-1">Position</label>
                                    <input type="text" value={editingUser.position} onChange={e => setEditingUser(u => ({...u, position: e.target.value}))} className="w-full p-2 rounded-lg bg-white/20 border border-white/30" required />
                                </div>
                                {formError && <p className="text-red-300 text-sm">{formError}</p>}
                                <div className="flex justify-end space-x-4 pt-4">
                                    <Button type="button" variant="danger" onClick={handleCloseModal}>{t('cancel')}</Button>
                                    <Button type="submit" variant="success">{t('saveSettings')}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Card>
    );
};


const DepartmentManagementView: React.FC = () => {
    const { departments: initialDepartments, users } = useContext(DataContext);
    const { t } = useTranslation();
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Partial<Department> | null>(null);

    const managers = users.filter(u => u.role === Role.MANAGER);

    const getManagerName = (managerId: string) => {
        return users.find(u => u.id === managerId)?.fullName || <span className="text-yellow-400 italic">{t('managerNotAssigned')}</span>;
    };

    const handleAddNew = () => {
        setEditingDepartment({ name: '', managerId: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (department: Department) => {
        setEditingDepartment(department);
        setIsModalOpen(true);
    };

    const handleDelete = (departmentId: string) => {
        if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
            setDepartments(deps => deps.filter(d => d.id !== departmentId));
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDepartment || !editingDepartment.name) return;

        if (editingDepartment.id) {
            setDepartments(deps => deps.map(d => d.id === editingDepartment.id ? editingDepartment as Department : d));
        } else {
            const newDept: Department = {
                id: `dept${Date.now()}`,
                name: editingDepartment.name,
                managerId: editingDepartment.managerId || '',
                employeeCount: 0,
            };
            setDepartments(deps => [newDept, ...deps]);
        }
        handleCloseModal();
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDepartment(null);
    }

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <span><i className="fas fa-building mr-2"></i> {t('departmentManagement')}</span>
                <Button variant="info" onClick={handleAddNew}>
                    <i className="fas fa-plus mr-2"></i> {t('addDepartment')}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {departments.map(dept => (
                        <div key={dept.id} className={`p-4 bg-white/10 rounded-lg flex justify-between items-center border-l-4 ${dept.managerId ? 'border-transparent' : 'border-yellow-400'}`}>
                            <div>
                                <h4 className="font-bold text-lg">{dept.name}</h4>
                                <p className="text-sm text-white/80">Manager: {getManagerName(dept.managerId)}</p>
                                <p className="text-sm text-white/80">Employees: {dept.employeeCount}</p>
                            </div>
                            <div className="space-x-2">
                                <Button variant="warning" onClick={() => handleEdit(dept)}><i className="fas fa-edit"></i></Button>
                                <Button variant="danger" onClick={() => handleDelete(dept.id)}><i className="fas fa-trash"></i></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            {isModalOpen && editingDepartment && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                         <CardHeader>
                            <h3 className="text-xl font-bold">{editingDepartment.id ? t('editDepartment') : t('addDepartment')}</h3>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-white/90 mb-1">Department Name</label>
                                    <input 
                                        type="text"
                                        value={editingDepartment.name}
                                        onChange={(e) => setEditingDepartment(d => ({...d, name: e.target.value}))}
                                        className="w-full p-2 rounded-lg bg-white/20 border border-white/30"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/90 mb-1">Assign Manager</label>
                                    <select 
                                        value={editingDepartment.managerId} 
                                        onChange={(e) => setEditingDepartment(d => ({...d, managerId: e.target.value}))}
                                        className="w-full p-2 rounded-lg bg-white/20 border border-white/30"
                                    >
                                        <option value="">-- No Manager --</option>
                                        {managers.map(mgr => <option key={mgr.id} value={mgr.id} className="text-black">{mgr.fullName}</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-4 pt-4">
                                    <Button type="button" variant="danger" onClick={handleCloseModal}>{t('cancel')}</Button>
                                    <Button type="submit" variant="success">{t('saveSettings')}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                 </div>
            )}
        </Card>
    );
};

const AdminLeaveManagementView: React.FC = () => {
    const { leaveRequests, updateLeaveStatus } = useContext(DataContext);
    const { t } = useTranslation();
    
    const handleApprove = (id: string) => {
        updateLeaveStatus(id, LeaveStatus.APPROVED);
    };

    const handleReject = (id: string) => {
        updateLeaveStatus(id, LeaveStatus.REJECTED);
    };
    
    const getStatusBadge = (status: LeaveStatus) => {
        switch (status) {
            case LeaveStatus.APPROVED: return 'bg-green-500/80';
            case LeaveStatus.REJECTED: return 'bg-red-500/80';
            case LeaveStatus.PENDING_ADMIN: return 'bg-blue-500/80';
            case LeaveStatus.PENDING_MANAGER:
            default: return 'bg-yellow-500/80';
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <span><i className="fas fa-calendar-check mr-2"></i> {t('leaveRequestManagement')}</span>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-3">Employee</th>
                                <th className="p-3">Department</th>
                                <th className="p-3">Dates</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaveRequests.map(req => (
                                <tr key={req.id} className="border-b border-white/10 last:border-b-0">
                                    <td className="p-3">{req.userFullName}</td>
                                    <td className="p-3">{req.department}</td>
                                    <td className="p-3 text-sm">{req.fromDate} to {req.toDate} ({req.days}d)</td>
                                    <td className="p-3 capitalize">{req.leaveType}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {req.status === LeaveStatus.PENDING_ADMIN ? (
                                            <div className="flex space-x-2">
                                                <Button onClick={() => handleApprove(req.id)} variant="success" className="py-1 px-2 text-xs"><i className="fas fa-check"></i></Button>
                                                <Button onClick={() => handleReject(req.id)} variant="danger" className="py-1 px-2 text-xs"><i className="fas fa-times"></i></Button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-white/60">Finalized</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const AttendanceRecordsView: React.FC = () => {
    const { attendanceRecords, users } = useContext(DataContext);
    const { t } = useTranslation();
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);

    const filteredRecords = attendanceRecords.filter(rec => rec.date === filterDate);
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.fullName || 'Unknown';

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <span><i className="fas fa-calendar-check mr-2"></i> {t('attendanceRecordsTitle')}</span>
                <div className="flex items-center gap-2">
                    <label htmlFor="filterDate" className="text-sm font-semibold">{t('filterByDate')}:</label>
                    <input
                        type="date"
                        id="filterDate"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="p-2 rounded-lg bg-white/20 border border-white/30"
                    />
                </div>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-3">Employee</th>
                                <th className="p-3">Check-In</th>
                                <th className="p-3">Check-Out</th>
                                <th className="p-3">Selfies</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length > 0 ? filteredRecords.map(rec => (
                                <tr key={rec.id} className="border-b border-white/10 last:border-b-0">
                                    <td className="p-3">{getUserName(rec.userId)}</td>
                                    <td className="p-3">{rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : 'N/A'}</td>
                                    <td className="p-3">{rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString() : 'N/A'}</td>
                                    <td className="p-3 flex items-center gap-2">
                                        {rec.checkInSelfie && <img src={rec.checkInSelfie} alt="In" className="w-10 h-10 rounded-md object-cover cursor-pointer" onClick={() => setSelectedSelfie(rec.checkInSelfie)}/>}
                                        {rec.checkOutSelfie && <img src={rec.checkOutSelfie} alt="Out" className="w-10 h-10 rounded-md object-cover cursor-pointer" onClick={() => setSelectedSelfie(rec.checkOutSelfie)} />}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="p-6 text-center text-white/70">{t('noRecordsFound')}</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </CardContent>
            {selectedSelfie && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => setSelectedSelfie(null)}>
                    <img src={selectedSelfie} alt="Selfie" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl" />
                </div>
            )}
        </Card>
    )
};

const ReportsView: React.FC = () => {
    const { attendanceRecords, users } = useContext(DataContext);
    const { t, language } = useTranslation();
    const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    const [reportData, setReportData] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        if (!selectedMonth) {
            setReportData([]);
            return;
        }
        const [year, month] = selectedMonth.split('-').map(Number);
        const filtered = attendanceRecords.filter(rec => {
            const recDate = new Date(rec.date);
            return recDate.getFullYear() === year && recDate.getMonth() + 1 === month;
        });
        setReportData(filtered);
    }, [selectedMonth, attendanceRecords]);

    const getUser = (userId: string) => users.find(u => u.id === userId);

    const downloadCSV = (isExcel = false) => {
        const headers = ["Date", "Employee ID", "Full Name", "Department", "Check-In Time", "Check-Out Time", "Work Hours"];
        const rows = reportData.map(rec => {
            const user = getUser(rec.userId);
            const checkIn = rec.checkInTime ? new Date(rec.checkInTime) : null;
            const checkOut = rec.checkOutTime ? new Date(rec.checkOutTime) : null;
            const hours = checkIn && checkOut ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2) : 'N/A';
            return [
                rec.date,
                rec.userId,
                user?.fullName || 'Unknown',
                user?.department || 'Unknown',
                checkIn ? checkIn.toLocaleTimeString() : 'N/A',
                checkOut ? checkOut.toLocaleTimeString() : 'N/A',
                hours
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + (isExcel ? '\uFEFF' : '') + headers.join(',') + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_report_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            const [year, month] = selectedMonth.split('-');
            const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString(language, { month: 'long' });
            
            let tableHTML = `
                <html>
                <head>
                    <title>Attendance Report</title>
                    <style>
                        body { font-family: sans-serif; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>${t('reportFor', { month: monthName, year })}</h1>
                    <table>
                        <thead>
                            <tr><th>Date</th><th>Name</th><th>Department</th><th>Check-In</th><th>Check-Out</th><th>Hours</th></tr>
                        </thead>
                        <tbody>`;
            
            reportData.forEach(rec => {
                const user = getUser(rec.userId);
                const checkIn = rec.checkInTime ? new Date(rec.checkInTime) : null;
                const checkOut = rec.checkOutTime ? new Date(rec.checkOutTime) : null;
                const hours = checkIn && checkOut ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2) : 'N/A';
                tableHTML += `
                    <tr>
                        <td>${rec.date}</td>
                        <td>${user?.fullName || 'Unknown'}</td>
                        <td>${user?.department || 'Unknown'}</td>
                        <td>${checkIn ? checkIn.toLocaleTimeString() : 'N/A'}</td>
                        <td>${checkOut ? checkOut.toLocaleTimeString() : 'N/A'}</td>
                        <td>${hours}</td>
                    </tr>`;
            });

            tableHTML += '</tbody></table></body></html>';
            printWindow.document.write(tableHTML);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span><i className="fas fa-file-invoice mr-2"></i> {t('reportsTitle')}</span>
                    <div className="flex items-center gap-2">
                        <label htmlFor="monthFilter" className="text-sm font-semibold">{t('filterByMonth')}:</label>
                        <input
                            type="month"
                            id="monthFilter"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="p-2 rounded-lg bg-white/20 border border-white/30"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-end items-center gap-2 mb-4">
                    <span className="font-semibold">{t('downloadReport')}:</span>
                    <Button variant="info" onClick={downloadPDF} disabled={reportData.length === 0}><i className="fas fa-file-pdf mr-2"></i> {t('downloadPDF')}</Button>
                    <Button variant="success" onClick={() => downloadCSV(true)} disabled={reportData.length === 0}><i className="fas fa-file-excel mr-2"></i> {t('downloadExcel')}</Button>
                    <Button variant="primary" onClick={() => downloadCSV(false)} disabled={reportData.length === 0}><i className="fas fa-file-csv mr-2"></i> {t('downloadCSV')}</Button>
                </div>
                 <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-left">
                         <thead className="sticky top-0 bg-indigo-700">
                            <tr className="border-b border-white/20">
                                <th className="p-3">Date</th>
                                <th className="p-3">Employee</th>
                                <th className="p-3">Department</th>
                                <th className="p-3">Check-In</th>
                                <th className="p-3">Check-Out</th>
                                <th className="p-3">Work Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? reportData.map(rec => {
                                const user = getUser(rec.userId);
                                const checkIn = rec.checkInTime ? new Date(rec.checkInTime) : null;
                                const checkOut = rec.checkOutTime ? new Date(rec.checkOutTime) : null;
                                const hours = checkIn && checkOut ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2) : 'N/A';

                                return (
                                    <tr key={rec.id} className="border-b border-white/10 last:border-b-0">
                                        <td className="p-3">{rec.date}</td>
                                        <td className="p-3">{user?.fullName || 'Unknown'}</td>
                                        <td className="p-3">{user?.department || 'Unknown'}</td>
                                        <td className="p-3">{checkIn ? checkIn.toLocaleTimeString() : 'N/A'}</td>
                                        <td className="p-3">{checkOut ? checkOut.toLocaleTimeString() : 'N/A'}</td>
                                        <td className="p-3">{hours}</td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={6} className="p-6 text-center text-white/70">{t('noRecordsFound')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const AdminDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    const tabNames = {
        dashboard: t('tabDashboard'),
        employees: t('tabEmployees'),
        departments: t('tabDepartments'),
        attendance: t('tabAttendance'),
        leaves: t('tabLeave'),
        reports: t('tabReports'),
        settings: t('tabSettings'),
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'employees': return <EmployeeManagementView />;
            case 'departments': return <DepartmentManagementView />;
            case 'attendance': return <AttendanceRecordsView />;
            case 'leaves': return <AdminLeaveManagementView />;
            case 'reports': return <ReportsView />;
            case 'settings': return <AISettings />;
            case 'dashboard':
            default: return <DashboardView />;
        }
    };

    return (
        <div className="w-full max-w-7xl">
            <div className="flex justify-between items-center mb-6 text-white bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold">{t('adminDashboardTitle')}</h2>
                    <p className="opacity-80">{t('adminDashboardSubtitle')}</p>
                </div>
                <div className="text-right">
                    <div className="font-bold">{time.toLocaleDateString(undefined, { weekday: 'long' })}</div>
                    <div>{time.toLocaleDateString()}</div>
                </div>
            </div>
             <div className="flex space-x-1 sm:space-x-2 mb-4 p-2 bg-white/10 rounded-xl overflow-x-auto">
                {Object.keys(tabNames).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-2 text-sm sm:text-base rounded-lg font-semibold transition-colors flex-shrink-0 ${activeTab === tab ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'}`}
                    >
                        <i className={`fas fa-${getIconForTab(tab)} mr-2`}></i>
                        {tabNames[tab as keyof typeof tabNames]}
                    </button>
                ))}
            </div>
            {renderTabContent()}
        </div>
    );
};

const getIconForTab = (tab: string) => {
    switch (tab) {
        case 'dashboard': return 'tachometer-alt';
        case 'employees': return 'users';
        case 'departments': return 'building';
        case 'attendance': return 'calendar-check';
        case 'leaves': return 'calendar-day';
        case 'reports': return 'file-alt';
        case 'settings': return 'cogs';
        default: return 'question-circle';
    }
}

const DashboardView: React.FC = () => {
    const { users, leaveRequests } = useContext(DataContext);
    const { t } = useTranslation();
    const stats = [
        { label: t('statTotalEmployees'), value: users.length, icon: 'fa-users', color: 'from-blue-500 to-indigo-500' },
        { label: t('statPresentToday'), value: 42, icon: 'fa-user-check', color: 'from-green-500 to-emerald-500' },
        { label: t('statAbsentToday'), value: 3, icon: 'fa-user-times', color: 'from-red-500 to-rose-500' },
        { label: t('statOnLeave'), value: leaveRequests.filter(lr => lr.status === LeaveStatus.APPROVED).length, icon: 'fa-bed', color: 'from-yellow-500 to-amber-500' },
        { label: t('statActiveLocations'), value: 7, icon: 'fa-map-marker-alt', color: 'from-cyan-500 to-sky-500' },
        { label: t('statPendingLeaves'), value: leaveRequests.filter(lr => lr.status === LeaveStatus.PENDING_ADMIN || lr.status === LeaveStatus.PENDING_MANAGER).length, icon: 'fa-clock', color: 'from-purple-500 to-violet-500' },
    ];
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map(stat => (
                <div key={stat.label} className={`p-6 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg text-white`}>
                    <i className={`fas ${stat.icon} text-3xl mb-2 opacity-80`}></i>
                    <div className="text-4xl font-bold">{stat.value}</div>
                    <div className="text-lg opacity-90">{stat.label}</div>
                </div>
            ))}
        </div>
    );
};

const AISettings: React.FC = () => {
    const { settings: currentSettings, updateSettings } = useContext(SettingsContext);
    const { t } = useTranslation();
    const [localSettings, setLocalSettings] = useState<AdminSettings>(currentSettings);
    const [projectContext, setProjectContext] = useState('Moro to Ranipur highway construction project, remote area.');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reasoning, setReasoning] = useState<Record<string, string> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        setLocalSettings(currentSettings);
    }, [currentSettings]);

    const handleGetSuggestion = async () => {
        setLoading(true);
        setError('');
        setReasoning(null);
        try {
            const suggestion = await getAIConfigurationSuggestion(projectContext);
            setLocalSettings({
                radiusInMeters: suggestion.radiusInMeters,
                workingHoursStart: suggestion.workingHoursStart,
                workingHoursEnd: suggestion.workingHoursEnd,
                allowEmployeeLocationView: suggestion.allowEmployeeLocationView,
            });
            setReasoning(suggestion.reasoning);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveSettings = () => {
        setIsSaving(true);
        setSaveMessage('');
        
        setTimeout(() => {
            updateSettings(localSettings);
            setIsSaving(false);
            setSaveMessage(t('settingsSaved'));
            setTimeout(() => setSaveMessage(''), 3000);
        }, 1500);
    };

    return (
        <Card>
            <CardHeader><i className="fas fa-robot mr-2"></i> {t('aiSettingsTitle')}</CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <label className="block text-white/90 mb-2">{t('projectContextLabel')}</label>
                        <textarea
                            value={projectContext}
                            onChange={(e) => setProjectContext(e.target.value)}
                            className="w-full h-24 p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Describe the project environment, e.g., 'Urban high-rise construction site with multiple entry points.'"
                        />
                    </div>
                    <Button onClick={handleGetSuggestion} disabled={loading} className="w-full sm:w-auto">
                        {loading ? <Spinner /> : <><i className="fas fa-magic mr-2"></i> {t('getAISuggestions')}</>}
                    </Button>

                    {error && <p className="text-red-300 text-sm">{error}</p>}
                </div>
                
                <hr className="my-6 border-white/20"/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-white/90 mb-2">{t('radiusLabel')}</label>
                        <input type="number" value={localSettings.radiusInMeters} onChange={e => setLocalSettings({...localSettings, radiusInMeters: parseInt(e.target.value)})} className="w-full p-2 rounded-lg bg-white/20 border border-white/30"/>
                        {reasoning?.radius && <p className="text-sm mt-2 text-cyan-200"><i className="fas fa-info-circle mr-1"></i> {reasoning.radius}</p>}
                    </div>
                    <div>
                        <label className="block text-white/90 mb-2">{t('allowLocationViewLabel')}</label>
                        <select value={String(localSettings.allowEmployeeLocationView)} onChange={e => setLocalSettings({...localSettings, allowEmployeeLocationView: e.target.value === 'true'})} className="w-full p-2 rounded-lg bg-white/20 border border-white/30">
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                         {reasoning?.locationView && <p className="text-sm mt-2 text-cyan-200"><i className="fas fa-info-circle mr-1"></i> {reasoning.locationView}</p>}
                    </div>
                    <div>
                        <label className="block text-white/90 mb-2">{t('workingHoursStartLabel')}</label>
                        <input type="time" value={localSettings.workingHoursStart} onChange={e => setLocalSettings({...localSettings, workingHoursStart: e.target.value})} className="w-full p-2 rounded-lg bg-white/20 border border-white/30"/>
                    </div>
                     <div>
                        <label className="block text-white/90 mb-2">{t('workingHoursEndLabel')}</label>
                        <input type="time" value={localSettings.workingHoursEnd} onChange={e => setLocalSettings({...localSettings, workingHoursEnd: e.target.value})} className="w-full p-2 rounded-lg bg-white/20 border border-white/30"/>
                    </div>
                </div>
                 {reasoning?.workingHours && <p className="text-sm mt-2 text-cyan-200"><i className="fas fa-info-circle mr-1"></i> {reasoning.workingHours}</p>}

                 <div className="mt-6 flex justify-end items-center gap-4">
                    {saveMessage && <p className="text-green-300 transition-opacity duration-300">{saveMessage}</p>}
                    <Button variant="success" onClick={handleSaveSettings} disabled={isSaving}>
                        {isSaving ? <Spinner /> : <><i className="fas fa-save mr-2"></i> {t('saveSettings')}</>}
                    </Button>
                 </div>
            </CardContent>
        </Card>
    );
};

export default AdminDashboard;