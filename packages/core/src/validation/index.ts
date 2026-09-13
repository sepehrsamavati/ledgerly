import { Transaction, Group, Participant } from '../domain/types.js';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateParticipant(participant: Partial<Participant>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!participant.name || participant.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Participant name is required' });
  }
  return errors;
}

export function validateGroup(group: Partial<Group>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!group.name || group.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Group name is required' });
  }
  if (!group.defaultCurrencyCode || group.defaultCurrencyCode.trim().length === 0) {
    errors.push({ field: 'defaultCurrencyCode', message: 'Default currency code is required' });
  }
  return errors;
}

export function validateTransaction(tx: Partial<Transaction>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!tx.title || tx.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Transaction title is required' });
  }
  if (tx.amount === undefined || tx.amount <= 0n) {
    errors.push({ field: 'amount', message: 'Transaction amount must be greater than zero' });
  }
  if (!tx.payerId) {
    errors.push({ field: 'payerId', message: 'Payer is required' });
  }
  if (!tx.splits || tx.splits.length === 0) {
    errors.push({ field: 'splits', message: 'At least one split is required' });
  } else if (tx.amount !== undefined) {
    const totalSplit = tx.splits.reduce((acc, s) => acc + s.amount, 0n);
    if (totalSplit !== tx.amount) {
      errors.push({
        field: 'splits',
        message: `Sum of splits (${totalSplit.toString()}) does not match total amount (${tx.amount.toString()})`,
      });
    }
  }
  return errors;
}
