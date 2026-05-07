import type { Rule } from '@metamask/7715-permission-types';
import { extractAddressesFromRuleByType } from './address-rule-utils';

const ADDR_1 = '0x0000000000000000000000000000000000000001';
const ADDR_2 = '0x0000000000000000000000000000000000000002';

describe.each(['payee', 'redeemer'] as const)(
  '%s address rule extraction',
  (ruleType) => {
    it.each([
      [
        'matching rule is present',
        [{ type: ruleType, data: { addresses: [ADDR_1, ADDR_2] } }] as Rule[],
        [ADDR_1, ADDR_2],
      ],
      [
        'multiple matching rules exist',
        [
          { type: ruleType, data: { addresses: [ADDR_1] } },
          { type: ruleType, data: { addresses: [ADDR_2] } },
        ] as Rule[],
        [ADDR_1],
      ],
      [
        'matching rule is not first',
        [
          { type: 'expiry', data: { timestamp: 1744588800 } },
          { type: ruleType, data: { addresses: [ADDR_2] } },
        ] as Rule[],
        [ADDR_2],
      ],
      ['rules are null', null, null],
      ['rules are undefined', undefined, null],
      ['rules are empty', [], null],
      [
        'no matching rule exists',
        [{ type: 'expiry', data: { timestamp: 1744588800 } }] as Rule[],
        null,
      ],
      [
        'addresses is not an array',
        [{ type: ruleType, data: { addresses: '0xabc' } }] as Rule[],
        null,
      ],
      [
        'some address entries are not strings',
        [{ type: ruleType, data: { addresses: [ADDR_1, 1] } }] as Rule[],
        [ADDR_1],
      ],
      [
        'all address entries are not strings',
        [{ type: ruleType, data: { addresses: [1, 2, null] } }] as Rule[],
        null,
      ],
    ])('returns expected addresses when %s', (_name, rules, expected) => {
      expect(extractAddressesFromRuleByType(rules, ruleType)).toStrictEqual(
        expected,
      );
    });
  },
);
