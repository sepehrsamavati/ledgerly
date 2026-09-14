import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip } from '@mui/material';
import { useI18n } from '../i18n/index';
import { useRepository } from '../context/RepositoryContext';
import { Ledger, DEFAULT_CURRENCIES, formatMoney, createMoney } from '@ledgerly/core';

export const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const repo = useRepository();
  const [ledger, setLedger] = useState<Ledger | null>(null);

  useEffect(() => {
    async function load() {
      let l = await repo.getLedger('default');
      if (!l) {
        l = {
          id: 'default',
          title: 'My Shared Ledger',
          groups: [
            {
              id: 'g1',
              name: 'Housemates',
              defaultCurrencyCode: 'USD',
              participantIds: ['p1', 'p2'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          participants: [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
          ],
          transactions: [
            {
              id: 'tx1',
              groupId: 'g1',
              title: 'Groceries',
              type: 'expense',
              amount: 5000n, // $50.00
              currencyCode: 'USD',
              payerId: 'p1',
              splits: [
                { participantId: 'p1', amount: 2500n },
                { participantId: 'p2', amount: 2500n },
              ],
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await repo.saveLedger(l);
      }
      setLedger(l);
    }
    load();
  }, [repo]);

  const usd = DEFAULT_CURRENCIES.find((c) => c.code === 'USD')!;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.welcome')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {t('dashboard.summary')}
      </Typography>

      {ledger && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{ledger.title}</Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Chip label={`Groups: ${ledger.groups.length}`} color="primary" variant="outlined" />
                <Chip label={`Participants: ${ledger.participants.length}`} color="info" variant="outlined" />
                <Chip label={`Transactions: ${ledger.transactions.length}`} color="secondary" variant="outlined" />
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Sample Core Engine Output:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Format Money test: {formatMoney(createMoney(42.5, usd), usd)}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
};
