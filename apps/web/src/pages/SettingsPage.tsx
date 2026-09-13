import React from 'react';
import { Box, Typography, Card, CardContent, Button, Stack, Chip } from '@mui/material';
import { useI18n } from '../i18n/index';
import { getAppConfig } from '../config/index';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const config = getAppConfig();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Stack spacing={3} sx={{ mt: 2 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('settings.language')}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant={language === 'en' ? 'contained' : 'outlined'}
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
              <Button
                variant={language === 'fa' ? 'contained' : 'outlined'}
                onClick={() => setLanguage('fa')}
              >
                فارسی
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('settings.storage')}
            </Typography>
            <Chip
              label={config.mode === 'backend' ? t('mode.backend') : t('mode.clientOnly')}
              color={config.mode === 'backend' ? 'secondary' : 'primary'}
            />
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
