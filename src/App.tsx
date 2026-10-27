import { StoreProvider, useStore } from '@/lib/store';
import { RouterProvider, useRouter } from '@/lib/router';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { ApplicationsPage } from '@/pages/Applications';
import { DocumentsPage } from '@/pages/Documents';
import { CompliancePage } from '@/pages/Compliance';
import { EVCPage } from '@/pages/EVC';
import { AlertsPage } from '@/pages/Alerts';
import { ReportsPage } from '@/pages/Reports';
import { AuditPage } from '@/pages/Audit';
import { SettingsPage } from '@/pages/Settings';

function AppContent() {
  const { currentUser } = useStore();
  const { page } = useRouter();

  if (!currentUser || page === 'login') {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'applications': return <ApplicationsPage />;
      case 'documents': return <DocumentsPage />;
      case 'compliance': return <CompliancePage />;
      case 'evc': return <EVCPage />;
      case 'alerts': return <AlertsPage />;
      case 'reports': return <ReportsPage />;
      case 'audit': return <AuditPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

export default function App() {
  return (
    <StoreProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </StoreProvider>
  );
}
