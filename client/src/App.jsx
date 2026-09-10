import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import DemoDataBanner from './components/common/DemoDataBanner';

// Phase 1 Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FarmerDashboard from './pages/FarmerDashboard';
import MarketPrices from './pages/MarketPrices';
import NotFound from './pages/NotFound';

// Phase 2 Pages
import CreateLot from './pages/CreateLot';
import MyLots from './pages/MyLots';
import LotDetail from './pages/LotDetail';
import OrdersPage from './pages/OrdersPage';
import OrderDetail from './pages/OrderDetail';
import BuyerDashboard from './pages/BuyerDashboard';

// Phase 3
import RecommendationPage from './pages/RecommendationPage';

// Phase 4
import AdminDashboard from './pages/AdminDashboard';
import FpoDashboard from './pages/FpoDashboard';


function MainLayout({ children }) {
  const {
    user,
    logout,
  } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f9f5] text-slate-900 transition-colors duration-200 dark:bg-darkbg-base dark:text-slate-100">

      {/* Demo data notice */}
      <DemoDataBanner />

      {/* Main header */}
      <Header
        user={user}
        onLogout={logout}
      />

      {/* Page content */}
      <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-7xl px-3 py-5 pb-24 sm:px-6 sm:py-7 sm:pb-10 lg:px-8">

        <ErrorBoundary>
          {children}
        </ErrorBoundary>

      </main>

      {/* Mobile navigation */}
      <BottomNav />

    </div>
  );
}


function ProtectedRoute({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f5] dark:bg-darkbg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading KrishiLink...
          </p>
        </div>
      </div>
    );
  }

  return children;
}


export default function App() {
  return (
    <ErrorBoundary>

      <ThemeProvider>

        <LanguageProvider>

          <AuthProvider>

            <BrowserRouter>

              <Routes>

                {/* ==================== PUBLIC ==================== */}

                <Route
                  path="/landing"
                  element={<LandingPage />}
                />

                <Route
                  path="/login"
                  element={
                    <MainLayout>
                      <LoginPage />
                    </MainLayout>
                  }
                />

                <Route
                  path="/register"
                  element={
                    <MainLayout>
                      <RegisterPage />
                    </MainLayout>
                  }
                />


                {/* ==================== FARMER ==================== */}

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <FarmerDashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/market"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <MarketPrices />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/sell"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <CreateLot />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-lots"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <MyLots />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-lots/:id"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <LotDetail />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* ==================== RECOMMENDATIONS ==================== */}

                <Route
                  path="/recommendations/:lotId"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <RecommendationPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />


                {/* ==================== ORDERS ==================== */}

                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OrdersPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <OrderDetail />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />


                {/* ==================== BUYER ==================== */}

                <Route
                  path="/buyer"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <BuyerDashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />


                {/* ==================== FPO ==================== */}

                <Route
                  path="/fpo"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <FpoDashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />


                {/* ==================== ADMIN ==================== */}

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <AdminDashboard />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />


                {/* ==================== 404 ==================== */}

                <Route
                  path="*"
                  element={
                    <MainLayout>
                      <NotFound />
                    </MainLayout>
                  }
                />

              </Routes>

            </BrowserRouter>

          </AuthProvider>

        </LanguageProvider>

      </ThemeProvider>

    </ErrorBoundary>
  );
}
