import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AnimalsPage from './pages/AnimalsPage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import SheltersPage from './pages/SheltersPage';
import ApplicationsPage from './pages/ApplicationsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminStatsPage from './pages/AdminStatsPage';
import ShelterManagePage from './pages/ShelterManagePage';
import AIAssistantPage from './pages/AIAssistantPage';
import ProfilePage from './pages/ProfilePage';
import NewsPage from './pages/NewsPage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import AdminModerationPage from './pages/AdminModerationPage';
import Layout from './components/Layout';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="animals" element={<AnimalsPage />} />
        <Route path="animals/:id" element={<AnimalDetailPage />} />
        <Route path="shelters" element={<SheltersPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="ai" element={<AIAssistantPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="my-submissions" element={<PrivateRoute roles={['user']}><MySubmissionsPage /></PrivateRoute>} />
        <Route path="shelter/manage" element={<PrivateRoute roles={['shelter_owner','admin']}><ShelterManagePage /></PrivateRoute>} />
        <Route path="admin/users" element={<PrivateRoute roles={['admin']}><AdminUsersPage /></PrivateRoute>} />
        <Route path="admin/stats" element={<PrivateRoute roles={['admin']}><AdminStatsPage /></PrivateRoute>} />
        <Route path="admin/moderation" element={<PrivateRoute roles={['admin']}><AdminModerationPage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Nunito', borderRadius: '10px' } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}