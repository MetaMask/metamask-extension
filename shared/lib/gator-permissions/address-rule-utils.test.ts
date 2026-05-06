import type { Rule } from '@metamask/7715-permission-types';
import { extractAddressesFromRuleByType } from './address-rule-utils';

const addressRuleExtractors = [
  {
    name: 'payee',
    ruleType: 'payee',
  },
  {
    name: 'redeemer',
    ruleType: 'redeemer',
  },
] as const;

describe.each(addressRuleExtractors)(
  '$name address rule extraction',
  ({ ruleType }) => {
    it('returns addresses when the matching rule is present', () => {
      const addr1 = '0x0000000000000000000000000000000000000001';
      const addr2 = '0x0000000000000000000000000000000000000002';
      const rules: Rule[] = [
        { type: ruleType, data: { addresses: [addr1, addr2] } },
      ];
      expect(extractAddressesFromRuleByType(rules, ruleType)).toStrictEqual([
        addr1,
        addr2,
      ]);
    });

    it('returns the first matching rule when multiple exist', () => {
      const first = ['0x0000000000000000000000000000000000000001'];
      const second = ['0x0000000000000000000000000000000000000002'];
      const rules: Rule[] = [
        { type: ruleType, data: { addresses: first } },
        { type: ruleType, data: { addresses: second } },
      ];
      expect(extractAddressesFromRuleByType(rules, ruleType)).toStrictEqual(
        first,
      );
    });

    it('finds the matching rule when it is not first', () => {
      const addresses = ['0x00000000000000000000000000000000000000ab'];
      const rules: Rule[] = [
        { type: 'expiry', data: { timestamp: 1744588800 } },
        { type: ruleType, data: { addresses } },
      ];
      expect(extractAddressesFromRuleByType(rules, ruleType)).toStrictEqual(
        addresses,
      );
    });

    it('returns null when rules are null, undefined, or empty', () => {
      expect(extractAddressesFromRuleByType(null, ruleType)).toBeNull();
      expect(extractAddressesFromRuleByType(undefined, ruleType)).toBeNull();
      expect(extractAddressesFromRuleByType([], ruleType)).toBeNull();
    });

    it('returns null when no matching rule exists', () => {
      const rules: Rule[] = [
        { type: 'expiry', data: { timestamp: 1744588800 } },
      ];
      expect(extractAddressesFromRuleByType(rules, ruleType)).toBeNull();
    });

    it('returns null when addresses is not an array', () => {
      const rules = [
        { type: ruleType, data: { addresses: '0xabc' } },
      ] as Rule[];
      expect(extractAddressesFromRuleByType(rules, ruleType)).toBeNull();
    });

    it('filters out non-string address entries and returns valid ones', () => {
      const validAddress = '0x0000000000000000000000000000000000000001';
      const rules = [
        {
          type: ruleType,
          data: {
            addresses: [validAddress, 1],
          },
        },
      ] as Rule[];
      expect(extractAddressesFromRuleByType(rules, ruleType)).toStrictEqual([
        validAddress,
      ]);
    });

    it('returns null when all address entries are non-strings', () => {
      const rules = [
        {
          type: ruleType,
          data: {
            addresses: [1, 2, null],
          },
        },
      ] as Rule[];
      expect(extractAddressesFromRuleByType(rules, ruleType)).toBeNull();
    });
  },
);
