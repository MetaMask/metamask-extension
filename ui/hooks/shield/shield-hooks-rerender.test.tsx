import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { act } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import type { MetaMaskReduxState } from '../../store/types';
import * as actionConstants from '../../store/actionConstants';
import { useSubscriptionEligibility } from '../subscription/useSubscription';
import { useSubscriptionMetrics } from './metrics/useSubscriptionMetrics';

jest.mock('../useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({ trackEvent: jest.fn(), createEventBuilder }),
  };
});

const selectedAccount = getInternalAccountBySelectedAccountGroupAndCaip(
  mockState as unknown as MetaMaskReduxState,
  'eip155:1',
);
const address = (selectedAccount?.address ?? '').toLowerCase();

const initialState = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    enabledNetworkMap: { eip155: { [CHAIN_IDS.MAINNET]: true } },
    currencyRates: {
      ETH: { conversionRate: 1000, usdConversionRate: 1000 },
    },
    accountsByChainId: {
      [CHAIN_IDS.MAINNET]: { [address]: { balance: '0x2386f26fc10000' } },
    },
  },
};

// `ShieldSubscriptionProvider` sits at the root of the UI and calls both
// hooks, so anything they subscribe to re-renders the whole provider.
const hooks: [string, () => unknown][] = [
  [
    'useSubscriptionEligibility',
    () => useSubscriptionEligibility(PRODUCT_TYPES.SHIELD),
  ],
  ['useSubscriptionMetrics', () => useSubscriptionMetrics()],
];

describe('shield hooks', () => {
  hooks.forEach(([name, useHook]) => {
    it(`${name} does not re-render when the balance or exchange rates change`, () => {
      let renderCount = 0;
      const { store } = renderHookWithProvider(() => {
        renderCount += 1;
        return useHook();
      }, initialState);
      const rendersBeforeUpdate = renderCount;

      act(() => {
        store.dispatch({
          type: actionConstants.UPDATE_METAMASK_STATE,
          value: {
            currencyRates: {
              ETH: { conversionRate: 123.45, usdConversionRate: 123.45 },
            },
            accountsByChainId: {
              [CHAIN_IDS.MAINNET]: {
                [address]: { balance: '0x1bc16d674ec80000' },
              },
            },
          },
        });
      });

      expect(renderCount).toBe(rendersBeforeUpdate);
    });
  });
});
