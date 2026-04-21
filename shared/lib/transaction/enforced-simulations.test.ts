import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  SimulationTokenStandard,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { CachedScanAddressResponse, ResultType } from '../trust-signals';
import {
  EnforcedSimulationsState,
  getEnforcedSimulationsSlippage,
  isEnforcedSimulationsEligible,
} from './enforced-simulations';

const ETHEREUM_CHAIN_ID: Hex = '0x1';
const UNSUPPORTED_CHAIN_ID: Hex = '0xdeadbeef';
const TO_ADDRESS = '0xRecipientAddress';
const NESTED_ADDRESS_A = '0xNestedAddressA';
const NESTED_ADDRESS_B = '0xNestedAddressB';
const CACHE_KEY = `ethereum:${TO_ADDRESS.toLowerCase()}`;

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
  eip7702SupportedChains = [ETHEREUM_CHAIN_ID],
): EnforcedSimulationsState {
  return {
    addressSecurityAlertResponses: {
      [CACHE_KEY]: buildCacheEntry(resultType),
    },
    eip7702SupportedChains,
  };
}

function buildStateForAddresses(
  entries: Record<string, ResultType>,
  eip7702SupportedChains = [ETHEREUM_CHAIN_ID],
): EnforcedSimulationsState {
  const responses: Record<string, CachedScanAddressResponse> = {};

  for (const [address, resultType] of Object.entries(entries)) {
    const key = `ethereum:${address.toLowerCase()}`;
    responses[key] = buildCacheEntry(resultType);
  }

  return {
    addressSecurityAlertResponses: responses,
    eip7702SupportedChains,
  };
}

describe('enforced-simulations', () => {
  describe('getEnforcedSimulationsSlippage', () => {
    it('returns the default slippage percentage', () => {
      expect(getEnforcedSimulationsSlippage()).toBe(10);
    });
  });

  describe('getIsEnforcedSimulationsEligible', () => {
    beforeEach(() => {
      process.env.ENABLE_ENFORCED_SIMULATIONS = 'true';
    });

    afterEach(() => {
      delete process.env.ENABLE_ENFORCED_SIMULATIONS;
    });

    it('returns true when all conditions are met', () => {
      expect(
        isEnforcedSimulationsEligible(
          BASE_TRANSACTION_META,
          buildState(ResultType.Benign),
        ),
      ).toBe(true);
    });

    it('returns false when env flag is not set', () => {
      delete process.env.ENABLE_ENFORCED_SIMULATIONS;

      expect(isEnforcedSimulationsEligible(BASE_TRANSACTION_META)).toBe(false);
    });

    it('returns false when origin is undefined', () => {
      expect(
        isEnforcedSimulationsEligible({
          ...BASE_TRANSACTION_META,
          origin: undefined,
        }),
      ).toBe(false);
    });

    it('returns false when origin is MetaMask internal', () => {
      expect(
        isEnforcedSimulationsEligible({
          ...BASE_TRANSACTION_META,
          origin: ORIGIN_METAMASK,
        }),
      ).toBe(false);
    });

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

    it('returns false when simulation data is undefined', () => {
      expect(
        isEnforcedSimulationsEligible(
          { ...BASE_TRANSACTION_META, simulationData: undefined },
          buildState(ResultType.Benign),
        ),
      ).toBe(false);
    });

    it('returns false when simulation data has no balance changes', () => {
      expect(
        isEnforcedSimulationsEligible(
          {
            ...BASE_TRANSACTION_META,
            simulationData: { tokenBalanceChanges: [] },
          },
          buildState(ResultType.Benign),
        ),
      ).toBe(false);
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
          }),
        ).toBe(false);
      });

      it('returns true when chain is not supported by trust signals', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              chainId: UNSUPPORTED_CHAIN_ID,
            },
            buildState(ResultType.Benign, [UNSUPPORTED_CHAIN_ID]),
          ),
        ).toBe(true);
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
        const trustedCacheKey = `ethereum:${trustedDelegationManager.toLowerCase()}`;

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

    describe('with nested transactions', () => {
      it('returns true when primary is trusted but a nested address is not', () => {
        expect(
          isEnforcedSimulationsEligible(
            {
              ...BASE_TRANSACTION_META,
              nestedTransactions: [{ to: NESTED_ADDRESS_A as `0x${string}` }],
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
              nestedTransactions: [{ to: NESTED_ADDRESS_A as `0x${string}` }],
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
                { to: NESTED_ADDRESS_A as `0x${string}` },
                { to: NESTED_ADDRESS_B as `0x${string}` },
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
                { to: NESTED_ADDRESS_A as `0x${string}` },
                { to: NESTED_ADDRESS_B as `0x${string}` },
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
                { to: NESTED_ADDRESS_A as `0x${string}` },
                { to: NESTED_ADDRESS_B as `0x${string}` },
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
  });
});
