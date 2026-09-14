import { Transaction, Split } from '../domain/types.js';
import { ExchangeRate } from '../domain/currency.js';

export interface ParticipantBalance {
  participantId: string;
  netBalance: bigint;
}

export function calculateEqualSplits(
  totalAmount: bigint,
  participantIds: string[]
): Split[] {
  if (participantIds.length === 0) return [];

  const count = BigInt(participantIds.length);
  const baseShare = totalAmount / count;
  let remainder = totalAmount % count;

  return participantIds.map((id) => {
    let shareAmount = baseShare;
    if (remainder > 0n) {
      shareAmount += 1n;
      remainder -= 1n;
    } else if (remainder < 0n) {
      shareAmount -= 1n;
      remainder += 1n;
    }
    return {
      participantId: id,
      amount: shareAmount,
    };
  });
}

export function calculatePercentageSplits(
  totalAmount: bigint,
  participantPercentages: { participantId: string; percentage: number }[]
): Split[] {
  if (participantPercentages.length === 0) return [];

  let allocated = 0n;
  const splits: Split[] = [];

  participantPercentages.forEach((item, idx) => {
    if (idx === participantPercentages.length - 1) {
      const shareAmount = totalAmount - allocated;
      splits.push({
        participantId: item.participantId,
        amount: shareAmount,
        percentage: item.percentage,
      });
    } else {
      const shareAmount = (totalAmount * BigInt(Math.round(item.percentage * 100))) / 10000n;
      allocated += shareAmount;
      splits.push({
        participantId: item.participantId,
        amount: shareAmount,
        percentage: item.percentage,
      });
    }
  });

  return splits;
}

export function calculateParticipantBalances(
  transactions: Transaction[]
): Record<string, bigint> {
  const balances: Record<string, bigint> = {};

  for (const tx of transactions) {
    if (!balances[tx.payerId]) {
      balances[tx.payerId] = 0n;
    }

    if (tx.type === 'expense') {
      // Expense (outcome): Payer paid for everyone.
      // Payer is credited the full amount (+tx.amount).
      // Each split participant owes their share (-split.amount).
      balances[tx.payerId] += tx.amount;
      for (const split of tx.splits) {
        if (!balances[split.participantId]) {
          balances[split.participantId] = 0n;
        }
        balances[split.participantId] -= split.amount;
      }
    } else if (tx.type === 'income') {
      // Income (business revenue/income): Payer received business income on behalf of the group.
      // Payer received tx.amount (+payer), so payer owes the group.
      // Payer is debited (-tx.amount).
      // Each split participant is credited (+split.amount) as their share of income.
      balances[tx.payerId] -= tx.amount;
      for (const split of tx.splits) {
        if (!balances[split.participantId]) {
          balances[split.participantId] = 0n;
        }
        balances[split.participantId] += split.amount;
      }
    } else if (tx.type === 'transfer') {
      balances[tx.payerId] += tx.amount;
      for (const split of tx.splits) {
        if (!balances[split.participantId]) {
          balances[split.participantId] = 0n;
        }
        balances[split.participantId] -= split.amount;
      }
    }
  }

  return balances;
}

export interface Debt {
  from: string;
  to: string;
  amount: bigint;
}

export function calculateSettlement(balances: Record<string, bigint>): Debt[] {
  const debtors: { id: string; amount: bigint }[] = [];
  const creditors: { id: string; amount: bigint }[] = [];

  for (const [id, net] of Object.entries(balances)) {
    if (net < 0n) {
      debtors.push({ id, amount: -net });
    } else if (net > 0n) {
      creditors.push({ id, amount: net });
    }
  }

  const debts: Debt[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settledAmount = debtor.amount < creditor.amount ? debtor.amount : creditor.amount;

    if (settledAmount > 0n) {
      debts.push({
        from: debtor.id,
        to: creditor.id,
        amount: settledAmount,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount === 0n) dIdx++;
    if (creditor.amount === 0n) cIdx++;
  }

  return debts;
}

export function convertCurrency(
  amount: bigint,
  rate: ExchangeRate
): bigint {
  const rateScaled = BigInt(Math.round(rate.rate * 10000));
  return (amount * rateScaled) / 10000n;
}
