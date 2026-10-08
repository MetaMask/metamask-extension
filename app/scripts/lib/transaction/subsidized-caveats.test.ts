import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  getDeleGatorEnvironment,
  type DeleGatorEnvironment,
} from '../../../../shared/lib/delegation';
import {
  getSubsidizedCaveats,
  normalizeCallData,
  SUBSIDIZED_ORDER_ID_PLACEHOLDER,
} from './subsidized-caveats';

const ENVIRONMENT: DeleGatorEnvironment = getDeleGatorEnvironment(1);

// The hex body of the placeholder, without the 0x prefix.
const PLACEHOLDER_BODY = SUBSIDIZED_ORDER_ID_PLACEHOLDER.slice(2);

// Selectors used to build realistic batch calldata.
const APPROVE_SELECTOR = '095ea7b3';
const DEPOSIT_SELECTOR = 'f9e4bab4';
const EXECUTE_SELECTOR = '1a2b3c4d';

const SELF_TARGET = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex;

// A nested approve call that does NOT contain the placeholder.
const APPROVE_DATA = `${APPROVE_SELECTOR}${'22'.repeat(28)}`;

// A nested deposit call that DOES contain the placeholder in the calldata body.
const DEPOSIT_DATA = `${DEPOSIT_SELECTOR}${APPROVE_SELECTOR}${'33'.repeat(
  12,
)}${PLACEHOLDER_BODY}${APPROVE_SELECTOR}${'33'.repeat(12)}`;

/**
 * Builds realistic batch calldata that embeds the given number of top-level
 * placeholder windows at the end.
 * @param occurrences
 */
function buildBatchData(occurrences = 1): Hex {
  const fill = (byte: string) => byte.repeat(16);
  const header = `${EXECUTE_SELECTOR}${fill('11')}${APPROVE_DATA}${DEPOSIT_DATA}`;
  const windows = Array.from(
    { length: occurrences },
    (_, index) => `${PLACEHOLDER_BODY}${fill(index === 0 ? '44' : '55')}`,
  ).join('');
  return `0x${header}${windows}${fill('cd')}` as Hex;
}

function buildTransaction(data: Hex): TransactionMeta {
  return {
    chainId: '0x1',
    networkClientId: 'mainnet',
    txParams: {
      data,
      from: '0x1234567890123456789012345678901234567890',
      to: SELF_TARGET,
      value: '0x0',
    },
    nestedTransactions: [
      {
        data: `0x${APPROVE_DATA}` as Hex,
        to: '0x1111111111111111111111111111111111111111' as Hex,
        value: '0x0' as Hex,
      },
      {
        data: `0x${DEPOSIT_DATA}` as Hex,
        to: '0x2222222222222222222222222222222222222222' as Hex,
        value: '0x0' as Hex,
      },
    ],
  } as unknown as TransactionMeta;
}

/**
 * Parses a raw AllowedCalldata caveat `terms` into its startIndex + value.
 * @param terms
 */
function parseAllowedCalldata(terms: string) {
  return {
    startIndex: parseInt(terms.slice(2, 2 + 64), 16),
    value: terms.slice(2 + 64).toLowerCase(),
  };
}

describe('getSubsidizedCaveats', () => {
  describe('allowedTargets caveat', () => {
    it('includes AllowedTargetsEnforcer as the first caveat', () => {
      const caveats = getSubsidizedCaveats(
        ENVIRONMENT,
        buildTransaction(buildBatchData(1)),
      );

      expect(caveats[0]).toStrictEqual({
        args: '0x',
        enforcer: ENVIRONMENT.caveatEnforcers.AllowedTargetsEnforcer,
        terms: SELF_TARGET.toLowerCase(),
      });
    });

    it('does not include LimitedCallsEnforcer', () => {
      const caveats = getSubsidizedCaveats(
        ENVIRONMENT,
        buildTransaction(buildBatchData(1)),
      );

      expect(
        caveats.some(
          (c) =>
            c.enforcer === ENVIRONMENT.caveatEnforcers.LimitedCallsEnforcer,
        ),
      ).toBe(false);
    });

    it('all remaining caveats use AllowedCalldataEnforcer', () => {
      const caveats = getSubsidizedCaveats(
        ENVIRONMENT,
        buildTransaction(buildBatchData(1)),
      );

      expect(caveats.slice(1).length).toBeGreaterThan(0);
      for (const c of caveats.slice(1)) {
        expect(c.enforcer).toBe(
          ENVIRONMENT.caveatEnforcers.AllowedCalldataEnforcer,
        );
      }
    });
  });

  describe('split after order-ID-bearing call selectors', () => {
    it('splits after the selector of the nested call that contains the placeholder', () => {
      const data = buildBatchData(1);
      const body = data.slice(2).toLowerCase();

      const caveats = getSubsidizedCaveats(ENVIRONMENT, buildTransaction(data));
      const enforced = caveats
        .slice(1)
        .map((c) => parseAllowedCalldata(c.terms));

      const depositStart = body.indexOf(DEPOSIT_DATA) / 2;
      const depositSplit = depositStart + 4; // after the 4-byte selector

      const segmentEnds = enforced.map(
        ({ startIndex, value }) => startIndex + value.length / 2,
      );

      // The deposit call (which contains the placeholder) must be split after
      // its selector.
      expect(segmentEnds).toContain(depositSplit);

      // The approve call (no placeholder) must NOT be split.
      const approveSplit = body.indexOf(APPROVE_DATA) / 2 + 4;
      expect(segmentEnds).not.toContain(approveSplit);

      // The inner approve-selector inside the deposit call must NOT be split.
      const innerApprove1 = depositStart + 4 + 4;
      expect(segmentEnds).not.toContain(innerApprove1);
    });
  });

  describe('fewer caveats than per-selector split', () => {
    it('produces at most 8 caveats for a 2-placeholder batch', () => {
      const data = buildBatchData(2);
      const caveats = getSubsidizedCaveats(ENVIRONMENT, buildTransaction(data));

      expect(caveats.length).toBeLessThanOrEqual(8);
    });
  });

  describe('placeholder window free', () => {
    it('does not include the order-ID placeholder bytes in any enforced segment', () => {
      const data = buildBatchData(1);
      const body = data.slice(2).toLowerCase();

      const caveats = getSubsidizedCaveats(ENVIRONMENT, buildTransaction(data));
      const enforced = caveats
        .slice(1)
        .map((c) => parseAllowedCalldata(c.terms));

      for (const { value } of enforced) {
        expect(value).not.toContain(PLACEHOLDER_BODY);
      }

      // All non-placeholder bytes are covered by exactly one enforced segment.
      const rebuilt = Array.from(body);
      for (const { startIndex, value } of enforced) {
        for (let i = 0; i < value.length; i++) {
          rebuilt[startIndex * 2 + i] = value[i];
        }
      }
      expect(rebuilt.join('')).toBe(body);

      // The placeholder range itself is NOT covered.
      const placeholderStart = body.indexOf(PLACEHOLDER_BODY) / 2;
      const covered = enforced.some(
        ({ startIndex, value }) =>
          startIndex <= placeholderStart &&
          placeholderStart < startIndex + value.length / 2,
      );
      expect(covered).toBe(false);
    });
  });

  describe('multiple placeholder occurrences', () => {
    it('leaves every occurrence of the placeholder uncovered', () => {
      const data = buildBatchData(2);
      const body = data.slice(2).toLowerCase();

      const caveats = getSubsidizedCaveats(ENVIRONMENT, buildTransaction(data));
      const enforced = caveats
        .slice(1)
        .map((c) => parseAllowedCalldata(c.terms));

      for (const { value } of enforced) {
        expect(value).not.toContain(PLACEHOLDER_BODY);
      }

      // There are 3 occurrences: 1 in DEPOSIT_DATA + 2 top-level windows.
      let searchIndex = body.indexOf(PLACEHOLDER_BODY);
      const placeholderStarts: number[] = [];
      while (searchIndex !== -1) {
        placeholderStarts.push(searchIndex / 2);
        searchIndex = body.indexOf(PLACEHOLDER_BODY, searchIndex + 1);
      }
      expect(placeholderStarts).toHaveLength(3);

      for (const start of placeholderStarts) {
        const covered = enforced.some(
          ({ startIndex, value }) =>
            startIndex <= start && start < startIndex + value.length / 2,
        );
        expect(covered).toBe(false);
      }
    });
  });

  describe('missing calldata throws with prefix', () => {
    it('throws with "Subsidized Caveats: " prefix when calldata is missing', () => {
      const transaction = {
        chainId: '0x1',
        networkClientId: 'mainnet',
        txParams: {
          from: '0x1234567890123456789012345678901234567890',
          to: SELF_TARGET,
          data: undefined,
          value: '0x0',
        },
      } as unknown as TransactionMeta;

      expect(() => getSubsidizedCaveats(ENVIRONMENT, transaction)).toThrow(
        'Subsidized Caveats: Missing batch target or calldata',
      );
    });

    it('throws with "Subsidized Caveats: " prefix when target is missing', () => {
      const transaction = {
        chainId: '0x1',
        networkClientId: 'mainnet',
        txParams: {
          data: buildBatchData(1),
          from: '0x1234567890123456789012345678901234567890',
          to: undefined,
          value: '0x0',
        },
      } as unknown as TransactionMeta;

      expect(() => getSubsidizedCaveats(ENVIRONMENT, transaction)).toThrow(
        'Subsidized Caveats: Missing batch target or calldata',
      );
    });
  });
});

describe('normalizeCallData', () => {
  it('returns 0x for undefined', () => {
    expect(normalizeCallData(undefined)).toBe('0x');
  });

  it('returns 0x for null', () => {
    expect(normalizeCallData(null)).toBe('0x');
  });

  it('returns 0x for empty string', () => {
    expect(normalizeCallData('')).toBe('0x');
  });

  it('returns 0x for 0x', () => {
    expect(normalizeCallData('0x')).toBe('0x');
  });

  it('preserves valid hex data', () => {
    expect(normalizeCallData('0xdeadbeef')).toBe('0xdeadbeef');
  });

  it('lowercases hex', () => {
    expect(normalizeCallData('0xDEADBEEF')).toBe('0xdeadbeef');
  });

  it('adds 0x prefix if missing', () => {
    expect(normalizeCallData('deadbeef')).toBe('0xdeadbeef');
  });

  it('pads odd-length hex body', () => {
    expect(normalizeCallData('0xabc')).toBe('0x0abc');
    expect(normalizeCallData('abc')).toBe('0x0abc');
  });
});
