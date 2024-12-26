import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

interface Restaurant {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
