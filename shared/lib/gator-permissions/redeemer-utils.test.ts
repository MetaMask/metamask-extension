import type { Rule } from '@metamask/7715-permission-types';
import { extractRedeemerAddressesFromRules } from './redeemer-utils';

describe('redeemer-utils', () => {
  describe('extractRedeemerAddressesFromRules', () => {
    it('returns addresses when a redeemer rule is present', () => {
      const addr1 = '0x0000000000000000000000000000000000000001';
      const addr2 = '0x0000000000000000000000000000000000000002';
      const rules: Rule[] = [
        { type: 'redeemer', data: { addresses: [addr1, addr2] } },
      ];
      expect(extractRedeemerAddressesFromRules(rules)).toStrictEqual([
        addr1,
        addr2,
      ]);
    });

    it('returns the first redeemer rule when multiple exist', () => {
      const first = ['0x0000000000000000000000000000000000000001'];
      const second = ['0x0000000000000000000000000000000000000002'];
      const rules: Rule[] = [
        { type: 'redeemer', data: { addresses: first } },
        { type: 'redeemer', data: { addresses: second } },
      ];
      expect(extractRedeemerAddressesFromRules(rules)).toStrictEqual(first);
    });

    it('finds redeemer when it is not the first rule', () => {
      const addresses = ['0x00000000000000000000000000000000000000ab'];
      const rules: Rule[] = [
        { type: 'expiry', data: { timestamp: 1744588800 } },
        { type: 'redeemer', data: { addresses } },
      ];
      expect(extractRedeemerAddressesFromRules(rules)).toStrictEqual(addresses);
    });

    it('returns null when rules is null or undefined', () => {
      expect(extractRedeemerAddressesFromRules(null)).toBeNull();
      expect(extractRedeemerAddressesFromRules(undefined)).toBeNull();
    });

    it('returns null for empty rules', () => {
      expect(extractRedeemerAddressesFromRules([])).toBeNull();
    });

    it('returns null when no redeemer rule exists', () => {
      const rules: Rule[] = [
        { type: 'expiry', data: { timestamp: 1744588800 } },
      ];
      expect(extractRedeemerAddressesFromRules(rules)).toBeNull();
    });

    it('returns null when addresses is not an array', () => {
      const rules = [
        { type: 'redeemer', data: { addresses: '0xabc' } },
      ] as Rule[];
      expect(extractRedeemerAddressesFromRules(rules)).toBeNull();
    });

    it('returns null when an address entry is not a string', () => {
      const rules = [
        {
          type: 'redeemer',
          data: {
            addresses: ['0x0000000000000000000000000000000000000001', 1],
          },
        },
      ] as Rule[];
      expect(extractRedeemerAddressesFromRules(rules)).toBeNull();
    });
  });
});
