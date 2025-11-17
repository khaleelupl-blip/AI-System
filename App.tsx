import React, { useState, useMemo, useContext } from 'react';
import { User, Role, AdminSettings, AttendanceRecord } from './types';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthContext } from './contexts/AuthContext';
import { SettingsContext } from './contexts/SettingsContext';
import { DataProvider, DataContext } from './contexts/DataContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Card, { CardContent, CardHeader } from './components/Card';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';


const GlobalHistoryModal: React.FC<{ userId: string; onClose: () => void }> = ({ userId, onClose }) => {
    const { users, attendanceRecords } = useContext(DataContext);
    const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);
    const { t } = useTranslation();

    const user = users.find(u => u.id === userId);
    const userHistory = attendanceRecords
        .filter(rec => rec.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
                <CardHeader className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">
                        <i className="fas fa-history mr-2"></i> {t('historyModalTitle', { name: user?.fullName || 'Employee' })}
                    </h3>
                    <button onClick={onClose} className="text-2xl">&times;</button>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                    {userHistory.length > 0 ? (
                        <div className="space-y-4">
                            {userHistory.map(record => (
                                <div key={record.id} className="p-4 bg-white/10 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <div>
                                        <p className="font-bold text-lg">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <hr className="border-white/20 my-2" />
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Check-in */}
                                            <div>
                                                <p className="font-semibold text-green-300">{t('checkInTime')}</p>
                                                <p>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A'}</p>
                                                {record.checkInLocation && (
                                                    <p className="text-xs text-white/70">
                                                        <i className="fas fa-map-marker-alt mr-1"></i>
                                                        {t('locationAccuracy', { accuracy: record.checkInLocation.accuracy.toFixed(0) })}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Check-out */}
                                            <div>
                                                <p className="font-semibold text-red-300">{t('checkOutTime')}</p>
                                                <p>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A'}</p>
                                                {record.checkOutLocation && (
                                                    <p className="text-xs text-white/70">
                                                        <i className="fas fa-map-marker-alt mr-1"></i>
                                                        {t('locationAccuracy', { accuracy: record.checkOutLocation.accuracy.toFixed(0) })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-4">
                                        {record.checkInSelfie ? (
                                            <img src={record.checkInSelfie} alt="Check-in" className="w-24 h-24 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105" onClick={() => setSelectedSelfie(record.checkInSelfie)} />
                                        ) : <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center text-xs text-white/50">No Selfie</div>}
                                        {record.checkOutSelfie ? (
                                            <img src={record.checkOutSelfie} alt="Check-out" className="w-24 h-24 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105" onClick={() => setSelectedSelfie(record.checkOutSelfie)} />
                                        ) : <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center text-xs text-white/50">No Selfie</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <i className="fas fa-file-alt text-4xl text-white/30 mb-4"></i>
                            <p className="text-white/70">{t('noHistoryRecords')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Selfie Viewer Modal */}
            {selectedSelfie && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => setSelectedSelfie(null)}>
                    <img src={selectedSelfie} alt="Selfie" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl" />
                </div>
            )}
        </div>
    );
};


const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AdminSettings>({
    radiusInMeters: 200,
    workingHoursStart: '06:00',
    workingHoursEnd: '22:00',
    allowEmployeeLocationView: true,
  });

  const authContextValue = useMemo(() => {
    const openHistoryModal = (userId?: string) => {
        setHistoryUserId(userId || currentUser?.id || null);
        setIsHistoryModalOpen(true);
    };

    const closeHistoryModal = () => {
        setIsHistoryModalOpen(false);
        setHistoryUserId(null);
    };

    return {
        currentUser,
        login: (user: User) => setCurrentUser(user),
        logout: () => setCurrentUser(null),
        isHistoryModalOpen,
        openHistoryModal,
        closeHistoryModal,
    };
  }, [currentUser, isHistoryModalOpen]);

  const settingsContextValue = useMemo(() => ({
    settings,
    updateSettings: (newSettings: AdminSettings) => setSettings(newSettings)
  }), [settings]);


  const renderDashboard = () => {
    if (!currentUser) {
      return <LoginPage />;
    }
    switch (currentUser.role) {
      case Role.EMPLOYEE:
        return <EmployeeDashboard />;
      case Role.MANAGER:
        return <ManagerDashboard />;
      case Role.ADMIN:
        return <AdminDashboard />;
      default:
        return <LoginPage />;
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <SettingsContext.Provider value={settingsContextValue}>
        <DataProvider>
          <div className="main-wrapper flex flex-col min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600">
            <Header />
            <main className="content-wrapper flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
              {renderDashboard()}
            </main>
            {isHistoryModalOpen && historyUserId && (
              <GlobalHistoryModal userId={historyUserId} onClose={authContextValue.closeHistoryModal} />
            )}
            <Footer />
          </div>
        </DataProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
};

const App: React.FC = () => (
    <LanguageProvider>
        <AppContent />
    </LanguageProvider>
);

export default App;
