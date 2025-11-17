import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { t, toggleLanguage } = useTranslation();

  return (
    <header className="bg-white/10 backdrop-blur-md text-white shadow-lg sticky top-0 z-50 border-b border-white/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <i className="fas fa-building text-xl"></i>
            <span className="font-semibold text-sm sm:text-lg">{t('companyName')}</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
             <button
                onClick={toggleLanguage}
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition duration-300 ease-in-out text-sm"
              >
                <i className="fas fa-globe mr-1"></i> {t('languageToggle')}
              </button>
            {currentUser && (
              <>
                <span className="hidden sm:block">{t('welcome')}, {currentUser.fullName}</span>
                <button
                  onClick={logout}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition duration-300 ease-in-out text-sm"
                >
                  <i className="fas fa-sign-out-alt sm:mr-2"></i> <span className="hidden sm:inline">{t('logout')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;