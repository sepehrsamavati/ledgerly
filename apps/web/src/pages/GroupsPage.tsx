import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useI18n } from '../i18n/index';
import { useRepository } from '../context/RepositoryContext';
import {
  Ledger,
  Group,
  GroupType,
  Participant,
  Transaction,
  TransactionType,
  DEFAULT_CURRENCIES,
  formatMoney,
  createMoney,
  calculateEqualSplits,
  calculatePercentageSplits,
  calculateParticipantBalances,
  calculateSettlement,
} from '@ledgerly/core';

export const GroupsPage: React.FC = () => {
  const { t } = useI18n();
  const repo = useRepository();
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Dialog state: Create Group
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [newGroupType, setNewGroupType] = useState<GroupType>('costing');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCurrency, setNewGroupCurrency] = useState('USD');

  // Dialog state: Add Participant
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberPercentage, setMemberPercentage] = useState<number>(50);

  // Dialog state: Add Transaction for Group Costing
  const [openCostingTxDialog, setOpenCostingTxDialog] = useState(false);
  const [costingTitle, setCostingTitle] = useState('');
  const [costingAmount, setCostingAmount] = useState<string>('');
  const [costingPayerId, setCostingPayerId] = useState('');
  const [costingTargetIds, setCostingTargetIds] = useState<string[]>([]);

  // Dialog state: Add Transaction for Business Sharing
  const [openBusinessTxDialog, setOpenBusinessTxDialog] = useState(false);
  const [businessTitle, setBusinessTitle] = useState('');
  const [businessTxType, setBusinessTxType] = useState<TransactionType>('income');
  const [businessAmount, setBusinessAmount] = useState<string>('');
  const [businessPayerId, setBusinessPayerId] = useState('');

  const loadLedger = async () => {
    let l = await repo.getLedger('default');
    if (!l) {
      l = {
        id: 'default',
        title: 'My Shared Ledger',
        groups: [
          {
            id: 'g1',
            name: 'Trip to Beach (Group Costing)',
            type: 'costing',
            description: 'Itemized equal sharing among selected members',
            defaultCurrencyCode: 'USD',
            participantIds: ['p1', 'p2', 'p3'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'g2',
            name: 'Software Agency (Business Sharing)',
            type: 'business',
            description: 'Percentage-based revenue & expense sharing',
            defaultCurrencyCode: 'USD',
            participantIds: ['p1', 'p2'],
            members: [
              { participantId: 'p1', percentage: 60 },
              { participantId: 'p2', percentage: 40 },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        participants: [
          { id: 'p1', name: 'Alice' },
          { id: 'p2', name: 'Bob' },
          { id: 'p3', name: 'Charlie' },
        ],
        transactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repo.saveLedger(l);
    }
    setLedger(l);
    if (!selectedGroupId && l.groups.length > 0) {
      setSelectedGroupId(l.groups[0].id);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [repo]);

  if (!ledger) return null;

  const currentGroup = ledger.groups.find((g) => g.id === selectedGroupId);
  const isBusinessGroup = currentGroup?.type === 'business';

  const groupParticipants = currentGroup
    ? ledger.participants.filter((p) => currentGroup.participantIds.includes(p.id))
    : [];
  const groupTransactions = currentGroup
    ? ledger.transactions.filter((tx) => tx.groupId === currentGroup.id)
    : [];

  const currencyObj = DEFAULT_CURRENCIES.find(
    (c) => c.code === (currentGroup?.defaultCurrencyCode || 'USD')
  ) || DEFAULT_CURRENCIES[0];

  const netBalances = groupTransactions.length > 0
    ? calculateParticipantBalances(groupTransactions)
    : {};

  const settlements = calculateSettlement(netBalances);

  // Handlers
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: `g_${Date.now()}`,
      name: newGroupName,
      type: newGroupType,
      description: newGroupDesc,
      defaultCurrencyCode: newGroupCurrency,
      participantIds: [],
      members: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLedger: Ledger = {
      ...ledger,
      groups: [...ledger.groups, newGroup],
      updatedAt: new Date().toISOString(),
    };

    await repo.saveLedger(updatedLedger);
    setLedger(updatedLedger);
    setSelectedGroupId(newGroup.id);
    setOpenGroupDialog(false);
    setNewGroupName('');
    setNewGroupDesc('');
  };

  const handleAddMember = async () => {
    if (!memberName.trim() || !currentGroup) return;

    const newPerson: Participant = {
      id: `p_${Date.now()}`,
      name: memberName,
    };

    const updatedParticipants = [...ledger.participants, newPerson];
    const updatedGroupMembers = [
      ...(currentGroup.members || []),
      { participantId: newPerson.id, percentage: memberPercentage },
    ];
    const updatedGroup: Group = {
      ...currentGroup,
      participantIds: [...currentGroup.participantIds, newPerson.id],
      members: updatedGroupMembers,
      updatedAt: new Date().toISOString(),
    };

    const updatedGroups = ledger.groups.map((g) => (g.id === currentGroup.id ? updatedGroup : g));

    const updatedLedger: Ledger = {
      ...ledger,
      participants: updatedParticipants,
      groups: updatedGroups,
      updatedAt: new Date().toISOString(),
    };

    await repo.saveLedger(updatedLedger);
    setLedger(updatedLedger);
    setOpenMemberDialog(false);
    setMemberName('');
  };

  // Group Costing Transaction (Equal split among selected participants)
  const handleAddCostingTransaction = async () => {
    if (!currentGroup || !costingTitle.trim() || !costingAmount || !costingPayerId || costingTargetIds.length === 0) return;

    const numAmount = parseFloat(costingAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const money = createMoney(numAmount, currencyObj);
    const splits = calculateEqualSplits(money.amount, costingTargetIds);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      groupId: currentGroup.id,
      title: costingTitle,
      type: 'expense',
      amount: money.amount,
      currencyCode: currentGroup.defaultCurrencyCode,
      payerId: costingPayerId,
      splits,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLedger: Ledger = {
      ...ledger,
      transactions: [...ledger.transactions, newTx],
      updatedAt: new Date().toISOString(),
    };

    await repo.saveLedger(updatedLedger);
    setLedger(updatedLedger);
    setOpenCostingTxDialog(false);
    setCostingTitle('');
    setCostingAmount('');
  };

  // Business Sharing Transaction (Percentage split based on partner shares)
  const handleAddBusinessTransaction = async () => {
    if (!currentGroup || !businessTitle.trim() || !businessAmount || !businessPayerId) return;

    const numAmount = parseFloat(businessAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const money = createMoney(numAmount, currencyObj);

    const pPercentages = currentGroup.participantIds.map((pid) => {
      const mem = currentGroup.members?.find((m) => m.participantId === pid);
      return {
        participantId: pid,
        percentage: mem?.percentage ?? (100 / currentGroup.participantIds.length),
      };
    });

    const splits = calculatePercentageSplits(money.amount, pPercentages);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      groupId: currentGroup.id,
      title: businessTitle,
      type: businessTxType,
      amount: money.amount,
      currencyCode: currentGroup.defaultCurrencyCode,
      payerId: businessPayerId,
      splits,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLedger: Ledger = {
      ...ledger,
      transactions: [...ledger.transactions, newTx],
      updatedAt: new Date().toISOString(),
    };

    await repo.saveLedger(updatedLedger);
    setLedger(updatedLedger);
    setOpenBusinessTxDialog(false);
    setBusinessTitle('');
    setBusinessAmount('');
  };

  const handleDeleteTransaction = async (txId: string) => {
    const updatedLedger: Ledger = {
      ...ledger,
      transactions: ledger.transactions.filter((tx) => tx.id !== txId),
      updatedAt: new Date().toISOString(),
    };

    await repo.saveLedger(updatedLedger);
    setLedger(updatedLedger);
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {t('groups.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setOpenGroupDialog(true)}
        >
          {t('actions.createGroup')}
        </Button>
      </Box>

      {/* Group Selector Chips */}
      {ledger.groups.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 3, display: 'flex', gap: 1, overflowX: 'auto' }}>
          {ledger.groups.map((g) => (
            <Chip
              key={g.id}
              icon={g.type === 'business' ? <StorefrontIcon /> : <ShoppingBagIcon />}
              label={g.name}
              color={selectedGroupId === g.id ? (g.type === 'business' ? 'secondary' : 'primary') : 'default'}
              variant={selectedGroupId === g.id ? 'filled' : 'outlined'}
              onClick={() => setSelectedGroupId(g.id)}
              sx={{ fontWeight: selectedGroupId === g.id ? 'bold' : 'normal', cursor: 'pointer' }}
            />
          ))}
        </Paper>
      )}

      {!currentGroup ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">{t('groups.empty')}</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Group Header Info */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {currentGroup.name}
                    </Typography>
                    <Chip
                      label={isBusinessGroup ? t('groups.businessModel') : t('groups.costingModel')}
                      color={isBusinessGroup ? 'secondary' : 'primary'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {currentGroup.description || (isBusinessGroup ? t('groups.businessDesc') : t('groups.costingDesc'))}
                  </Typography>
                  <Chip
                    label={`Currency: ${currentGroup.defaultCurrencyCode}`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setOpenMemberDialog(true)}
                >
                  {t('actions.addPerson')}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {isBusinessGroup ? t('groups.businessMembers') : t('groups.members')}
              </Typography>

              {groupParticipants.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No members added yet. Add group members to start sharing.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {groupParticipants.map((p) => {
                    const memberInfo = currentGroup.members?.find((m) => m.participantId === p.id);
                    return (
                      <Chip
                        key={p.id}
                        label={isBusinessGroup ? `${p.name} (${memberInfo?.percentage ?? 0}%)` : p.name}
                        variant="outlined"
                        color={isBusinessGroup ? 'secondary' : 'default'}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Group Balances & Settlement Breakdown */}
          {groupParticipants.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceWalletIcon color="primary" fontSize="small" />
                  {t('groups.balances')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                  {groupParticipants.map((p) => {
                    const balance = netBalances[p.id] || 0n;
                    const isPositive = balance > 0n;
                    const isNegative = balance < 0n;
                    return (
                      <Paper key={p.id} variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 130 }}>
                        <Typography variant="caption" color="text.secondary">
                          {p.name}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            color: isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.primary',
                          }}
                        >
                          {formatMoney({ amount: balance, currencyCode: currencyObj.code }, currencyObj)}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Box>

                {settlements.length > 0 && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                      {t('groups.settleUp')}
                    </Typography>
                    {settlements.map((debt, idx) => {
                      const fromName = ledger.participants.find((p) => p.id === debt.from)?.name || debt.from;
                      const toName = ledger.participants.find((p) => p.id === debt.to)?.name || debt.to;
                      return (
                        <Typography key={idx} variant="body2">
                          • <strong>{fromName}</strong> {t('groups.owesTo')} <strong>{toName}</strong>:{' '}
                          {formatMoney({ amount: debt.amount, currencyCode: currencyObj.code }, currencyObj)}
                        </Typography>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transactions List */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLongIcon color="primary" fontSize="small" />
                  {isBusinessGroup ? t('groups.businessTransactions') : t('groups.transactions')}
                </Typography>
                <Button
                  variant="contained"
                  color={isBusinessGroup ? 'secondary' : 'primary'}
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={groupParticipants.length === 0}
                  onClick={() => {
                    if (isBusinessGroup) {
                      setBusinessPayerId(groupParticipants[0]?.id || '');
                      setOpenBusinessTxDialog(true);
                    } else {
                      setCostingPayerId(groupParticipants[0]?.id || '');
                      setCostingTargetIds(groupParticipants.map((p) => p.id));
                      setOpenCostingTxDialog(true);
                    }
                  }}
                >
                  {isBusinessGroup ? t('actions.addTransaction') : t('actions.addItem')}
                </Button>
              </Box>

              {groupTransactions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No transactions recorded yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('groups.titleLabel')}</TableCell>
                        {isBusinessGroup && <TableCell>{t('groups.type')}</TableCell>}
                        <TableCell>{t('groups.payer')}</TableCell>
                        <TableCell align="right">{t('groups.amount')}</TableCell>
                        <TableCell align="center"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupTransactions.map((tx) => {
                        const payer = ledger.participants.find((p) => p.id === tx.payerId);
                        const isIncome = tx.type === 'income';
                        return (
                          <TableRow key={tx.id}>
                            <TableCell sx={{ fontWeight: 'medium' }}>{tx.title}</TableCell>
                            {isBusinessGroup && (
                              <TableCell>
                                <Chip
                                  label={isIncome ? t('groups.income') : t('groups.outcome')}
                                  color={isIncome ? 'success' : 'error'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                            )}
                            <TableCell>{payer?.name || tx.payerId}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatMoney({ amount: tx.amount, currencyCode: tx.currencyCode }, currencyObj)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteTransaction(tx.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Dialog: Create Group */}
      <Dialog open={openGroupDialog} onClose={() => setOpenGroupDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('groups.createNew')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('groups.modelType')}
            </Typography>
            <ToggleButtonGroup
              value={newGroupType}
              exclusive
              fullWidth
              size="small"
              onChange={(_e, val) => val && setNewGroupType(val)}
            >
              <ToggleButton value="costing">
                {t('groups.costingModel')}
              </ToggleButton>
              <ToggleButton value="business" color="secondary">
                {t('groups.businessModel')}
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label={t('groups.groupName')}
              fullWidth
              size="small"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <TextField
              label={t('groups.description')}
              fullWidth
              size="small"
              multiline
              rows={2}
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
            />
            <TextField
              select
              label={t('groups.currency')}
              fullWidth
              size="small"
              value={newGroupCurrency}
              onChange={(e) => setNewGroupCurrency(e.target.value)}
            >
              {DEFAULT_CURRENCIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) - {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGroupDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateGroup}>{t('actions.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Add Member */}
      <Dialog open={openMemberDialog} onClose={() => setOpenMemberDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('actions.addPerson')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('groups.memberName')}
              fullWidth
              size="small"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
            {isBusinessGroup && (
              <TextField
                label={t('groups.memberPercentage')}
                type="number"
                fullWidth
                size="small"
                value={memberPercentage}
                onChange={(e) => setMemberPercentage(Number(e.target.value))}
                helperText="Percentage share for business income & expense distribution"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMemberDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" onClick={handleAddMember}>{t('actions.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Group Costing Item (Equal split among selected participants) */}
      <Dialog open={openCostingTxDialog} onClose={() => setOpenCostingTxDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('actions.addItem')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('groups.itemTitle')}
              fullWidth
              size="small"
              value={costingTitle}
              onChange={(e) => setCostingTitle(e.target.value)}
            />

            <TextField
              label={`${t('groups.amount')} (${currencyObj.symbol})`}
              type="number"
              fullWidth
              size="small"
              value={costingAmount}
              onChange={(e) => setCostingAmount(e.target.value)}
            />

            <TextField
              select
              label={t('groups.payer')}
              fullWidth
              size="small"
              value={costingPayerId}
              onChange={(e) => setCostingPayerId(e.target.value)}
            >
              {groupParticipants.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="caption" color="text.secondary">
              {t('groups.splitAmong')}
            </Typography>
            <FormGroup>
              {groupParticipants.map((p) => (
                <FormControlLabel
                  key={p.id}
                  control={
                    <Checkbox
                      checked={costingTargetIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCostingTargetIds([...costingTargetIds, p.id]);
                        } else {
                          setCostingTargetIds(costingTargetIds.filter((id) => id !== p.id));
                        }
                      }}
                    />
                  }
                  label={p.name}
                />
              ))}
            </FormGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCostingTxDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" onClick={handleAddCostingTransaction}>{t('actions.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Business Sharing Transaction (Percentage split) */}
      <Dialog open={openBusinessTxDialog} onClose={() => setOpenBusinessTxDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('actions.addTransaction')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={businessTxType}
              exclusive
              fullWidth
              size="small"
              onChange={(_e, val) => val && setBusinessTxType(val)}
            >
              <ToggleButton value="income" color="success">
                {t('groups.income')}
              </ToggleButton>
              <ToggleButton value="expense" color="error">
                {t('groups.outcome')}
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label={t('groups.titleLabel')}
              fullWidth
              size="small"
              value={businessTitle}
              onChange={(e) => setBusinessTitle(e.target.value)}
            />

            <TextField
              label={`${t('groups.amount')} (${currencyObj.symbol})`}
              type="number"
              fullWidth
              size="small"
              value={businessAmount}
              onChange={(e) => setBusinessAmount(e.target.value)}
            />

            <TextField
              select
              label={t('groups.receiver')}
              fullWidth
              size="small"
              value={businessPayerId}
              onChange={(e) => setBusinessPayerId(e.target.value)}
            >
              {groupParticipants.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBusinessTxDialog(false)}>{t('actions.cancel')}</Button>
          <Button variant="contained" color="secondary" onClick={handleAddBusinessTransaction}>{t('actions.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
