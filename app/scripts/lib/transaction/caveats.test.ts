import {
  createExactExecutionBatchTerms,
  createExactExecutionTerms,
  createLimitedCallsTerms,
  createRedeemerTerms,
  createTimestampTerms,
} from '@metamask/delegation-core';
import type {
  FeatureFlags,
  RemoteFeatureFlagControllerGetStateAction,
} from '@metamask/remote-feature-flag-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex, Json } from '@metamask/utils';
import {
  getDeleGatorEnvironment,
  type Caveat,
  type DeleGatorEnvironment,
  type ExecutionStruct,
} from '../../../../shared/lib/delegation';
import {
  CONFIRMATIONS_DELEGATIONS_FEATURE_FLAG_NAME,
  getDelegationCaveats,
  type GetDelegationCaveatsRequest,
} from './caveats';

// Use real enforcers from chain 1 for meaningful assertions.
const ENVIRONMENT: DeleGatorEnvironment = getDeleGatorEnvironment(1);

const DELEGATEE_MOCK = '0x5555555555555555555555555555555555555555' as Hex;
const REDEEMER_1_MOCK = '0xB01caEa8c6C47bbf4F4b4c5080Ca642043359C2E' as Hex;
const REDEEMER_2_MOCK = '0xB42F812A44c22cc6b861478900401ee759EbEAD6' as Hex;

const FIXED_NOW = 1_700_000_000_000;
const DEFAULT_DEADLINE_SECONDS = 1800;

const TRANSACTION_MOCK: TransactionMeta = {
  chainId: '0x1',
  networkClientId: 'mainnet',
  txParams: {
    from: '0x1234567890123456789012345678901234567890',
    to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    data: '0xdeadbeef',
    value: '0x100',
  },
} as unknown as TransactionMeta;

const EXECUTION_MOCK: ExecutionStruct = {
  callData: '0xdeadbeef',
  target: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  value: 256n,
};

const EXECUTION_MOCK_2: ExecutionStruct = {
  callData: '0xcafebabe',
  target: '0x1111111111111111111111111111111111111111',
  value: 0n,
};

const CAVEATS_OVERRIDE_MOCK: Caveat[] = [
  { args: '0xcc', enforcer: '0xaa' as Hex, terms: '0xbb' as Hex },
];

/**
 * Builds a minimal messenger stub that returns the given feature flags.
 * @param flags
 */
function buildMessenger(
  flags: FeatureFlags = {},
): GetDelegationCaveatsRequest['messenger'] {
  return {
    call: jest
      .fn<
        ReturnType<RemoteFeatureFlagControllerGetStateAction['handler']>,
        never
      >()
      .mockReturnValue({
        cacheTimestamp: 0,
        remoteFeatureFlags: flags,
      }),
  } as unknown as GetDelegationCaveatsRequest['messenger'];
}

function buildRequest(
  overrides: Partial<GetDelegationCaveatsRequest> = {},
): GetDelegationCaveatsRequest {
  return {
    environment: ENVIRONMENT,
    executions: [EXECUTION_MOCK],
    messenger: buildMessenger(),
    transaction: TRANSACTION_MOCK,
    ...overrides,
  };
}

describe('getDelegationCaveats', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('provided caveats passthrough', () => {
    it('returns provided caveats unchanged when no redeemers', () => {
      const result = getDelegationCaveats(
        buildRequest({ caveats: CAVEATS_OVERRIDE_MOCK }),
      );

      expect(result).toStrictEqual(CAVEATS_OVERRIDE_MOCK);
    });

    it('returns provided caveats unchanged even when redeemers are set', () => {
      const result = getDelegationCaveats(
        buildRequest({
          caveats: CAVEATS_OVERRIDE_MOCK,
          redeemers: [REDEEMER_1_MOCK],
        }),
      );

      expect(result).toStrictEqual(CAVEATS_OVERRIDE_MOCK);
    });

    it('returns provided caveats unchanged even when delegatee is set', () => {
      const result = getDelegationCaveats(
        buildRequest({
          caveats: CAVEATS_OVERRIDE_MOCK,
          delegatee: DELEGATEE_MOCK,
        }),
      );

      expect(result).toStrictEqual(CAVEATS_OVERRIDE_MOCK);
    });
  });

  describe('default caveat ordering', () => {
    it('produces [limitedCalls, timestamp, exactExecution] for a single execution', () => {
      const result = getDelegationCaveats(buildRequest());

      expect(result).toHaveLength(3);
      expect(result[0].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.LimitedCallsEnforcer,
      );
      expect(result[1].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.TimestampEnforcer,
      );
      expect(result[2].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.ExactExecutionEnforcer,
      );
    });

    it('produces [limitedCalls, timestamp, exactExecutionBatch] for multiple executions', () => {
      const result = getDelegationCaveats(
        buildRequest({ executions: [EXECUTION_MOCK, EXECUTION_MOCK_2] }),
      );

      expect(result).toHaveLength(3);
      expect(result[0].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.LimitedCallsEnforcer,
      );
      expect(result[1].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.TimestampEnforcer,
      );
      expect(result[2].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.ExactExecutionBatchEnforcer,
      );
    });

    it('produces [limitedCalls, timestamp, redeemer, exactExecution] when redeemers provided', () => {
      const result = getDelegationCaveats(
        buildRequest({ redeemers: [REDEEMER_1_MOCK] }),
      );

      expect(result).toHaveLength(4);
      expect(result[0].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.LimitedCallsEnforcer,
      );
      expect(result[1].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.TimestampEnforcer,
      );
      expect(result[2].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.RedeemerEnforcer,
      );
      expect(result[3].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.ExactExecutionEnforcer,
      );
    });
  });

  describe('limitedCalls caveat', () => {
    it('encodes limit 1', () => {
      const result = getDelegationCaveats(buildRequest());
      const limitedCalls = result.find(
        (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.LimitedCallsEnforcer,
      );

      expect(limitedCalls?.terms).toBe(createLimitedCallsTerms({ limit: 1 }));
    });
  });

  describe('timestamp caveat', () => {
    it('uses the default deadline of 1800 seconds', () => {
      const nowSeconds = Math.floor(FIXED_NOW / 1000);
      const expectedTerms = createTimestampTerms({
        afterThreshold: 0,
        beforeThreshold: nowSeconds + DEFAULT_DEADLINE_SECONDS,
      });

      const result = getDelegationCaveats(buildRequest());
      const timestamp = result.find(
        (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.TimestampEnforcer,
      );

      expect(timestamp?.terms).toBe(expectedTerms);
    });

    it('uses the feature-flag deadlineSeconds override', () => {
      const nowSeconds = Math.floor(FIXED_NOW / 1000);
      const expectedTerms = createTimestampTerms({
        afterThreshold: 0,
        beforeThreshold: nowSeconds + 300,
      });

      const messenger = buildMessenger({
        [CONFIRMATIONS_DELEGATIONS_FEATURE_FLAG_NAME]: { deadlineSeconds: 300 },
      });
      const result = getDelegationCaveats(buildRequest({ messenger }));
      const timestamp = result.find(
        (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.TimestampEnforcer,
      );

      expect(timestamp?.terms).toBe(expectedTerms);
    });

    it('floors fractional deadlineSeconds values', () => {
      const nowSeconds = Math.floor(FIXED_NOW / 1000);
      const expectedTerms = createTimestampTerms({
        afterThreshold: 0,
        beforeThreshold: nowSeconds + 59,
      });

      const messenger = buildMessenger({
        [CONFIRMATIONS_DELEGATIONS_FEATURE_FLAG_NAME]: {
          deadlineSeconds: 59.9,
        },
      });
      const result = getDelegationCaveats(buildRequest({ messenger }));
      const timestamp = result.find(
        (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.TimestampEnforcer,
      );

      expect(timestamp?.terms).toBe(expectedTerms);
    });
  });

  describe('invalid flag values fall back to default deadline', () => {
    const cases: [string, Json | undefined][] = [
      ['zero', 0],
      ['negative', -1],
      ['NaN', NaN],
      ['Infinity', Infinity],
      ['string', '300'],
      ['missing flag object', undefined],
    ];

    for (const [label, value] of cases) {
      it(`falls back when deadlineSeconds is ${label}`, () => {
        const nowSeconds = Math.floor(FIXED_NOW / 1000);
        const expectedTerms = createTimestampTerms({
          afterThreshold: 0,
          beforeThreshold: nowSeconds + DEFAULT_DEADLINE_SECONDS,
        });

        const messenger = buildMessenger(
          value === undefined
            ? {}
            : {
                [CONFIRMATIONS_DELEGATIONS_FEATURE_FLAG_NAME]: {
                  deadlineSeconds: value,
                },
              },
        );
        const result = getDelegationCaveats(buildRequest({ messenger }));
        const timestamp = result.find(
          (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.TimestampEnforcer,
        );

        expect(timestamp?.terms).toBe(expectedTerms);
      });
    }
  });

  describe('exactExecution caveat', () => {
    it('uses ExactExecutionEnforcer for a single execution', () => {
      const result = getDelegationCaveats(buildRequest());
      const exactExec = result.find(
        (c) =>
          c.enforcer === ENVIRONMENT.caveatEnforcers.ExactExecutionEnforcer,
      );

      expect(exactExec?.terms).toBe(
        createExactExecutionTerms({ execution: EXECUTION_MOCK }),
      );
    });

    it('uses ExactExecutionBatchEnforcer for multiple executions', () => {
      const executions = [EXECUTION_MOCK, EXECUTION_MOCK_2];
      const result = getDelegationCaveats(buildRequest({ executions }));
      const exactBatch = result.find(
        (c) =>
          c.enforcer ===
          ENVIRONMENT.caveatEnforcers.ExactExecutionBatchEnforcer,
      );

      expect(exactBatch?.terms).toBe(
        createExactExecutionBatchTerms({ executions }),
      );
    });
  });

  describe('redeemer caveat', () => {
    it('appends redeemer caveat after timestamp when redeemers provided', () => {
      const result = getDelegationCaveats(
        buildRequest({ redeemers: [REDEEMER_1_MOCK, REDEEMER_2_MOCK] }),
      );

      const redeemer = result.find(
        (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.RedeemerEnforcer,
      );

      expect(redeemer?.terms).toBe(
        createRedeemerTerms({
          redeemers: [
            REDEEMER_1_MOCK.toLowerCase() as Hex,
            REDEEMER_2_MOCK.toLowerCase() as Hex,
          ],
        }),
      );
    });

    it('includes the delegatee in redeemers when both are provided', () => {
      const result = getDelegationCaveats(
        buildRequest({
          delegatee: DELEGATEE_MOCK,
          redeemers: [REDEEMER_1_MOCK],
        }),
      );

      const redeemer = result.find(
        (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.RedeemerEnforcer,
      );

      expect(redeemer?.terms).toBe(
        createRedeemerTerms({
          redeemers: [
            REDEEMER_1_MOCK.toLowerCase() as Hex,
            DELEGATEE_MOCK.toLowerCase() as Hex,
          ],
        }),
      );
    });

    it('lowercases all redeemer addresses', () => {
      const upperRedeemer = REDEEMER_1_MOCK.toUpperCase() as Hex;
      const result = getDelegationCaveats(
        buildRequest({ redeemers: [upperRedeemer] }),
      );

      const redeemer = result.find(
        (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.RedeemerEnforcer,
      );

      expect(redeemer?.terms).toBe(
        createRedeemerTerms({
          redeemers: [REDEEMER_1_MOCK.toLowerCase() as Hex],
        }),
      );
    });

    it('deduplicates redeemers including mixed-case duplicates', () => {
      const result = getDelegationCaveats(
        buildRequest({
          delegatee: REDEEMER_1_MOCK.toLowerCase() as Hex,
          redeemers: [REDEEMER_1_MOCK, REDEEMER_1_MOCK],
        }),
      );

      const redeemer = result.find(
        (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.RedeemerEnforcer,
      );

      expect(redeemer?.terms).toBe(
        createRedeemerTerms({
          redeemers: [REDEEMER_1_MOCK.toLowerCase() as Hex],
        }),
      );
    });

    it('omits redeemer caveat when redeemers array is empty', () => {
      const result = getDelegationCaveats(
        buildRequest({ delegatee: DELEGATEE_MOCK, redeemers: [] }),
      );

      expect(
        result.some(
          (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.RedeemerEnforcer,
        ),
      ).toBe(false);
    });

    it('omits redeemer caveat when redeemers is not provided', () => {
      const result = getDelegationCaveats(buildRequest());

      expect(
        result.some(
          (c) => c.enforcer === ENVIRONMENT.caveatEnforcers.RedeemerEnforcer,
        ),
      ).toBe(false);
    });
  });

  describe('subsidized path', () => {
    it('produces [limitedCalls, timestamp, ...subsidizedCaveats] when isSubsidized', () => {
      const result = getDelegationCaveats(buildRequest({ isSubsidized: true }));

      // limitedCalls + timestamp + at least AllowedTargets + AllowedCalldata
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result[0].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.LimitedCallsEnforcer,
      );
      expect(result[1].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.TimestampEnforcer,
      );
      expect(result[2].enforcer).toBe(
        ENVIRONMENT.caveatEnforcers.AllowedTargetsEnforcer,
      );
    });

    it('builds subsidized caveats from the first execution', () => {
      const result = getDelegationCaveats(
        buildRequest({ executions: [EXECUTION_MOCK_2], isSubsidized: true }),
      );

      expect(result[2]).toStrictEqual({
        args: '0x',
        enforcer: ENVIRONMENT.caveatEnforcers.AllowedTargetsEnforcer,
        terms: EXECUTION_MOCK_2.target,
      });
      expect(result[3]).toStrictEqual({
        args: '0x',
        enforcer: ENVIRONMENT.caveatEnforcers.AllowedCalldataEnforcer,
        terms: `0x${'0'.repeat(64)}${EXECUTION_MOCK_2.callData.slice(2)}`,
      });
    });

    it('does not include ExactExecution caveat on the subsidized path', () => {
      const result = getDelegationCaveats(buildRequest({ isSubsidized: true }));

      expect(
        result.some(
          (c) =>
            c.enforcer === ENVIRONMENT.caveatEnforcers.ExactExecutionEnforcer,
        ),
      ).toBe(false);
      expect(
        result.some(
          (c) =>
            c.enforcer ===
            ENVIRONMENT.caveatEnforcers.ExactExecutionBatchEnforcer,
        ),
      ).toBe(false);
    });
  });

  describe('args field', () => {
    it('sets args to 0x on all generated caveats', () => {
      const result = getDelegationCaveats(
        buildRequest({ redeemers: [REDEEMER_1_MOCK] }),
      );

      for (const caveat of result) {
        expect(caveat.args).toBe('0x');
      }
    });
  });
});
