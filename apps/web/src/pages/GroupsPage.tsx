import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { useI18n } from '../i18n/index';

export const GroupsPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('groups.title')}
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography color="text.secondary">{t('groups.empty')}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
