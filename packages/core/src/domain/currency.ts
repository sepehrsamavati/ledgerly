export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface ExchangeRate {
  id: string;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  rate: number;
  updatedAt: string;
}

export const DEFAULT_CURRENCIES: Currency[] = [
  { id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { id: 'eur', code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { id: 'gbp', code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { id: 'irr', code: 'IRR', name: 'Iranian Rial', symbol: '﷼', decimals: 0 },
  { id: 'irt', code: 'IRT', name: 'Iranian Toman', symbol: 'تومان', decimals: 0 },
];
