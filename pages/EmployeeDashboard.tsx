import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { DataContext } from '../contexts/DataContext';
import Card, { CardContent, CardHeader } from '../components/Card';
import Button from '../components/Button';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { GeolocationData, LeaveRequest, LeaveStatus, LeaveType } from '../types';
import Spinner from '../components/Spinner';
import { useTranslation } from '../contexts/LanguageContext';

// Make Leaflet available to TypeScript
declare var L: any;

// --- OFFLINE MODE HELPERS ---
const OFFLINE_QUEUE_KEY = 'attendance-offline-queue';

const getOfflineQueue = (): any[] => {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
};

const addToOfflineQueue = (data: any) => {
    const queue = getOfflineQueue();
    queue.push(data);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

const clearOfflineQueue = () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
};
// --- END OFFLINE MODE HELPERS ---

// Mock project site location (Moro, Pakistan)
const PROJECT_SITE_COORDINATES = {
  latitude: 26.6814,
  longitude: 68.0169,
};

// Haversine formula to calculate distance between two points in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const MapView = ({ center, radius }: { center: { latitude: number, longitude: number }, radius: number }) => {
    const mapRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        let isMounted = true;
        let watchId: number;

        // Initialize map
        if (mapRef.current === null) {
            mapRef.current = L.map('map-container').setView([center.latitude, center.longitude], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);

            // Add project site marker
            L.marker([center.latitude, center.longitude]).addTo(mapRef.current)
                .bindPopup(t('mapProjectCenter'));
            
            // Add geofence circle
            if(radius) {
                L.circle([center.latitude, center.longitude], {
                    color: 'blue',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                    radius: radius
                }).addTo(mapRef.current);
            }
        }

        // Start watching location
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                if (!isMounted) return;
                const { latitude, longitude } = position.coords;
                setLocationError(null);
                if (mapRef.current) {
                    const userLatLng = [latitude, longitude];
                    if (userMarkerRef.current) {
                        userMarkerRef.current.setLatLng(userLatLng);
                    } else {
                        userMarkerRef.current = L.marker(userLatLng, {
                             icon: L.divIcon({
                                className: 'user-location-marker',
                                html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>`,
                                iconSize: [24, 24],
                                iconAnchor: [12, 12]
                            })
                        }).addTo(mapRef.current).bindPopup(t('mapYourLocation'));
                    }
                    mapRef.current.panTo(userLatLng);
                }
            },
            (error) => {
                if (!isMounted) return;
                console.error("Geolocation watch error:", error);
                setLocationError(t('mapError', { message: error.message }));
            },
            { enableHighAccuracy: true }
        );

        // Cleanup function
        return () => {
            isMounted = false;
            navigator.geolocation.clearWatch(watchId);
            if (mapRef.current) {
                try {
                  mapRef.current.remove();
                } catch(e) {
                  console.warn("Could not remove map on cleanup", e)
                }
                mapRef.current = null;
            }
        };

    }, [center, radius, t]);

    return (
        <Card>
            <CardHeader>
                <i className="fas fa-map-marked-alt mr-2"></i> {t('mapTitle')}
            </CardHeader>
            <CardContent className="h-[60vh] flex flex-col">
                {locationError && (
                    <div className="bg-red-500/80 text-white p-3 rounded-lg mb-4 text-center">
                        <i className="fas fa-exclamation-triangle mr-2"></i>{locationError}
                    </div>
                )}
                <div id="map-container" className="flex-grow bg-gray-700 rounded-lg"></div>
                 <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-red-500 mr-2"></span> {t('mapProjectCenter')}</div>
                    <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white mr-2"></span> {t('mapYourLocation')}</div>
                    <div className="flex items-center"><div className="w-4 h-4 rounded-full bg-blue-500/20 border-2 border-blue-500 mr-2"></div> {t('mapAttendanceZone', { radius: radius || 'N/A' })}</div>
                </div>
            </CardContent>
        </Card>
    );
};


const LeaveManagementView: React.FC = () => {
    const { currentUser } = useContext(AuthContext);
    const { leaveRequests, addLeaveRequest } = useContext(DataContext);
    const { t } = useTranslation();
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [newLeaveRequest, setNewLeaveRequest] = useState({
        leaveType: LeaveType.SICK,
        fromDate: '',
        toDate: '',
        reason: '',
    });
    const [formError, setFormError] = useState('');

    const userLeaveRequests = leaveRequests.filter(req => req.userId === currentUser?.id);

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewLeaveRequest(prev => ({...prev, [name]: value}));
    };

    const handleSubmitLeave = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!newLeaveRequest.fromDate || !newLeaveRequest.toDate || !newLeaveRequest.reason) {
            setFormError(t('formErrors.allFieldsRequired'));
            return;
        }

        const from = new Date(newLeaveRequest.fromDate);
        const to = new Date(newLeaveRequest.toDate);

        if (to < from) {
            setFormError(t('formErrors.toDateBeforeFrom'));
            return;
        }

        const timeDiff = to.getTime() - from.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        if (!currentUser) {
            setFormError(t('formErrors.noCurrentUser'));
            return;
        }

        addLeaveRequest({
            userId: currentUser.id,
            userFullName: currentUser.fullName,
            department: currentUser.department,
            leaveType: newLeaveRequest.leaveType,
            fromDate: newLeaveRequest.fromDate,
            toDate: newLeaveRequest.toDate,
            reason: newLeaveRequest.reason,
            status: LeaveStatus.PENDING_MANAGER, // Initial status
            days: days,
        });
        
        setIsLeaveModalOpen(false);
        setNewLeaveRequest({ leaveType: LeaveType.SICK, fromDate: '', toDate: '', reason: '' });
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
            <CardHeader className="flex justify-between items-center">
                <span><i className="fas fa-calendar-day mr-2"></i> {t('leaveManagement')}</span>
                <Button variant="info" onClick={() => setIsLeaveModalOpen(true)}>
                    <i className="fas fa-plus mr-2"></i> {t('requestNewLeave')}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {userLeaveRequests.map(req => (
                        <div key={req.id} className="p-4 bg-white/10 rounded-lg">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold capitalize">{req.leaveType} Leave</p>
                                    <p className="text-sm text-white/80">{req.fromDate} to {req.toDate} ({req.days} day/s)</p>
                                    <p className="text-sm mt-1 italic">"{req.reason}"</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(req.status)}`}>{req.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            
            {isLeaveModalOpen && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <h3 className="text-xl font-bold">{t('newLeaveRequestTitle')}</h3>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitLeave} className="space-y-4">
                                <div>
                                    <label className="block text-white/90 mb-1">{t('leaveType')}</label>
                                    <select name="leaveType" value={newLeaveRequest.leaveType} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-white/20 border border-white/30">
                                        {Object.values(LeaveType).map(type => <option key={type} value={type} className="text-black capitalize">{type}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-white/90 mb-1">{t('fromDate')}</label>
                                        <input type="date" name="fromDate" value={newLeaveRequest.fromDate} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-white/20 border border-white/30"/>
                                    </div>
                                    <div>
                                        <label className="block text-white/90 mb-1">{t('toDate')}</label>
                                        <input type="date" name="toDate" value={newLeaveRequest.toDate} onChange={handleInputChange} className="w-full p-2 rounded-lg bg-white/20 border border-white/30"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-white/90 mb-1">{t('reason')}</label>
                                    <textarea name="reason" value={newLeaveRequest.reason} onChange={handleInputChange} rows={3} className="w-full p-2 rounded-lg bg-white/20 border border-white/30"></textarea>
                                </div>
                                {formError && <p className="text-red-300 text-sm">{formError}</p>}
                                <div className="flex justify-end space-x-4">
                                    <Button type="button" variant="danger" onClick={() => setIsLeaveModalOpen(false)}>{t('cancel')}</Button>
                                    <Button type="submit" variant="success">{t('submitRequest')}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                 </div>
            )}
        </Card>
    );
};


const EmployeeDashboard: React.FC = () => {
  const { currentUser, openHistoryModal } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const { attendanceRecords, addOrUpdateAttendanceRecord } = useContext(DataContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('attendance');
  const [time, setTime] = useState(new Date());

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [attendanceStatus, setAttendanceStatus] = useState<'not-checked-in' | 'checked-in' | 'checked-out'>('not-checked-in');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [lastRecordedLocation, setLastRecordedLocation] = useState<GeolocationData | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [isWithinFence, setIsWithinFence] = useState(false);
  const [distanceFromSite, setDistanceFromSite] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'check-in' | 'check-out' | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (currentUser) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecord = attendanceRecords.find(
            rec => rec.userId === currentUser.id && rec.date === todayStr
        );
        if (todaysRecord) {
            if (todaysRecord.checkOutTime) {
                setAttendanceStatus('checked-out');
                setCheckInTime(new Date(todaysRecord.checkInTime!));
                setCheckOutTime(new Date(todaysRecord.checkOutTime));
            } else if (todaysRecord.checkInTime) {
                setAttendanceStatus('checked-in');
                setCheckInTime(new Date(todaysRecord.checkInTime));
            }
        }
    }
  }, [currentUser, attendanceRecords]);


  const syncOfflineData = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    setSyncMessage(t('syncingMessage', { count: queue.length }));

    try {
        for (const record of queue) {
            await new Promise(resolve => setTimeout(resolve, 500));
            addOrUpdateAttendanceRecord({
                userId: record.userId,
                action: record.action,
                time: new Date(record.timestamp),
                location: record.location,
                selfie: record.image,
            });
        }
        clearOfflineQueue();
        setSyncMessage(t('syncCompleteMessage'));
    } catch (error) {
        console.error("Failed to sync offline data:", error);
        setSyncMessage(t('syncErrorMessage'));
    } finally {
        setIsSyncing(false);
        setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleOnline = () => { setIsOnline(true); syncOfflineData(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) syncOfflineData();

    return () => {
        clearInterval(timer);
        stopCamera();
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const stopCamera = () => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
  };
  
  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
        setLoadingMessage(t('cameraAccessDenied'));
    }
  };

  const handleSwitchCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };


  const handleAttendanceAction = (action: 'check-in' | 'check-out') => {
    setCurrentAction(action);
    setIsModalOpen(true);
    setLoadingMessage(t('initializingCamera'));
    setFacingMode('user');
    startCamera('user');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: GeolocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLastRecordedLocation(userLocation);
        setLocationError(null);
        const distance = calculateDistance(userLocation.latitude, userLocation.longitude, PROJECT_SITE_COORDINATES.latitude, PROJECT_SITE_COORDINATES.longitude);
        setDistanceFromSite(distance);
        setIsWithinFence(distance <= settings.radiusInMeters);
        setLoadingMessage(null);
      },
      (error) => {
        setLastRecordedLocation(null);
        setLocationError(t('mapError', { message: error.message }));
        setIsWithinFence(false);
        setLoadingMessage(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            if (facingMode === 'user') {
                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);
            }
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (!currentUser) return;
    setLoadingMessage(`Processing ${currentAction}...`);
    const now = new Date();

    const attendancePayload = {
        userId: currentUser.id,
        action: currentAction!,
        time: now,
        location: lastRecordedLocation,
        selfie: capturedImage,
    };

    if (!isOnline) {
        addToOfflineQueue({ ...attendancePayload, timestamp: now.toISOString(), image: capturedImage });
        if (currentAction === 'check-in') { setAttendanceStatus('checked-in'); setCheckInTime(now); } 
        else if (currentAction === 'check-out') { setAttendanceStatus('checked-out'); setCheckOutTime(now); }
        handleCloseModal();
        return;
    }

    addOrUpdateAttendanceRecord(attendancePayload);
    if (currentAction === 'check-in') { setAttendanceStatus('checked-in'); setCheckInTime(now); } 
    else if (currentAction === 'check-out') { setAttendanceStatus('checked-out'); setCheckOutTime(now); }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsModalOpen(false);
    setCapturedImage(null);
    setCurrentAction(null);
    setLocationError(null);
    setLoadingMessage(null);
    setIsWithinFence(false);
    setDistanceFromSite(null);
  };

  const chartData = [
    { name: t('chartPresent'), value: 18 },
    { name: t('chartAbsent'), value: 2 },
    { name: t('chartSundays'), value: 4 },
  ];
  const COLORS = ['#10b981', '#ef4444', '#3b82f6'];
  const tabNames = { attendance: t('tabAttendance'), map: t('tabMap'), leave: t('tabLeave') };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'map': return <MapView center={PROJECT_SITE_COORDINATES} radius={settings.radiusInMeters} />;
      case 'leave': return <LeaveManagementView />;
      case 'attendance':
      default:
        const statusText = attendanceStatus === 'checked-in' ? t('statusCheckedIn') : attendanceStatus === 'checked-out' ? t('statusCheckedOut') : t('statusNotCheckedIn');
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardContent className="text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-4xl font-bold mb-4 shadow-lg">
                    {currentUser?.avatarInitial}
                  </div>
                  <h4 className="text-xl font-bold">{t('welcomeUser', { name: currentUser?.fullName })}</h4>
                  <div className={`mt-2 inline-flex items-center text-white px-4 py-1 rounded-full text-sm font-semibold
                    ${attendanceStatus === 'checked-in' ? 'bg-green-500/80' : attendanceStatus === 'checked-out' ? 'bg-blue-500/80' : 'bg-red-500/80'}`}>
                    <i className={`fas ${attendanceStatus === 'checked-in' ? 'fa-check-circle' : attendanceStatus === 'checked-out' ? 'fa-sign-out-alt' : 'fa-clock'} mr-2`}></i>
                    {statusText}
                  </div>
                  <div className="grid grid-cols-1 gap-4 mt-6">
                    <Button variant="success" onClick={() => handleAttendanceAction('check-in')} disabled={attendanceStatus !== 'not-checked-in'}>
                        <i className="fas fa-camera mr-2"></i> {t('checkInButton')}
                    </Button>
                    <Button variant="danger" onClick={() => handleAttendanceAction('check-out')} disabled={attendanceStatus !== 'checked-in'}>
                        <i className="fas fa-camera mr-2"></i> {t('checkOutButton')}
                    </Button>
                    <Button variant="info" onClick={() => openHistoryModal()}><i className="fas fa-history mr-2"></i> {t('viewMyHistory')}</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><i className="fas fa-chart-pie mr-2"></i> {t('monthlySummary')}</CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '10px' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><i className="fas fa-clock mr-2"></i> {t('todayStatus')}</CardHeader>
              <CardContent>
                <div className="text-center mb-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
                  <div className="text-4xl font-bold">{time.toLocaleTimeString()}</div>
                  <div className="text-lg">{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-white/10 rounded-lg">
                    <i className="fas fa-sign-in-alt text-blue-300 fa-2x"></i>
                    <div>
                      <div className="font-bold">{t('checkInTime')}</div>
                      <div className="text-white/70">{checkInTime ? checkInTime.toLocaleTimeString() : '--:--:--'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-white/10 rounded-lg">
                    <i className="fas fa-sign-out-alt text-red-300 fa-2x"></i>
                    <div>
                      <div className="font-bold">{t('checkOutTime')}</div>
                      <div className="text-white/70">{checkOutTime ? checkOutTime.toLocaleTimeString() : '--:--:--'}</div>
                    </div>
                  </div>
                   {settings.allowEmployeeLocationView && (
                    <div className="flex items-center gap-4 p-3 bg-white/10 rounded-lg">
                      <i className="fas fa-map-marker-alt text-cyan-300 fa-2x"></i>
                      <div>
                        <div className="font-bold">{t('lastLocationAccuracy')}</div>
                        <div className="text-white/70 text-sm">
                          {lastRecordedLocation ? t('locationAccuracy', { accuracy: lastRecordedLocation.accuracy.toFixed(0) }) : t('locationNotRecorded')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl">
        {(!isOnline || isSyncing || syncMessage) && (
            <div className={`text-center p-2 rounded-lg mb-4 text-white font-semibold shadow-lg
                ${!isOnline ? 'bg-yellow-600/80' : isSyncing ? 'bg-blue-500/80' : 'bg-green-500/80'}`}
            >
                {!isOnline ? (
                    <><i className="fas fa-wifi mr-2"></i> {t('offlineMessage')}</>
                ) : (
                    <span className="flex items-center justify-center">
                        {isSyncing ? <Spinner /> : <i className="fas fa-check-circle mr-2"></i>}
                        <span className="ml-2">{syncMessage}</span>
                    </span>
                )}
            </div>
        )}
        <div className="flex justify-between items-center mb-6 text-white bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <div>
                <h2 className="text-2xl font-bold">{t('employeeDashboardTitle')}</h2>
                <p className="opacity-80">{t('employeeDashboardSubtitle')}</p>
            </div>
            <div className="text-right">
                <div className="font-bold">{time.toLocaleDateString(undefined, { weekday: 'long' })}</div>
                <div>{time.toLocaleDateString()}</div>
            </div>
        </div>
        <div className="flex space-x-2 mb-4 p-2 bg-white/10 rounded-xl">
            {Object.keys(tabNames).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === tab ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'}`}
                >
                    <i className={`fas fa-${tab === 'attendance' ? 'calendar-check' : tab === 'map' ? 'map' : 'calendar-day'} mr-2`}></i>
                    {tabNames[tab as keyof typeof tabNames]}
                </button>
            ))}
        </div>
        {renderTabContent()}

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="text-xl font-bold capitalize"><i className="fas fa-camera mr-2"></i> {t('cameraModalTitle', { action: currentAction || ''})}</h3>
                        <button onClick={handleCloseModal} className="text-2xl">&times;</button>
                    </CardHeader>
                    <CardContent>
                        {loadingMessage ? (
                            <div className="h-64 flex flex-col items-center justify-center">
                                <Spinner />
                                <p className="mt-4">{loadingMessage}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden">
                                  {capturedImage ? (
                                      <img 
                                        src={capturedImage} 
                                        alt="Captured selfie" 
                                        className={`rounded-lg mx-auto max-h-64 ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`} 
                                      />
                                  ) : (
                                    <>
                                      <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        playsInline 
                                        className={`w-full max-h-64 ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                                      ></video>
                                      
                                      {!locationError && distanceFromSite !== null && (
                                          <div className={`absolute inset-0 rounded-lg border-4 flex items-end justify-center pb-2 pointer-events-none ${isWithinFence ? 'border-green-500/80' : 'border-red-500/80'}`}>
                                              <div className={`px-3 py-1 rounded-full text-white font-semibold text-sm ${isWithinFence ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                                                  {isWithinFence ? (
                                                      <span><i className="fas fa-check-circle mr-1"></i> {t('inProjectZone')}</span>
                                                  ) : (
                                                      <span><i className="fas fa-times-circle mr-1"></i> {t('outsideProjectZone')}</span>
                                                  )}
                                              </div>
                                          </div>
                                      )}

                                      {stream && (
                                          <button onClick={handleSwitchCamera} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/75 transition z-10">
                                              <i className="fas fa-camera-rotate"></i>
                                          </button>
                                      )}
                                    </>
                                  )}
                                </div>

                                <canvas ref={canvasRef} className="hidden"></canvas>
                                
                                <div className="p-3 bg-white/10 rounded-lg text-sm font-semibold">
                                    {locationError ? (
                                        <p className="text-red-300"><i className="fas fa-exclamation-triangle mr-2"></i> {locationError}</p>
                                    ) : isWithinFence ? (
                                        <p className="text-green-300">
                                            <i className="fas fa-check-circle mr-2"></i>
                                            {t('locationStatusWithin', { distance: distanceFromSite?.toFixed(0), radius: settings.radiusInMeters })}
                                            {settings.allowEmployeeLocationView && ` ${t('locationAccuracy', { accuracy: lastRecordedLocation?.accuracy.toFixed(0) })}`}
                                        </p>
                                    ) : (
                                        <p className="text-red-300">
                                            <i className="fas fa-times-circle mr-2"></i>
                                            {t('locationStatusOutside', { distance: distanceFromSite?.toFixed(0), radius: settings.radiusInMeters })}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-center space-x-4 mt-4">
                                    {capturedImage ? (
                                        <>
                                            <Button variant="warning" onClick={handleRetake}>{t('retakeButton')}</Button>
                                            <Button variant="success" onClick={handleConfirm} disabled={!lastRecordedLocation || !isWithinFence}>{t('confirmButton')}</Button>
                                        </>
                                    ) : (
                                        <Button variant="primary" onClick={handleCapture} disabled={!stream}>{t('captureButton')}</Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
};

export default EmployeeDashboard;
