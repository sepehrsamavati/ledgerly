import React, { useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { useI18n } from '../i18n/index';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { direction } = useI18n();

  const theme = useMemo(
    () =>
      createTheme({
        direction: direction,
        palette: {
          mode: 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [direction]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div dir={direction}>{children}</div>
    </ThemeProvider>
  );
};
