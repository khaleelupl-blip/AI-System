
import { createContext } from 'react';
import { AdminSettings } from '../types';

interface SettingsContextType {
  settings: AdminSettings;
  updateSettings: (newSettings: AdminSettings) => void;
}

// Default settings for initial load
const defaultSettings: AdminSettings = {
  radiusInMeters: 200,
  workingHoursStart: '06:00',
  workingHoursEnd: '22:00',
  allowEmployeeLocationView: true,
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});
