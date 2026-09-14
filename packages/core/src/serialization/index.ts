import { Ledger } from '../domain/types.js';

export function serializeLedger(ledger: Ledger): string {
  return JSON.stringify(ledger, (_key, value) => {
    if (typeof value === 'bigint') {
      return { __type: 'BigInt', value: value.toString() };
    }
    return value;
  });
}

export function deserializeLedger(jsonString: string): Ledger {
  return JSON.parse(jsonString, (_key, value) => {
    if (value && typeof value === 'object' && value.__type === 'BigInt') {
      return BigInt(value.value);
    }
    return value;
  });
}
