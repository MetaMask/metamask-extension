import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  SimulationTokenStandard,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { ResultType } from '../trust-signals';
import {
  getEnforcedSimulationsSlippage,
  getIsEnforcedSimulationsEligible,
  isAddressTrusted,
} from './enforced-simulations';

const ETHEREUM_CHAIN_ID = '0x1';
const UNSUPPORTED_CHAIN_ID = '0xdeadbeef';
const TO_ADDRESS = '0xRecipientAddress';

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
      expect(getIsEnforcedSimulationsEligible(BASE_TRANSACTION_META)).toBe(
        true,
      );
    });

    it('returns false when env flag is not set', () => {
      delete process.env.ENABLE_ENFORCED_SIMULATIONS;

      expect(getIsEnforcedSimulationsEligible(BASE_TRANSACTION_META)).toBe(
        false,
      );
    });

    it('returns false when origin is undefined', () => {
      expect(
        getIsEnforcedSimulationsEligible({
          ...BASE_TRANSACTION_META,
          origin: undefined,
        }),
      ).toBe(false);
    });

    it('returns false when origin is MetaMask internal', () => {
      expect(
        getIsEnforcedSimulationsEligible({
          ...BASE_TRANSACTION_META,
          origin: ORIGIN_METAMASK,
        }),
      ).toBe(false);
    });

    it('returns false when delegation address is missing', () => {
      expect(
        getIsEnforcedSimulationsEligible({
          ...BASE_TRANSACTION_META,
          delegationAddress: undefined,
        }),
      ).toBe(false);
    });

    it('returns false when simulation data is undefined', () => {
      expect(
        getIsEnforcedSimulationsEligible({
          ...BASE_TRANSACTION_META,
          simulationData: undefined,
        }),
      ).toBe(false);
    });

    it('returns false when simulation data has no balance changes', () => {
      expect(
        getIsEnforcedSimulationsEligible({
          ...BASE_TRANSACTION_META,
          simulationData: { tokenBalanceChanges: [] },
        }),
      ).toBe(false);
    });

    it('returns true when simulation data has only token balance changes', () => {
      expect(
        getIsEnforcedSimulationsEligible({
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
        }),
      ).toBe(true);
    });
  });

  describe('isAddressTrusted', () => {
    it('returns true when address has trusted result type', () => {
      const cacheKey = `ethereum:${TO_ADDRESS.toLowerCase()}`;

      expect(
        isAddressTrusted(TO_ADDRESS, ETHEREUM_CHAIN_ID, {
          addressSecurityAlertResponses: {
            [cacheKey]: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              result_type: ResultType.Trusted,
              label: 'trusted',
              timestamp: Date.now(),
            },
          },
        }),
      ).toBe(true);
    });

    it('returns false when address has malicious result type', () => {
      const cacheKey = `ethereum:${TO_ADDRESS.toLowerCase()}`;

      expect(
        isAddressTrusted(TO_ADDRESS, ETHEREUM_CHAIN_ID, {
          addressSecurityAlertResponses: {
            [cacheKey]: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              result_type: ResultType.Malicious,
              label: 'malicious',
              timestamp: Date.now(),
            },
          },
        }),
      ).toBe(false);
    });

    it('returns false when no cache entry exists', () => {
      expect(
        isAddressTrusted(TO_ADDRESS, ETHEREUM_CHAIN_ID, {
          addressSecurityAlertResponses: {},
        }),
      ).toBe(false);
    });

    it('returns false when chain is not supported', () => {
      expect(
        isAddressTrusted(TO_ADDRESS, UNSUPPORTED_CHAIN_ID, {
          addressSecurityAlertResponses: {},
        }),
      ).toBe(false);
    });
  });
});
