import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { DataContext } from '../contexts/DataContext';
import Card, { CardContent, CardHeader } from '../components/Card';
import { LeaveRequest, LeaveStatus, LeaveType, User } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

// Make Leaflet available to TypeScript
declare var L: any;

// Mock project site location
const PROJECT_SITE_COORDINATES = {
  latitude: 26.6814,
  longitude: 68.0169,
};

const LiveMapView: React.FC<{ employees: User[], center: typeof PROJECT_SITE_COORDINATES, radius: number }> = ({ employees, center, radius }) => {
    const mapRef = useRef<any>(null);
    const employeeMarkersRef = useRef<Record<string, any>>({});
    const [employeeLocations, setEmployeeLocations] = useState<Record<string, { lat: number, lng: number }>>({});
    const { t } = useTranslation();

    // Initialize mock locations
    useEffect(() => {
        const initialLocations: Record<string, { lat: number, lng: number }> = {};
        employees.forEach(emp => {
            initialLocations[emp.id] = {
                lat: center.latitude + (Math.random() - 0.5) * 0.005,
                lng: center.longitude + (Math.random() - 0.5) * 0.005,
            };
        });
        setEmployeeLocations(initialLocations);

        // Simulate real-time movement
        const interval = setInterval(() => {
            setEmployeeLocations(prev => {
                const newLocations = { ...prev };
                Object.keys(newLocations).forEach(id => {
                    newLocations[id] = {
                        lat: newLocations[id].lat + (Math.random() - 0.5) * 0.0001,
                        lng: newLocations[id].lng + (Math.random() - 0.5) * 0.0001,
                    };
                });
                return newLocations;
            });
        }, 5000);

        return () => clearInterval(interval);

    }, [employees, center]);


    useEffect(() => {
        // Initialize map
        if (mapRef.current === null) {
            mapRef.current = L.map('manager-map-container').setView([center.latitude, center.longitude], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);

            // Add project site marker
            L.marker([center.latitude, center.longitude]).addTo(mapRef.current)
                .bindPopup(t('mapProjectCenter'));
            
            // Add geofence circle
            L.circle([center.latitude, center.longitude], {
                color: 'blue',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                radius: radius
            }).addTo(mapRef.current);
        }

        // Update employee markers
        employees.forEach(emp => {
            const empLocation = employeeLocations[emp.id];
            if (empLocation) {
                const empLatLng = [empLocation.lat, empLocation.lng];
                 if (employeeMarkersRef.current[emp.id]) {
                    employeeMarkersRef.current[emp.id].setLatLng(empLatLng);
                } else {
                    employeeMarkersRef.current[emp.id] = L.marker(empLatLng).addTo(mapRef.current)
                        .bindPopup(`${emp.fullName} - ${emp.position}`);
                }
            }
        });

        // Cleanup function for when component unmounts
        return () => {
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch(e) { console.warn("Could not remove map on cleanup", e) }
                mapRef.current = null;
            }
        };

    }, [center, radius, employees, employeeLocations, t]);


    return (
        <Card>
            <CardHeader>
                <i className="fas fa-broadcast-tower mr-2"></i> {t('liveMapTitle')}
            </CardHeader>
            <CardContent className="h-[70vh] flex flex-col">
                <div id="manager-map-container" className="flex-grow bg-gray-700 rounded-lg"></div>
                 <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-red-500 mr-2"></span> {t('mapProjectCenter')}</div>
                    <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-blue-500 mr-2"></span> Employee</div>
                    <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-blue-500/20 border-2 border-blue-500 mr-2"></span> {t('mapAttendanceZone', { radius })}</div>
                </div>
            </CardContent>
        </Card>
    );
}

const ManagerDashboard: React.FC = () => {
    const { currentUser } = useContext(AuthContext);
    const { users, leaveRequests, updateLeaveStatus } = useContext(DataContext);
    const { t } = useTranslation();
    const [time, setTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('dashboard');
    
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const departmentEmployees = users.filter(u => u.department === currentUser?.department);
    
    const pendingLeaveRequests = leaveRequests.filter(req => 
        req.department === currentUser?.department && req.status === LeaveStatus.PENDING_MANAGER
    );

    const handleApprove = (id: string) => {
        updateLeaveStatus(id, LeaveStatus.PENDING_ADMIN);
    };

    const handleReject = (id: string) => {
        updateLeaveStatus(id, LeaveStatus.REJECTED);
    };
    
    const stats = [
        { label: t('statDepartmentEmployees'), value: departmentEmployees.length, icon: 'fa-users', color: 'from-blue-500 to-indigo-500' },
        { label: t('statPresentToday'), value: 12, icon: 'fa-user-check', color: 'from-green-500 to-emerald-500' },
        { label: t('statOnLeave'), value: 1, icon: 'fa-bed', color: 'from-yellow-500 to-amber-500' },
        { label: t('statLateToday'), value: 2, icon: 'fa-clock', color: 'from-red-500 to-rose-500' },
    ];

    const renderTabContent = () => {
        switch(activeTab) {
            case 'map':
                return <LiveMapView employees={departmentEmployees} center={PROJECT_SITE_COORDINATES} radius={200} />;
            case 'dashboard':
            default:
                return (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            {stats.map(stat => (
                                <div key={stat.label} className={`p-6 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg text-white`}>
                                    <i className={`fas ${stat.icon} text-3xl mb-2 opacity-80`}></i>
                                    <div className="text-4xl font-bold">{stat.value}</div>
                                    <div className="text-lg opacity-90">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><i className="fas fa-users mr-2"></i> {t('departmentEmployeesTitle')}</CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/20">
                                                    <th className="p-3">Name</th>
                                                    <th className="p-3">Position</th>
                                                    <th className="p-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {departmentEmployees.map((emp) => (
                                                    <tr key={emp.id} className="border-b border-white/10 last:border-b-0">
                                                        <td className="p-3">{emp.fullName}</td>
                                                        <td className="p-3 text-white/80">{emp.position}</td>
                                                        <td className="p-3"><span className="px-2 py-1 text-xs rounded-full bg-green-500">{t('statusCheckedIn')}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><i className="fas fa-calendar-day mr-2"></i> {t('pendingLeaveRequestsTitle')}</CardHeader>
                                <CardContent>
                                    {pendingLeaveRequests.length > 0 ? pendingLeaveRequests.map(req => (
                                        <div key={req.id} className="p-3 bg-white/10 rounded-lg mb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold">{req.userFullName} - <span className="capitalize font-medium text-yellow-300">{req.leaveType} Leave</span></p>
                                                    <p className="text-sm text-white/80">{req.fromDate} to {req.toDate} ({req.days} day/s)</p>
                                                    <p className="text-sm mt-1 italic">"{req.reason}"</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleApprove(req.id)} className="px-2 py-1 text-xs bg-green-500 rounded hover:bg-green-600"><i className="fas fa-check"></i></button>
                                                    <button onClick={() => handleReject(req.id)} className="px-2 py-1 text-xs bg-red-500 rounded hover:bg-red-600"><i className="fas fa-times"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <p className="text-white/70">{t('noPendingLeaves')}</p>}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                );
        }
    }

    return (
        <div className="w-full max-w-7xl">
            <div className="flex justify-between items-center mb-6 text-white bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold">{t('managerDashboardTitle')}</h2>
                    <p className="opacity-80">{t('managerDashboardSubtitle')}</p>
                </div>
                <div className="text-right">
                    <div className="font-bold">{time.toLocaleDateString(undefined, { weekday: 'long' })}</div>
                    <div>{time.toLocaleDateString()}</div>
                </div>
            </div>

            <div className="flex space-x-2 mb-4 p-2 bg-white/10 rounded-xl">
                {['dashboard', 'map'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === tab ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'}`}
                    >
                        <i className={`fas fa-${tab === 'dashboard' ? 'tachometer-alt' : 'map-marker-alt'} mr-2`}></i>
                        {tab === 'dashboard' ? t('tabDashboard') : t('tabLiveMap')}
                    </button>
                ))}
            </div>
            
            {renderTabContent()}

        </div>
    );
};

export default ManagerDashboard;
