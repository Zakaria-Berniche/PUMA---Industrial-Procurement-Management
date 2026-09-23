/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useStore } from './store/useStore';
import { ShieldAlert } from 'lucide-react';
import { PermissionAction } from './types';

// Lazy loaded pages
const Dashboard = React.lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Kanban = React.lazy(() => import('./pages/Kanban').then((module) => ({ default: module.Kanban })));
const Tasks = React.lazy(() => import('./pages/Tasks').then((module) => ({ default: module.Tasks })));
const CalendarView = React.lazy(() => import('./pages/Calendar').then((module) => ({ default: module.CalendarView })));
const Settings = React.lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));
const Profile = React.lazy(() => import('./pages/Profile').then((module) => ({ default: module.Profile })));
const Login = React.lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Procurement = React.lazy(() => import('./pages/Procurement').then((module) => ({ default: module.Procurement })));
const Analysis = React.lazy(() => import('./pages/Analysis'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center space-y-4">
    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
    <p className="text-slate-400 text-sm font-medium animate-pulse">Chargement du module...</p>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ModuleRoute({ children, moduleName }: { children: React.ReactNode; moduleName: PermissionAction }) {
  const { isAuthenticated, currentUser, hasPermission } = useStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!hasPermission(currentUser, moduleName)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full min-h-[60vh] animate-in fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-3xl font-bold text-slate-50 mb-3">Accès Refusé</h3>
        <p className="text-slate-400 max-w-md text-lg">
          Vous n'avez pas les permissions nécessaires pour accéder à ce module. Veuillez contacter votre administrateur
          si vous pensez qu'il s'agit d'une erreur.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

import { Toast, ToastType } from './components/ui/Toast';
import { GlobalSearch } from './components/GlobalSearch';

export default function App() {
  const [toast, setToast] = React.useState<{ message: string; type: ToastType } | null>(null);

  React.useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupSSE = () => {
      const token = localStorage.getItem('puma_token');
      if (!token) return;

      eventSource = new EventSource(`/api/stream?token=${token}`);
      
      eventSource.onmessage = (event) => {
        try {
          const { event: eventType, data } = JSON.parse(event.data);
          const state = useStore.getState();

          switch (eventType) {
            case 'TASKS_UPDATED':
              useStore.setState({
                objectives: state.objectives.map((obj) => obj.id === data.id ? data : obj)
              });
              if (data.status === 'Terminé' && state.currentUser?.id === data.managerId) {
                setToast({ message: `Tâche terminée : ${data.title}`, type: 'success' });
              }
              break;
            case 'TASKS_CREATED':
              if (!state.objectives.find(o => o.id === data.id)) {
                useStore.setState({
                  objectives: [data, ...state.objectives]
                });
                if (state.currentUser?.id === data.assigneeId) {
                  setToast({ message: `Nouvelle tâche assignée : ${data.title}`, type: 'info' });
                }
              }
              break;
            case 'TASKS_DELETED':
              useStore.setState({
                objectives: state.objectives.filter((obj) => obj.id !== data.id)
              });
              break;
            case 'NOTIFICATIONS_CREATED':
              if (!state.notifications.find(n => n.id === data.id)) {
                useStore.setState({
                  notifications: [data, ...state.notifications]
                });
                setToast({ message: data.message, type: 'success' });
              }
              break;
            case 'PROCUREMENT_CAMPAIGNS_UPDATED':
              useStore.setState({
                procurementCampaigns: state.procurementCampaigns.map((c) => c.id === data.id ? data : c)
              });
              break;
            case 'PROCUREMENT_SUPPLIERS_CREATED':
              if (!state.procurementSuppliers.find(s => s.id === data.id)) {
                useStore.setState({
                  procurementSuppliers: [data, ...state.procurementSuppliers]
                });
              }
              break;
            case 'GLOBAL_SUPPLIERS_CREATED':
              if (!state.globalSuppliers.find(s => s.id === data.id)) {
                useStore.setState({
                  globalSuppliers: [data, ...state.globalSuppliers]
                });
              }
              break;
            case 'PROCUREMENT_SUPPLIERS_CLEARED':
              useStore.setState({
                procurementSuppliers: state.procurementSuppliers.filter((s) => s.campaignId !== data.campaignId)
              });
              break;
          }
        } catch (err) {
          console.error("Failed to parse SSE message", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE connection error", err);
        eventSource?.close();
        // Retry after 5s
        setTimeout(setupSSE, 5000);
      };
    };

    // A3 — Validate token on app startup to auto-logout if session expired
    const validateSessionAndInit = async () => {
      const state = useStore.getState();
      if (!state.isAuthenticated) return;

      const token = localStorage.getItem('puma_token');
      if (!token) {
        state.logout();
        return;
      }

      try {
        const res = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          // Token expired or invalid — auto-logout
          state.logout();
          return;
        }
        // Refresh the current user data from the server
        const freshUser = await res.json();
        useStore.setState({ currentUser: freshUser });
        state.initializeStore();
        setupSSE();
      } catch {
        // Network error — don't logout, just initialize from cache
        state.initializeStore();
        setupSSE();
      }
    };

    validateSessionAndInit();

    return () => {
      eventSource?.close();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Suspense
          fallback={
            <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          }
        >
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
          <GlobalSearch />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ModuleRoute moduleName="modules.dashboard">
                      <Dashboard />
                    </ModuleRoute>
                  </Suspense>
                }
              />
              <Route
                path="kanban"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ModuleRoute moduleName="modules.kanban">
                      <Kanban />
                    </ModuleRoute>
                  </Suspense>
                }
              />
              <Route
                path="tasks"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ModuleRoute moduleName="modules.tasks">
                      <Tasks />
                    </ModuleRoute>
                  </Suspense>
                }
              />
              <Route
                path="calendar"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ModuleRoute moduleName="modules.calendar">
                      <CalendarView />
                    </ModuleRoute>
                  </Suspense>
                }
              />
              <Route
                path="procurement"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ModuleRoute moduleName="modules.procurement">
                      <Procurement />
                    </ModuleRoute>
                  </Suspense>
                }
              />
              <Route
                path="analysis"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ModuleRoute moduleName="modules.analysis">
                      <Analysis />
                    </ModuleRoute>
                  </Suspense>
                }
              />

              <Route
                path="settings"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ModuleRoute moduleName="modules.admin">
                      <Settings />
                    </ModuleRoute>
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Profile />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
