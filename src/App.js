import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
 
// ✅ استيراد جميع ملفات CSS
import './i18n';
import './styles/variables.css';
import './styles/global.css';
import './styles/auth.css';
import './styles/modal.css';

// ✅ إنشاء QueryClient مع إعدادات محسنة
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // لا نعيد المحاولة للأخطاء 401 و 403
        if (error.response?.status === 401 || error.response?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 دقائق
      gcTime: 10 * 60 * 1000, // 10 دقائق
    },
    mutations: {
      retry: false,
    },
  },
});

// ✅ تحميل المكونات بشكل كسول (Lazy Loading) لتحسين الأداء
const Dashboard = React.lazy(() => import('./components/admin/Dashboard'));
const UsersManagement = React.lazy(() => import('./components/admin/UsersManagement'));
const RestaurantsManagement = React.lazy(() => import('./components/admin/RestaurantsManagement'));
const OrdersManagement = React.lazy(() => import('./components/admin/OrdersManagement'));
const ItemsManagement = React.lazy(() => import('./components/admin/ItemsManagement'));
const NotificationsManagement = React.lazy(() => import('./components/admin/NotificationsManagement'));
const ReviewsManagement = React.lazy(() => import('./components/admin/ReviewsManagement'));
const SupportChat = React.lazy(() => import('./components/admin/SupportChat'));
const DriverTracking = React.lazy(() => import('./components/admin/DriverTracking'));
const Statistics = React.lazy(() => import('./components/admin/Statistics'));
const Settings = React.lazy(() => import('./components/admin/Settings'));

// ✅ مكون مؤقت للتحميل
const LoadingFallback = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>جاري التحميل...</p>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/admin/dashboard" /> : <Login />
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="restaurants" element={<RestaurantsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="items" element={<ItemsManagement />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="reviews" element={<ReviewsManagement />} />
            <Route path="support" element={<SupportChat />} />
            <Route path="tracking" element={<DriverTracking />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="/unauthorized" element={
            <div className="unauthorized-container">
              <div className="unauthorized-card">
                <h1>غير مصرح بالوصول</h1>
                <p>ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
                <button onClick={() => window.location.href = '/admin/dashboard'} className="btn btn-primary">
                  العودة للرئيسية
                </button>
              </div>
            </div>
          } />
          
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                className: 'toast',
                success: {
                  className: 'toast-success',
                  duration: 3000,
                },
                error: {
                  className: 'toast-error',
                  duration: 5000,
                },
                loading: {
                  className: 'toast-info',
                  duration: Infinity,
                },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;