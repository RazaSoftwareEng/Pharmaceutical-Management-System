// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PharmaProvider } from './context/PharmaContext';
import AppRoutes from './routes/AppRoutes';
import LoginPage from './pages/auth/LoginPage';

function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-slate-500">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          Checking your session…
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  // Keyed by user so data and sync state never leak between accounts
  return (
    <PharmaProvider key={user.id}>
      <AppRoutes />
    </PharmaProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}
