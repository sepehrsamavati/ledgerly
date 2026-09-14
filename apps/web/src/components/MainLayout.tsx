import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Chip,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import { useI18n } from '../i18n/index';
import { getAppConfig } from '../config/index';

export const MainLayout: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const config = getAppConfig();

  const currentTab = location.pathname.startsWith('/groups')
    ? '/groups'
    : location.pathname.startsWith('/settings')
    ? '/settings'
    : '/';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          minHeight: '100vh',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: { sm: 3 },
          position: 'relative',
        }}
      >
        <AppBar position="sticky" elevation={1} color="primary">
          <Toolbar variant="dense" sx={{ justifyContent: 'space-between', paddingInlineStart: 2, paddingInlineEnd: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {t('app.title')}
              </Typography>
              <Chip
                size="small"
                label={config.mode === 'backend' ? t('mode.backend') : t('mode.clientOnly')}
                color={config.mode === 'backend' ? 'secondary' : 'default'}
                variant="outlined"
                sx={{
                  color: 'primary.contrastText',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.7rem',
                  height: 22,
                  marginInlineStart: 1,
                }}
              />
            </Box>

            <Button
              color="inherit"
              variant="outlined"
              size="small"
              onClick={() => setLanguage(language === 'en' ? 'fa' : 'en')}
              sx={{
                marginInlineStart: 'auto',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              {language === 'en' ? 'FA' : 'EN'}
            </Button>
          </Toolbar>
        </AppBar>

        <Container
          component="main"
          sx={{
            flexGrow: 1,
            pt: 3,
            pb: 10,
            paddingInlineStart: 2,
            paddingInlineEnd: 2,
          }}
        >
          <Outlet />
        </Container>

        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 0,
            insetInlineStart: 0,
            insetInlineEnd: 0,
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 600 }}>
            <BottomNavigation
              value={currentTab}
              onChange={(_event, newValue) => {
                navigate(newValue);
              }}
              showLabels
              sx={{
                '& .MuiBottomNavigationAction-root': {
                  paddingInlineStart: 1,
                  paddingInlineEnd: 1,
                },
              }}
            >
              <BottomNavigationAction
                label={t('nav.dashboard')}
                value="/"
                icon={<DashboardIcon />}
              />
              <BottomNavigationAction
                label={t('nav.groups')}
                value="/groups"
                icon={<GroupIcon />}
              />
              <BottomNavigationAction
                label={t('nav.settings')}
                value="/settings"
                icon={<SettingsIcon />}
              />
            </BottomNavigation>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};
