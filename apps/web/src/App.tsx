import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/index';
import { RepositoryProvider } from './context/RepositoryContext';
import { AppThemeProvider } from './theme/AppThemeProvider';
import { MainLayout } from './components/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { GroupsPage } from './pages/GroupsPage';
import { SettingsPage } from './pages/SettingsPage';
import { getAppConfig } from './config/index';

export const App: React.FC = () => {
  const config = getAppConfig();

  return (
    <I18nProvider>
      <RepositoryProvider>
        <AppThemeProvider>
          <BrowserRouter basename={config.basePath}>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppThemeProvider>
      </RepositoryProvider>
    </I18nProvider>
  );
};

export default App;
