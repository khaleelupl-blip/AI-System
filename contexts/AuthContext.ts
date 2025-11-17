
import { createContext } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  isHistoryModalOpen: boolean;
  openHistoryModal: (userId?: string) => void;
  closeHistoryModal: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
  isHistoryModalOpen: false,
  openHistoryModal: () => {},
  closeHistoryModal: () => {},
});
