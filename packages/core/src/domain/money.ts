import { Currency } from './currency.js';

export interface Money {
  amount: bigint; // minor units
  currencyCode: string;
}

export function createMoney(amountMajor: number, currency: Currency): Money {
  const factor = BigInt(10 ** currency.decimals);
  const parts = amountMajor.toFixed(currency.decimals).split('.');
  const integerPart = BigInt(parts[0]);
  const fractionalPart = parts[1] ? BigInt(parts[1]) : 0n;
  const isNegative = integerPart < 0n || parts[0].startsWith('-');

  let totalMinor = (isNegative ? -integerPart : integerPart) * factor + fractionalPart;
  if (isNegative) totalMinor = -totalMinor;

  return {
    amount: totalMinor,
    currencyCode: currency.code,
  };
}

export function formatMoney(money: Money, currency: Currency): string {
  if (currency.decimals === 0) {
    return `${money.amount.toString()} ${currency.symbol}`;
  }
  const factor = BigInt(10 ** currency.decimals);
  const isNegative = money.amount < 0n;
  const absAmount = isNegative ? -money.amount : money.amount;
  const integerPart = (absAmount / factor).toString();
  const rawFraction = (absAmount % factor).toString();
  const fractionalPart = rawFraction.padStart(currency.decimals, '0');

  const sign = isNegative ? '-' : '';
  return `${sign}${currency.symbol}${integerPart}.${fractionalPart}`;
}

export function moneyToMajor(money: Money, currency: Currency): number {
  if (currency.decimals === 0) return Number(money.amount);
  const factor = 10 ** currency.decimals;
  return Number(money.amount) / factor;
}
