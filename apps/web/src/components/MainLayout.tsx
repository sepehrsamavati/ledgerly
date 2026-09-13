import React from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import { useI18n } from '../i18n/index';
import { getAppConfig } from '../config/index';

export const MainLayout: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const location = useLocation();
  const config = getAppConfig();

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {t('app.title')}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              color="inherit"
              component={RouterLink}
              to="/"
              sx={{ fontWeight: location.pathname === '/' ? 'bold' : 'normal' }}
            >
              {t('nav.dashboard')}
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/groups"
              sx={{ fontWeight: location.pathname === '/groups' ? 'bold' : 'normal' }}
            >
              {t('nav.groups')}
            </Button>
            <Button
              color="inherit"
              component={RouterLink}
              to="/settings"
              sx={{ fontWeight: location.pathname === '/settings' ? 'bold' : 'normal' }}
            >
              {t('nav.settings')}
            </Button>

            <Button
              color="inherit"
              variant="outlined"
              size="small"
              onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
              sx={{ ml: 2 }}
            >
              {language === 'en' ? 'FA' : 'EN'}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Chip
            size="small"
            label={config.mode === 'backend' ? t('mode.backend') : t('mode.clientOnly')}
            color={config.mode === 'backend' ? 'secondary' : 'primary'}
            variant="outlined"
          />
        </Box>
        <Outlet />
      </Container>
    </Box>
  );
};
