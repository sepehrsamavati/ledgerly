import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/index';
import { useRepository } from '../context/RepositoryContext';
import { Ledger, DEFAULT_CURRENCIES } from '@ledgerly/core';

export const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const repo = useRepository();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState<Ledger | null>(null);

  useEffect(() => {
    async function load() {
      let l = await repo.getLedger('default');
      if (!l) {
        l = {
          id: 'default',
          title: 'My Shared Ledger',
          baseCurrencyCode: 'USD',
          currencies: DEFAULT_CURRENCIES,
          exchangeRates: [
            { id: 'r1', fromCurrencyCode: 'EUR', toCurrencyCode: 'USD', rate: 1.08, updatedAt: new Date().toISOString() },
            { id: 'r2', fromCurrencyCode: 'GBP', toCurrencyCode: 'USD', rate: 1.27, updatedAt: new Date().toISOString() },
            { id: 'r3', fromCurrencyCode: 'IRT', toCurrencyCode: 'USD', rate: 0.000016, updatedAt: new Date().toISOString() },
          ],
          groups: [],
          participants: [],
          transactions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await repo.saveLedger(l);
      }
      setLedger(l);
    }
    load();
  }, [repo]);

  if (!ledger) return null;

  const baseCurrency = ledger.baseCurrencyCode || 'USD';
  const rates = ledger.exchangeRates || [];

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('dashboard.welcome')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('dashboard.summary')}
      </Typography>

      <Stack spacing={3}>
        {/* Overview Summary Card */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{ledger.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Base Ledger Currency: <strong>{baseCurrency}</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip icon={<GroupWorkIcon />} label={`Groups: ${ledger.groups.length}`} color="primary" variant="outlined" />
              <Chip icon={<PeopleIcon />} label={`Participants: ${ledger.participants.length}`} color="info" variant="outlined" />
              <Chip icon={<ReceiptLongIcon />} label={`Transactions: ${ledger.transactions.length}`} color="secondary" variant="outlined" />
              <Chip icon={<CurrencyExchangeIcon />} label={`Configured Rates: ${rates.length}`} color="success" variant="outlined" />
            </Box>
          </CardContent>
        </Card>

        {/* Quick Actions / Getting Started */}
        {ledger.groups.length === 0 ? (
          <Card variant="outlined" sx={{ textAlign: 'center', py: 4, bgcolor: 'action.hover' }}>
            <CardContent>
              <GroupWorkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                No Groups Created Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 450, mx: 'auto' }}>
                Start tracking itemized expenses or business income sharing by creating your first group.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/groups')}
              >
                Go to Groups & Create One
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Active Groups
                </Typography>
                <Button size="small" onClick={() => navigate('/groups')}>
                  Manage Groups
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {ledger.groups.map((g) => (
                  <Chip
                    key={g.id}
                    label={`${g.name} (${g.type === 'business' ? 'Business Sharing' : 'Group Costing'})`}
                    variant="outlined"
                    onClick={() => navigate('/groups')}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Active Configured Currency Exchange Rates Card */}
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CurrencyExchangeIcon color="primary" fontSize="small" />
                Configured Currency Exchange Rates
              </Typography>
              <Button size="small" onClick={() => navigate('/settings')}>
                Configure Rates
              </Button>
            </Box>

            {rates.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No exchange rates configured. Add rates in Settings to enable transparent multi-currency conversions.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                {rates.map((r) => (
                  <Chip
                    key={r.id}
                    label={`1 ${r.fromCurrencyCode} = ${r.rate} ${r.toCurrencyCode}`}
                    variant="filled"
                    color="default"
                    size="small"
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
