import { CaipAssetType } from '@metamask/utils';
import { isAssetsUnifyStateFeatureEnabled } from '../assets-unify-state/remote-feature-flag';
import {
  getMultiChainAssetsControllerAssetsMetadata,
  getMultiChainBalancesControllerBalances,
} from './assets-migration';
import realState from './__fixtures__/tron-real-state.json';

/**
 * Regression coverage for the Tron resource assets that disappear once the
 * `assetsUnifyState` rollout deprecates the legacy multichain controllers.
 *
 * The fixture is a trimmed slice of two real production state logs for the
 * same wallet shape: `legacy` comes from a 13.45.1 log (flag off, legacy
 * controllers still populated) and `unified` from a 13.47.0 log (flag on,
 * legacy controllers wiped).
 */

const ENERGY = 'tron:728126428/slip44:energy' as CaipAssetType;
const BANDWIDTH = 'tron:728126428/slip44:bandwidth' as CaipAssetType;
const NATIVE_TRX = 'tron:728126428/slip44:195' as CaipAssetType;

const { accountId, account, legacy, unified } = realState;

const setUnifyStateEnabled = (enabled: boolean) =>
  jest.mocked(isAssetsUnifyStateFeatureEnabled).mockReturnValue(enabled);

// `getIsAssetsUnifyStateEnabled` memoizes on `remoteFeatureFlags` alone, so each
// state needs its own object or the second one reuses the first one's result.
const buildState = (label: string, metamask: Record<string, unknown>) => ({
  metamask: {
    remoteFeatureFlags: {
      assetsUnifyState: { enabled: true, featureVersion: '1', label },
    },
    internalAccounts: {
      accounts: { [accountId]: account },
      selectedAccount: accountId,
    },
    ...metamask,
  },
});

// Mirrors a pre-rollout client: legacy controllers hold the data.
const legacyState = buildState('legacy', {
  balances: { [accountId]: legacy.balances },
  assetsMetadata: legacy.assetsMetadata,
  assetsBalance: {},
  assetsInfo: {},
});

// Mirrors a post-rollout client: legacy controllers wiped, unified populated.
const unifiedState = buildState('unified', {
  balances: {},
  assetsMetadata: {},
  assetsBalance: { [accountId]: unified.assetsBalance },
  assetsInfo: unified.assetsInfo,
});

describe('Tron resource assets across the assetsUnifyState rollout', () => {
  describe('legacy state (13.45.1, flag off)', () => {
    beforeEach(() => setUnifyStateEnabled(false));

    it('exposes Energy and Bandwidth balances', () => {
      const balances =
        getMultiChainBalancesControllerBalances(legacyState)[accountId];

      expect(balances[ENERGY]).toMatchObject({ unit: 'ENERGY' });
      expect(balances[BANDWIDTH]).toMatchObject({ unit: 'BANDWIDTH' });
    });

    it('exposes Energy and Bandwidth metadata', () => {
      const metadata = getMultiChainAssetsControllerAssetsMetadata(legacyState);

      expect(metadata[ENERGY]).toBeDefined();
      expect(metadata[BANDWIDTH]).toBeDefined();
    });
  });

  describe('unified state (13.47.0, flag on)', () => {
    beforeEach(() => setUnifyStateEnabled(true));

    it('still carries the raw Energy and Bandwidth amounts in assetsBalance', () => {
      expect(unified.assetsBalance[ENERGY]).toStrictEqual({ amount: '5' });
      expect(unified.assetsBalance[BANDWIDTH]).toStrictEqual({
        amount: '332',
      });
    });

    it('surfaces Energy and Bandwidth balances via the Tron augmentation', () => {
      const balances =
        getMultiChainBalancesControllerBalances(unifiedState)[accountId];

      expect(balances[NATIVE_TRX]).toBeDefined();
      expect(balances[ENERGY]).toStrictEqual({ amount: '5', unit: 'ENERGY' });
      expect(balances[BANDWIDTH]).toStrictEqual({
        amount: '332',
        unit: 'BANDWIDTH',
      });
    });

    it('surfaces Energy and Bandwidth metadata via the Tron augmentation', () => {
      const metadata =
        getMultiChainAssetsControllerAssetsMetadata(unifiedState);

      expect(metadata[NATIVE_TRX]).toBeDefined();
      expect(metadata[ENERGY]).toMatchObject({
        symbol: 'ENERGY',
        units: [{ decimals: 0, name: 'Energy', symbol: 'ENERGY' }],
      });
      expect(metadata[BANDWIDTH]).toMatchObject({ symbol: 'BANDWIDTH' });
    });

    it('no longer drops any Tron asset the account holds', () => {
      const balances =
        getMultiChainBalancesControllerBalances(unifiedState)[accountId];

      expect(Object.keys(balances)).toHaveLength(
        Object.keys(unified.assetsBalance).length,
      );
    });
  });
});
