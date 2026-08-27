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

// Phase 3 Pages
import RecommendationPage from './pages/RecommendationPage';

// Phase 4 Pages
import AdminDashboard from './pages/AdminDashboard';
import FpoDashboard from './pages/FpoDashboard';

function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9f5] dark:bg-darkbg-base text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <DemoDataBanner />
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 mb-16 md:mb-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { loading } = useAuth();
  if (loading) return null;
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
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
                <Route path="/register" element={<MainLayout><RegisterPage /></MainLayout>} />
                
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

                {/* Phase 2: Farmer Lot Management */}
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

                {/* Phase 3: Selling Recommendations & Net Realization */}
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

                {/* Phase 2: Order Lifecycle & Payments */}
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

                {/* Phase 2: Buyer Portal */}
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

                {/* Phase 4: FPO Aggregation Portal */}
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

                {/* Phase 4: Admin Analytics & Controls */}
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

                <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
