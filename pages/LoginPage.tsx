import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { User, Role } from '../types';
import Card, { CardContent, CardHeader } from '../components/Card';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { useTranslation } from '../contexts/LanguageContext';


const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('employee');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mock authentication
    setTimeout(() => {
      let user: User | null = null;
      if (password === 'password') {
        if (username === 'employee') {
          user = { id: 'user001', username: 'employee', fullName: 'John Doe', role: Role.EMPLOYEE, department: 'Construction', position: 'Site Worker', avatarInitial: 'J' };
        } else if (username === 'manager') {
          user = { id: 'mgr001', username: 'manager', fullName: 'Jane Smith', role: Role.MANAGER, department: 'Construction', position: 'Site Manager', avatarInitial: 'J' };
        } else if (username === 'admin') {
          user = { id: 'adm001', username: 'admin', fullName: 'Alex Johnson', role: Role.ADMIN, department: 'HQ', position: 'System Admin', avatarInitial: 'A' };
        }
      }

      if (user) {
        login(user);
      } else {
        setError(t('loginError'));
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center bg-white/10">
          <h3 className="text-2xl font-bold"><i className="fas fa-user-circle mr-2"></i> {t('loginTitle')}</h3>
          <p className="text-white/80">{t('loginSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-white/90 mb-2" htmlFor="username">{t('usernameLabel')}</label>
              <input 
                type="text" 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="employee / manager / admin"
              />
            </div>
            <div className="mb-6">
              <label className="block text-white/90 mb-2" htmlFor="password">{t('passwordLabel')}</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="password"
              />
            </div>
            {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner /> : <><i className="fas fa-sign-in-alt mr-2"></i> {t('loginButton')}</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
