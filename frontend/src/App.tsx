import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { CreateUserPage } from './pages/CreateUserPage';
import { ProductsPage } from './pages/ProductsPage';
import { CreateProductPage } from './pages/CreateProductPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { StockAdjustmentsPage } from './pages/StockAdjustmentsPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { GoodsReceiptPage } from './pages/GoodsReceiptPage';
import { StockMovementsPage } from './pages/StockMovementsPage';
import { POSPage } from './pages/POSPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { PrintSettingsPage } from './pages/PrintSettingsPage';
import { OCRScannerPage } from './pages/OCRScannerPage';
import { OCRReviewPage } from './pages/OCRReviewPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotificationPreferencesPage } from './pages/NotificationPreferencesPage';
import BrandingManagementPage from './pages/BrandingManagementPage';
import ThemePresetsPage from './pages/ThemePresetsPage';
import TrialDashboardPage from './pages/TrialDashboardPage';
import LicenseActivationPage from './pages/LicenseActivationPage';
import LicenseManagementPage from './pages/LicenseManagementPage';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import ClientManagement from './pages/ClientManagement';
import BillingAnalytics from './pages/BillingAnalytics';
import MVPSystemDashboard from './pages/MVPSystemDashboard';
import { UserRole } from './types';

function App() {
  const { loadUser, isLoading } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.25rem',
        color: '#64748b'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN]}>
              <CreateUserPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/products/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}>
              <CreateProductPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetailPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.CASHIER]}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/suppliers"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.CASHIER]}>
              <SuppliersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock-adjustments"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}>
              <StockAdjustmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}>
              <PurchaseOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/goods-receipt"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}>
              <GoodsReceiptPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock-movements"
          element={
            <ProtectedRoute>
              <StockMovementsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.CASHIER]}>
              <POSPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN]}>
              <AnalyticsDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

          <Route
            path="/settings/print"
            element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN]}>
              <PrintSettingsPage />
            </ProtectedRoute>
          }
          />
          <Route
            path="/ocr/scanner"
            element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}>
              <OCRScannerPage />
            </ProtectedRoute>
          }
          />
          <Route
            path="/ocr/review/:scanId"
            element={
            <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}>
              <OCRReviewPage />
            </ProtectedRoute>
          }
          />
          <Route
            path="/notifications"
            element={
            <ProtectedRoute allowedRoles={Object.values(UserRole)}>
              <NotificationsPage />
            </ProtectedRoute>
          }
          />
          <Route
            path="/notifications/preferences"
            element={
            <ProtectedRoute allowedRoles={Object.values(UserRole)}>
              <NotificationPreferencesPage />
            </ProtectedRoute>
          }
          />

          {/* Branding Routes */}
          <Route
            path="/branding"
            element={
              <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN]}>
                <BrandingManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branding/themes"
            element={
              <ProtectedRoute allowedRoles={Object.values(UserRole)}>
                <ThemePresetsPage />
              </ProtectedRoute>
            }
          />

          {/* Licensing Routes */}
          <Route
            path="/licensing/trial"
            element={
              <ProtectedRoute allowedRoles={Object.values(UserRole)}>
                <TrialDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/licensing/activate"
            element={
              <ProtectedRoute allowedRoles={Object.values(UserRole)}>
                <LicenseActivationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/licensing/manage"
            element={
              <ProtectedRoute allowedRoles={[UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN]}>
                <LicenseManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Master Admin Routes */}
          <Route
            path="/master-admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.MASTER_ADMIN]}>
                <MasterAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/master-admin/clients"
            element={
              <ProtectedRoute allowedRoles={[UserRole.MASTER_ADMIN]}>
                <ClientManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/master-admin/billing"
            element={
              <ProtectedRoute allowedRoles={[UserRole.MASTER_ADMIN]}>
                <BillingAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/master-admin/mvp-system"
            element={
              <ProtectedRoute allowedRoles={[UserRole.MASTER_ADMIN]}>
                <MVPSystemDashboard />
              </ProtectedRoute>
            }
          />

        <Route
          path="/unauthorized"
          element={
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              textAlign: 'center'
            }}>
              <h1 style={{ fontSize: '3rem', color: '#ef4444', margin: '0 0 1rem' }}>403</h1>
              <h2 style={{ fontSize: '1.5rem', color: '#1e293b', margin: '0 0 0.5rem' }}>
                Unauthorized Access
              </h2>
              <p style={{ color: '#64748b', margin: '0 0 2rem' }}>
                You don't have permission to access this page
              </p>
              <a
                href="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: 600
                }}
              >
                Go to Dashboard
              </a>
            </div>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

