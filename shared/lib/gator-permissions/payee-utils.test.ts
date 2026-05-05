import type { Rule } from '@metamask/7715-permission-types';
import { extractPayeeAddressesFromRules } from './payee-utils';

describe('payee-utils', () => {
  describe('extractPayeeAddressesFromRules', () => {
    it('returns addresses when a payee rule is present', () => {
      const addr1 = '0x0000000000000000000000000000000000000001';
      const addr2 = '0x0000000000000000000000000000000000000002';
      const rules: Rule[] = [
        { type: 'payee', data: { addresses: [addr1, addr2] } },
      ];
      expect(extractPayeeAddressesFromRules(rules)).toStrictEqual([
        addr1,
        addr2,
      ]);
    });

    it('returns the first payee rule when multiple exist', () => {
      const first = ['0x0000000000000000000000000000000000000001'];
      const second = ['0x0000000000000000000000000000000000000002'];
      const rules: Rule[] = [
        { type: 'payee', data: { addresses: first } },
        { type: 'payee', data: { addresses: second } },
      ];
      expect(extractPayeeAddressesFromRules(rules)).toStrictEqual(first);
    });

    it('finds payee when it is not the first rule', () => {
      const addresses = ['0x00000000000000000000000000000000000000ab'];
      const rules: Rule[] = [
        { type: 'expiry', data: { timestamp: 1744588800 } },
        { type: 'payee', data: { addresses } },
      ];
      expect(extractPayeeAddressesFromRules(rules)).toStrictEqual(addresses);
    });

    it('returns null when rules is null or undefined', () => {
      expect(extractPayeeAddressesFromRules(null)).toBeNull();
      expect(extractPayeeAddressesFromRules(undefined)).toBeNull();
    });

    it('returns null for empty rules', () => {
      expect(extractPayeeAddressesFromRules([])).toBeNull();
    });

    it('returns null when no payee rule exists', () => {
      const rules: Rule[] = [
        { type: 'expiry', data: { timestamp: 1744588800 } },
      ];
      expect(extractPayeeAddressesFromRules(rules)).toBeNull();
    });

    it('returns null when addresses is not an array', () => {
      const rules = [
        { type: 'payee', data: { addresses: '0xabc' } },
      ] as Rule[];
      expect(extractPayeeAddressesFromRules(rules)).toBeNull();
    });

    it('filters out non-string address entries and returns valid ones', () => {
      const rules = [
        {
          type: 'payee',
          data: {
            addresses: ['0x0000000000000000000000000000000000000001', 1],
          },
        },
      ] as Rule[];
      expect(extractPayeeAddressesFromRules(rules)).toStrictEqual([
        '0x0000000000000000000000000000000000000001',
      ]);
    });

    it('returns null when all address entries are non-strings', () => {
      const rules = [
        {
          type: 'payee',
          data: {
            addresses: [1, 2, null],
          },
        },
      ] as Rule[];
      expect(extractPayeeAddressesFromRules(rules)).toBeNull();
    });
  });
});
