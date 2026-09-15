import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import { useI18n } from '../i18n/index';
import { getAppConfig } from '../config/index';
import { useRepository } from '../context/RepositoryContext';
import { Ledger, Currency, ExchangeRate, DEFAULT_CURRENCIES } from '@ledgerly/core';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const config = getAppConfig();
  const repo = useRepository();

  const [ledger, setLedger] = useState<Ledger | null>(null);

  // Rate dialog state
  const [openRateDialog, setOpenRateDialog] = useState(false);
  const [fromCode, setFromCode] = useState('EUR');
  const [toCode, setToCode] = useState('USD');
  const [rateValue, setRateValue] = useState('1.08');

  // Currency dialog state
  const [openCurrencyDialog, setOpenCurrencyDialog] = useState(false);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyName, setNewCurrencyName] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [newCurrencyDecimals, setNewCurrencyDecimals] = useState(2);

  const loadLedger = async () => {
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
  };

  useEffect(() => {
    loadLedger();
  }, [repo]);

  if (!ledger) return null;

  const currencies = ledger.currencies && ledger.currencies.length > 0
    ? ledger.currencies
    : DEFAULT_CURRENCIES;

  const rates = ledger.exchangeRates || [];

  const handleSaveRate = async () => {
    const numRate = parseFloat(rateValue);
    if (isNaN(numRate) || numRate <= 0) return;

    const newRate: ExchangeRate = {
      id: `r_${Date.now()}`,
      fromCurrencyCode: fromCode,
      toCurrencyCode: toCode,
      rate: numRate,
      updatedAt: new Date().toISOString(),
    };

    await repo.saveExchangeRate('default', newRate);
    await loadLedger();
    setOpenRateDialog(false);
  };

  const handleSaveCurrency = async () => {
    if (!newCurrencyCode.trim() || !newCurrencyName.trim() || !newCurrencySymbol.trim()) return;

    const newCurr: Currency = {
      id: newCurrencyCode.toLowerCase(),
      code: newCurrencyCode.toUpperCase(),
      name: newCurrencyName,
      symbol: newCurrencySymbol,
      decimals: newCurrencyDecimals,
    };

    await repo.saveCurrency('default', newCurr);
    await loadLedger();
    setOpenCurrencyDialog(false);
    setNewCurrencyCode('');
    setNewCurrencyName('');
    setNewCurrencySymbol('');
  };

  const handleBaseCurrencyChange = async (newBase: string) => {
    const updatedLedger: Ledger = {
      ...ledger,
      baseCurrencyCode: newBase,
      updatedAt: new Date().toISOString(),
    };
    await repo.saveLedger(updatedLedger);
    setLedger(updatedLedger);
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('settings.title')}
      </Typography>

      <Stack spacing={3} sx={{ mt: 2 }}>
        {/* Language & Storage Settings */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('settings.language')}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
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

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {t('settings.storage')}
            </Typography>
            <Chip
              label={config.mode === 'backend' ? t('mode.backend') : t('mode.clientOnly')}
              color={config.mode === 'backend' ? 'secondary' : 'primary'}
            />
          </CardContent>
        </Card>

        {/* Ledger Base Currency & Supported Currencies */}
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Supported Currencies
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenCurrencyDialog(true)}
              >
                Add Currency
              </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                select
                label="Ledger Base Currency"
                size="small"
                sx={{ width: 220 }}
                value={ledger.baseCurrencyCode || 'USD'}
                onChange={(e) => handleBaseCurrencyChange(e.target.value)}
              >
                {currencies.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {currencies.map((c) => (
                <Chip
                  key={c.code}
                  label={`${c.code} (${c.symbol}) - ${c.name}`}
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Configurable Exchange Rates */}
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CurrencyExchangeIcon color="primary" />
                Configurable Currency Exchange Rates
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenRateDialog(true)}
              >
                Configure Rate
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure conversion rates applied transparently across transactions, balances, and settlements.
            </Typography>

            {rates.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No exchange rates configured yet.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From Currency</TableCell>
                      <TableCell>To Currency</TableCell>
                      <TableCell align="right">Exchange Rate</TableCell>
                      <TableCell align="right">Last Updated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rates.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{r.fromCurrencyCode}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{r.toCurrencyCode}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          1 {r.fromCurrencyCode} = {r.rate} {r.toCurrencyCode}
                        </TableCell>
                        <TableCell align="right">
                          {new Date(r.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Dialog: Configure Exchange Rate */}
      <Dialog open={openRateDialog} onClose={() => setOpenRateDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Configure Exchange Rate</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="From Currency"
              fullWidth
              size="small"
              value={fromCode}
              onChange={(e) => setFromCode(e.target.value)}
            >
              {currencies.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.code} ({c.name})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="To Currency"
              fullWidth
              size="small"
              value={toCode}
              onChange={(e) => setToCode(e.target.value)}
            >
              {currencies.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.code} ({c.name})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Exchange Rate"
              type="number"
              fullWidth
              size="small"
              value={rateValue}
              onChange={(e) => setRateValue(e.target.value)}
              helperText={`e.g. 1 ${fromCode} = ${rateValue || '1.00'} ${toCode}`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRateDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveRate}>{t('actions.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Add Custom Currency */}
      <Dialog open={openCurrencyDialog} onClose={() => setOpenCurrencyDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Custom Currency</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Currency Code (e.g. CAD, JPY)"
              fullWidth
              size="small"
              value={newCurrencyCode}
              onChange={(e) => setNewCurrencyCode(e.target.value)}
            />
            <TextField
              label="Currency Name (e.g. Canadian Dollar)"
              fullWidth
              size="small"
              value={newCurrencyName}
              onChange={(e) => setNewCurrencyName(e.target.value)}
            />
            <TextField
              label="Symbol (e.g. C$, ¥)"
              fullWidth
              size="small"
              value={newCurrencySymbol}
              onChange={(e) => setNewCurrencySymbol(e.target.value)}
            />
            <TextField
              label="Decimals"
              type="number"
              fullWidth
              size="small"
              value={newCurrencyDecimals}
              onChange={(e) => setNewCurrencyDecimals(Number(e.target.value))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCurrencyDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveCurrency}>{t('actions.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
