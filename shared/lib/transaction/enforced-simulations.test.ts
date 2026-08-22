import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  SimulationTokenStandard,
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { Hex } from '@metamask/utils';
import {
  CachedScanAddressResponse,
  createCacheKey,
  ResultType,
} from '../trust-signals';
import {
  DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE,
  EnforcedSimulationsState,
  getEnforcedSimulationsSlippage,
  getEnforcedSimulationsSlippageBasisPoints,
  isEnforcedSimulationsEligible,
} from './enforced-simulations';

const ETHEREUM_CHAIN_ID: Hex = '0x1';
const UNSUPPORTED_CHAIN_ID: Hex = '0xdeadbeef';
const TO_ADDRESS = '0xRecipientAddress';
const NESTED_ADDRESS_A = '0xNestedAddressA';
const NESTED_ADDRESS_B = '0xNestedAddressB';
const UNMAPPED_CHAIN_ID: Hex = '0x1237';
const CACHE_KEY = createCacheKey(ETHEREUM_CHAIN_ID, TO_ADDRESS);

const BASE_TRANSACTION_META: TransactionMeta = {
  id: 'test-tx-id',
  chainId: ETHEREUM_CHAIN_ID,
  status: TransactionStatus.unapproved,
  time: Date.now(),
  networkClientId: 'test-network',
  origin: 'https://some-dapp.com',
  delegationAddress: '0xDelegationAddress',
  simulationData: {
    nativeBalanceChange: {
      difference: '0x1' as const,
      isDecrease: false,
      previousBalance: '0x0' as const,
      newBalance: '0x1' as const,
    },
    tokenBalanceChanges: [],
  },
  txParams: {
    from: '0x0000000000000000000000000000000000000000',
    to: TO_ADDRESS,
    data: '0xabcd',
  },
};

function buildCacheEntry(resultType: ResultType) {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type: resultType,
    label: resultType.toLowerCase(),
    timestamp: Date.now(),
  };
}

function buildState(
  resultType: ResultType,
  eip7702SupportedChains: Hex[] = [ETHEREUM_CHAIN_ID],
  chainId: Hex = ETHEREUM_CHAIN_ID,
): EnforcedSimulationsState {
  return {
    addressSecurityAlertResponses: {
      [createCacheKey(chainId, TO_ADDRESS)]: buildCacheEntry(resultType),
    },
    eip7702SupportedChains,
    internalAddresses: [],
  };
}

function buildStateForAddresses(
  entries: Record<string, ResultType>,
  eip7702SupportedChains: Hex[] = [ETHEREUM_CHAIN_ID],
  chainId: Hex = ETHEREUM_CHAIN_ID,
): EnforcedSimulationsState {
  const responses: Record<string, CachedScanAddressResponse> = {};

  for (const [address, resultType] of Object.entries(entries)) {
    const key = createCacheKey(chainId, address);
    responses[key] = buildCacheEntry(resultType);
  }

  return {
    addressSecurityAlertResponses: responses,
    eip7702SupportedChains,
    internalAddresses: [],
  };
}

function buildRemoteFeatureFlagState(flag?: {
  enabled?: boolean;
  slippage?: number;
}): RemoteFeatureFlagControllerState {
  return {
    cacheTimestamp: 0,
    remoteFeatureFlags: flag
      ? /* eslint-disable-next-line @typescript-eslint/naming-convention */
        { confirmations_enforced_simulations: flag }
      : {},
  };
}

describe('enforced-simulations', () => {
  describe('getEnforcedSimulationsSlippage', () => {
    it('returns the value from the flag when provided', () => {
      expect(
        getEnforcedSimulationsSlippage(
          buildRemoteFeatureFlagState({ slippage: 25 }),
        ),
      ).toBe(25);
    });

    it('falls back to the default when the flag has no slippage', () => {
      expect(
        getEnforcedSimulationsSlippage(buildRemoteFeatureFlagState({})),
      ).toBe(DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE);
    });

    it('falls back to the default when the flag is missing', () => {
      expect(
        getEnforcedSimulationsSlippage(buildRemoteFeatureFlagState()),
      ).toBe(DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE);
    });
  });

  describe('getEnforcedSimulationsSlippageBasisPoints', () => {
    it('converts percentages to basis points', () => {
      expect(getEnforcedSimulationsSlippageBasisPoints(2.5)).toBe(250);
    });
  });

  describe('getIsEnforcedSimulationsEligible', () => {
    afterEach(() => {
      delete process.env.FORCE_ENFORCED_SIMULATIONS;
    });

    it('returns true when all conditions are met', () => {
      expect(
        isEnforcedSimulationsEligible(
          BASE_TRANSACTION_META,
          buildState(ResultType.Benign),
        ),
      ).toBe(true);
    });

    for (const { description, origin } of [
      { description: 'no origin', origin: undefined },
      { description: 'the MetaMask origin', origin: ORIGIN_METAMASK },
    ]) {
      describe(`with a wallet-initiated transaction using ${description}`, () => {
        it('returns true when all conditions are met', () => {
          expect(
            isEnforcedSimulationsEligible(
              { ...BASE_TRANSACTION_META, origin },
              buildState(ResultType.Benign),
            ),
          ).toBe(true);
        });

        it('returns false when the chain is unsupported', () => {
          expect(
            isEnforcedSimulationsEligible(
              {
                ...BASE_TRANSACTION_META,
                origin,
                chainId: UNSUPPORTED_CHAIN_ID,
              },
              buildState(ResultType.Benign),
            ),
          ).toBe(false);
        });

        it('returns true when there are no balance changes', () => {
          expect(
            isEnforcedSimulationsEligible(
              {
                ...BASE_TRANSACTION_META,
                origin,
                simulationData: { tokenBalanceChanges: [] },
              },
              buildState(ResultType.Benign),
            ),
          ).toBe(true);
        });

        it('returns false when the recipient is trusted', () => {
          expect(
            isEnforcedSimulationsEligible(
              { ...BASE_TRANSACTION_META, origin },
              buildState(ResultType.Trusted),
            ),
          ).toBe(false);
        });
      });
    }

    it('returns false when chain is not in eip7702 supported chains', () => {
      expect(
        isEnforcedSimulationsEligible(
          { ...BASE_TRANSACTION_META, chainId: UNSUPPORTED_CHAIN_ID },
          buildState(ResultType.Benign),
        ),
      ).toBe(false);
    });

    it('returns true when delegation address is missing but chain is supported', () => {
      expect(
        isEnforcedSimulationsEligible(
          { ...BASE_TRANSACTION_META, delegationAddress: undefined },
          buildState(ResultType.Benign),
        ),
      ).toBe(true);
    });

    it('returns false when simulation data is not yet loaded', () => {
      expect(
        isEnforcedSimulationsEligible(
          { ...BASE_TRANSACTION_META, simulationData: undefined },
          buildState(ResultType.Benign),
        ),
      ).toBe(false);
    });

    it('returns true when simulation data has no balance changes', () => {
      expect(
        isEnforcedSimulationsEligible(
          {
            ...BASE_TRANSACTION_META,
            simulationData: { tokenBalanceChanges: [] },
          },
          buildState(ResultType.Benign),
        ),
      ).toBe(true);
    });

    it('returns true when simulation data has only token balance changes', () => {
      expect(
        isEnforcedSimulationsEligible(
          {
            ...BASE_TRANSACTION_META,
            simulationData: {
              tokenBalanceChanges: [
                {
                  address: '0xabc' as const,
                  standard: SimulationTokenStandard.erc20,
                  difference: '0x1' as const,
                  isDecrease: true,
                  previousBalance: '0x2' as const,
                  newBalance: '0x1' as const,
                },
              ],
            },
          },
          buildState(ResultType.Benign),
        ),
      ).toBe(true);
    });

    describe('with simpleSend and internal-address exclusions', () => {
      // A call is excluded from the trust check when its `type` is `simpleSend`
      // (the controller only assigns this after `eth_getCode` finds no code at
      // the recipient) or when its recipient is one of the user's own internal
      // addresses. A base plain value transfer to the user's own account.
      const SELF_SEND_META: TransactionMeta = {
        ...BASE_TRANSACTION_META,
        type: TransactionType.simpleSend,
        txParams: {
          ...BASE_TRANSACTION_META.txParams,
          data: undefined,
        },
      };

      const INTERNAL_STATE: EnforcedSimulationsState = {
        ...buildState(ResultType.Benign, [ETHEREUM_CHAIN_ID]),
        internalAddresses: [TO_ADDRESS],
      };

      it('is not eligible (trusted) for a no-calldata simpleSend to an internal address', () => {
        expect(
          isEnforcedSimulationsEligible(SELF_SEND_META, INTERNAL_STATE),
        ).toBe(false);
      });

      it('is not eligible (trusted) when data is 0x for a simpleSend to an internal address', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              txParams: { ...SELF_SEND_META.txParams, data: '0x' },
            },
            INTERNAL_STATE,
          ),
        ).toBe(false);
      });

      it('is not eligible (trusted) when data is 0X (case-insensitive) for a simpleSend to an internal address', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              txParams: { ...SELF_SEND_META.txParams, data: '0X' },
            },
            INTERNAL_STATE,
          ),
        ).toBe(false);
      });

      it('is not eligible (trusted) for a simpleSend even when calldata is present', () => {
        // `simpleSend` is only assigned after `eth_getCode` finds no code at the
        // recipient, so the call is trusted regardless of any calldata.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              txParams: { ...SELF_SEND_META.txParams, data: '0xabcd' },
            },
            buildState(ResultType.Benign, [ETHEREUM_CHAIN_ID]),
          ),
        ).toBe(false);
      });

      it('is not eligible (trusted) for a no-calldata simpleSend to an EXTERNAL EOA', () => {
        // A calldata-free `simpleSend` carries no contract logic, so it is
        // trusted regardless of whether the recipient is internal or external.
        expect(
          isEnforcedSimulationsEligible(
            SELF_SEND_META,
            buildState(ResultType.Benign, [ETHEREUM_CHAIN_ID]),
          ),
        ).toBe(false);
      });

      it('remains eligible for a no-calldata contractInteraction to an external address (payable receive/fallback executes logic)', () => {
        // Empty calldata still invokes a contract payable `receive()`/`fallback()`,
        // so a `contractInteraction` recipient must NOT be treated as trusted.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              type: TransactionType.contractInteraction,
            },
            buildState(ResultType.Benign, [ETHEREUM_CHAIN_ID]),
          ),
        ).toBe(true);
      });

      it('remains eligible for a no-calldata transfer to an external address when type is undefined (fail closed)', () => {
        // Before `eth_getCode` resolves, `type` is undefined; we must not skip.
        expect(
          isEnforcedSimulationsEligible(
            { ...SELF_SEND_META, type: undefined },
            buildState(ResultType.Benign, [ETHEREUM_CHAIN_ID]),
          ),
        ).toBe(true);
      });

      it('is not eligible (trusted) for a batch where every call is a calldata-free simpleSend to internal addresses', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              nestedTransactions: [
                {
                  to: NESTED_ADDRESS_A as `0x${string}`,
                  type: TransactionType.simpleSend,
                },
                {
                  to: NESTED_ADDRESS_B as `0x${string}`,
                  type: TransactionType.simpleSend,
                },
              ],
            },
            {
              ...buildStateForAddresses(
                {
                  [NESTED_ADDRESS_A]: ResultType.Benign,
                  [NESTED_ADDRESS_B]: ResultType.Benign,
                },
                [ETHEREUM_CHAIN_ID],
              ),
              internalAddresses: [
                TO_ADDRESS,
                NESTED_ADDRESS_A,
                NESTED_ADDRESS_B,
              ],
            },
          ),
        ).toBe(false);
      });

      it('remains eligible for a batch where a nested call is a contractInteraction', () => {
        // Nested B is a payable contract (external, benign). It is not a
        // calldata-free simpleSend and not internal, so it survives filtering
        // and is trust-checked; being benign (not trusted) keeps the tx eligible.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              nestedTransactions: [
                {
                  to: NESTED_ADDRESS_A as `0x${string}`,
                  type: TransactionType.simpleSend,
                },
                {
                  to: NESTED_ADDRESS_B as `0x${string}`,
                  type: TransactionType.contractInteraction,
                },
              ],
            },
            {
              ...buildStateForAddresses(
                {
                  [NESTED_ADDRESS_A]: ResultType.Benign,
                  [NESTED_ADDRESS_B]: ResultType.Benign,
                },
                [ETHEREUM_CHAIN_ID],
              ),
              // A is internal (self); B is the external payable contract.
              internalAddresses: [TO_ADDRESS, NESTED_ADDRESS_A],
            },
          ),
        ).toBe(true);
      });

      it('is not eligible (trusted) for a batch where a nested simpleSend carries calldata', () => {
        // Nested A is a simpleSend with calldata: `simpleSend` means no code at
        // the recipient, so it is trusted regardless of calldata. The outer call
        // targets an internal address, so the whole batch is trusted.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              nestedTransactions: [
                {
                  to: NESTED_ADDRESS_A as `0x${string}`,
                  type: TransactionType.simpleSend,
                  data: '0xabcd',
                },
              ],
            },
            {
              ...buildStateForAddresses(
                { [NESTED_ADDRESS_A]: ResultType.Benign },
                [ETHEREUM_CHAIN_ID],
              ),
              internalAddresses: [TO_ADDRESS],
            },
          ),
        ).toBe(false);
      });

      it('remains eligible for a batch where a nested call type is undefined (fail closed)', () => {
        // Nested A has an unknown type (external, benign). Only simpleSend is
        // excluded, so an undefined type survives filtering and is trust-checked;
        // being benign (not trusted) keeps the tx eligible.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, type: undefined },
              ],
            },
            {
              ...buildStateForAddresses(
                { [NESTED_ADDRESS_A]: ResultType.Benign },
                [ETHEREUM_CHAIN_ID],
              ),
              internalAddresses: [TO_ADDRESS],
            },
          ),
        ).toBe(true);
      });

      it('is not eligible (trusted) for a batch of calldata-free simpleSends with an external nested recipient', () => {
        // Every call is a calldata-free `simpleSend`, so the batch is trusted
        // regardless of whether nested recipients are internal or external.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              nestedTransactions: [
                {
                  to: NESTED_ADDRESS_A as `0x${string}`,
                  type: TransactionType.simpleSend,
                },
              ],
            },
            {
              ...buildStateForAddresses(
                { [NESTED_ADDRESS_A]: ResultType.Benign },
                [ETHEREUM_CHAIN_ID],
              ),
              // Outer recipient internal, nested recipient external.
              internalAddresses: [TO_ADDRESS],
            },
          ),
        ).toBe(false);
      });

      it('excludes a calldata-free simpleSend call from the trust check even when its recipient is malicious', () => {
        // Mixed batch: a simpleSend to a malicious address (excluded) plus a
        // contractInteraction to a trusted address (checked). Because the
        // simpleSend is filtered out, only the trusted contract is checked, so
        // the whole batch is trusted and not eligible.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              nestedTransactions: [
                {
                  to: NESTED_ADDRESS_A as `0x${string}`,
                  type: TransactionType.simpleSend,
                },
                {
                  to: NESTED_ADDRESS_B as `0x${string}`,
                  type: TransactionType.contractInteraction,
                },
              ],
            },
            {
              ...buildStateForAddresses(
                {
                  [NESTED_ADDRESS_A]: ResultType.Malicious,
                  [NESTED_ADDRESS_B]: ResultType.Trusted,
                },
                [ETHEREUM_CHAIN_ID],
              ),
              internalAddresses: [TO_ADDRESS],
            },
          ),
        ).toBe(false);
      });

      it('remains eligible when a non-simpleSend call targets a malicious address', () => {
        // The contractInteraction is not excluded, is malicious (not trusted),
        // so the transaction stays eligible for enforced simulation.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...SELF_SEND_META,
              nestedTransactions: [
                {
                  to: NESTED_ADDRESS_A as `0x${string}`,
                  type: TransactionType.simpleSend,
                },
                {
                  to: NESTED_ADDRESS_B as `0x${string}`,
                  type: TransactionType.contractInteraction,
                },
              ],
            },
            {
              ...buildStateForAddresses(
                {
                  [NESTED_ADDRESS_A]: ResultType.Trusted,
                  [NESTED_ADDRESS_B]: ResultType.Malicious,
                },
                [ETHEREUM_CHAIN_ID],
              ),
              internalAddresses: [TO_ADDRESS],
            },
          ),
        ).toBe(true);
      });
    });

    describe('with trust signal state', () => {
      it('returns true when address is not trusted', () => {
        expect(
          isEnforcedSimulationsEligible(
            BASE_TRANSACTION_META,
            buildState(ResultType.Benign),
          ),
        ).toBe(true);
      });

      it('returns true when address is malicious', () => {
        expect(
          isEnforcedSimulationsEligible(
            BASE_TRANSACTION_META,
            buildState(ResultType.Malicious),
          ),
        ).toBe(true);
      });

      it('returns false when address is trusted', () => {
        expect(
          isEnforcedSimulationsEligible(
            BASE_TRANSACTION_META,
            buildState(ResultType.Trusted),
          ),
        ).toBe(false);
      });

      it('returns false when trust signal is still loading', () => {
        expect(
          isEnforcedSimulationsEligible(
            BASE_TRANSACTION_META,
            buildState(ResultType.Loading),
          ),
        ).toBe(false);
      });

      it('returns false when no cache entry exists', () => {
        expect(
          isEnforcedSimulationsEligible(BASE_TRANSACTION_META, {
            addressSecurityAlertResponses: {},
            eip7702SupportedChains: [ETHEREUM_CHAIN_ID],
            internalAddresses: [],
          }),
        ).toBe(false);
      });

      it('returns true when a chain with no slug mapping has a non-trusted cached result', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              chainId: UNSUPPORTED_CHAIN_ID,
            },
            buildState(
              ResultType.Benign,
              [UNSUPPORTED_CHAIN_ID],
              UNSUPPORTED_CHAIN_ID,
            ),
          ),
        ).toBe(true);
      });

      it('returns false when an unmapped chain recipient has a cached Trusted verdict', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              chainId: UNMAPPED_CHAIN_ID,
            },
            buildState(
              ResultType.Trusted,
              [UNMAPPED_CHAIN_ID],
              UNMAPPED_CHAIN_ID,
            ),
          ),
        ).toBe(false);
      });

      it('exempts a chain with no slug mapping when the recipient has never been scanned', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              chainId: UNMAPPED_CHAIN_ID,
            },
            {
              addressSecurityAlertResponses: {},
              eip7702SupportedChains: [UNMAPPED_CHAIN_ID],
              internalAddresses: [],
            },
          ),
        ).toBe(false);
      });

      it('still enforces when the cached verdict is ErrorResult', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              chainId: UNMAPPED_CHAIN_ID,
            },
            buildState(
              ResultType.ErrorResult,
              [UNMAPPED_CHAIN_ID],
              UNMAPPED_CHAIN_ID,
            ),
          ),
        ).toBe(true);
      });

      it('exempts a transaction with no recipient addresses on a chain with no slug mapping', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              chainId: UNMAPPED_CHAIN_ID,
              txParams: {
                ...BASE_TRANSACTION_META.txParams,
                to: undefined,
              },
              nestedTransactions: undefined,
            },
            {
              addressSecurityAlertResponses: {},
              eip7702SupportedChains: [UNMAPPED_CHAIN_ID],
              internalAddresses: [],
            },
          ),
        ).toBe(false);
      });

      it('returns false when chainId is undefined', () => {
        expect(
          isEnforcedSimulationsEligible(
            { ...BASE_TRANSACTION_META, chainId: undefined as never },
            buildState(ResultType.Benign),
          ),
        ).toBe(false);
      });

      it('uses txParamsOriginal.to when container wrapping changed txParams.to', () => {
        const trustedDelegationManager = '0xTrustedDelegationManager';
        const trustedCacheKey = createCacheKey(
          ETHEREUM_CHAIN_ID,
          trustedDelegationManager,
        );

        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              txParams: {
                ...BASE_TRANSACTION_META.txParams,
                to: trustedDelegationManager,
              },
              txParamsOriginal: {
                ...BASE_TRANSACTION_META.txParams,
                to: TO_ADDRESS,
              },
            },
            {
              addressSecurityAlertResponses: {
                [CACHE_KEY]: buildCacheEntry(ResultType.Benign),
                [trustedCacheKey]: buildCacheEntry(ResultType.Trusted),
              },
              eip7702SupportedChains: [ETHEREUM_CHAIN_ID],
              internalAddresses: [],
            },
          ),
        ).toBe(true);
      });

      it('returns false when no to addresses exist on supported chain', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              txParams: { ...BASE_TRANSACTION_META.txParams, to: undefined },
              nestedTransactions: undefined,
            },
            buildState(ResultType.Benign),
          ),
        ).toBe(false);
      });
    });

    describe('with internal address exclusion', () => {
      it('returns false (trusted) when the only to address is an internal address', () => {
        expect(
          isEnforcedSimulationsEligible(BASE_TRANSACTION_META, {
            ...buildState(ResultType.Benign),
            internalAddresses: [TO_ADDRESS],
          }),
        ).toBe(false);
      });

      it('returns true when mix of internal and untrusted external addresses', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, data: '0xabcd' },
              ],
            },
            {
              ...buildStateForAddresses({
                [TO_ADDRESS]: ResultType.Benign,
                [NESTED_ADDRESS_A]: ResultType.Benign,
              }),
              internalAddresses: [TO_ADDRESS],
            },
          ),
        ).toBe(true);
      });

      it('matches internal addresses case-insensitively', () => {
        expect(
          isEnforcedSimulationsEligible(BASE_TRANSACTION_META, {
            ...buildState(ResultType.Benign),
            internalAddresses: [TO_ADDRESS.toUpperCase()],
          }),
        ).toBe(false);
      });

      it('internal address filtered out, remaining external malicious address is still eligible', () => {
        // Proves the filter only removes internal addresses, not external ones.
        // TO_ADDRESS is internal; NESTED_ADDRESS_A is external and malicious — tx is still eligible.
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, data: '0xabcd' },
              ],
            },
            {
              ...buildStateForAddresses({
                [TO_ADDRESS]: ResultType.Benign,
                [NESTED_ADDRESS_A]: ResultType.Malicious,
              }),
              internalAddresses: [TO_ADDRESS],
            },
          ),
        ).toBe(true);
      });
    });

    describe('with nested transactions', () => {
      it('returns true when primary is trusted but a nested address is not', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, data: '0xabcd' },
              ],
            },
            buildStateForAddresses({
              [TO_ADDRESS]: ResultType.Trusted,
              [NESTED_ADDRESS_A]: ResultType.Benign,
            }),
          ),
        ).toBe(true);
      });

      it('returns true when no primary to but nested address is untrusted', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              txParams: { ...BASE_TRANSACTION_META.txParams, to: undefined },
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, data: '0xabcd' },
              ],
            },
            buildStateForAddresses({
              [NESTED_ADDRESS_A]: ResultType.Malicious,
            }),
          ),
        ).toBe(true);
      });

      it('returns false when all addresses including nested are trusted', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, data: '0xabcd' },
                { to: NESTED_ADDRESS_B as `0x${string}`, data: '0xabcd' },
              ],
            },
            buildStateForAddresses({
              [TO_ADDRESS]: ResultType.Trusted,
              [NESTED_ADDRESS_A]: ResultType.Trusted,
              [NESTED_ADDRESS_B]: ResultType.Trusted,
            }),
          ),
        ).toBe(false);
      });

      it('returns false when nested addresses are all loading', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              txParams: { ...BASE_TRANSACTION_META.txParams, to: undefined },
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, data: '0xabcd' },
                { to: NESTED_ADDRESS_B as `0x${string}`, data: '0xabcd' },
              ],
            },
            buildStateForAddresses({
              [NESTED_ADDRESS_A]: ResultType.Loading,
              [NESTED_ADDRESS_B]: ResultType.Loading,
            }),
          ),
        ).toBe(false);
      });

      it('returns true with mix of trusted and untrusted nested addresses', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, data: '0xabcd' },
                { to: NESTED_ADDRESS_B as `0x${string}`, data: '0xabcd' },
              ],
            },
            buildStateForAddresses({
              [TO_ADDRESS]: ResultType.Trusted,
              [NESTED_ADDRESS_A]: ResultType.Trusted,
              [NESTED_ADDRESS_B]: ResultType.Warning,
            }),
          ),
        ).toBe(true);
      });
    });

    describe('with FORCE_ENFORCED_SIMULATIONS', () => {
      beforeEach(() => {
        process.env.FORCE_ENFORCED_SIMULATIONS = 'true';
      });

      it('returns true even when recipient is trusted', () => {
        expect(
          isEnforcedSimulationsEligible(
            BASE_TRANSACTION_META,
            buildState(ResultType.Trusted),
          ),
        ).toBe(true);
      });

      it('returns true even when all nested addresses are trusted', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              nestedTransactions: [
                { to: NESTED_ADDRESS_A as `0x${string}`, data: '0xabcd' },
                { to: NESTED_ADDRESS_B as `0x${string}`, data: '0xabcd' },
              ],
            },
            buildStateForAddresses({
              [TO_ADDRESS]: ResultType.Trusted,
              [NESTED_ADDRESS_A]: ResultType.Trusted,
              [NESTED_ADDRESS_B]: ResultType.Trusted,
            }),
          ),
        ).toBe(true);
      });

      it('returns true even when there are no balance changes', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              simulationData: { tokenBalanceChanges: [] },
            },
            buildState(ResultType.Trusted),
          ),
        ).toBe(true);
      });

      it('returns true when origin is MetaMask internal', () => {
        expect(
          isEnforcedSimulationsEligible(
            { ...BASE_TRANSACTION_META, origin: ORIGIN_METAMASK },
            buildState(ResultType.Trusted),
          ),
        ).toBe(true);
      });

      it('is ignored when value is not the string "true"', () => {
        process.env.FORCE_ENFORCED_SIMULATIONS = '1';

        expect(
          isEnforcedSimulationsEligible(
            BASE_TRANSACTION_META,
            buildState(ResultType.Trusted),
          ),
        ).toBe(false);
      });
    });
  });
});
