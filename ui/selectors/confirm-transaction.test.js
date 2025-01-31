import { CHAIN_IDS } from '../../shared/constants/network';
import { mockNetworkState } from '../../test/stub/networks';
import { conversionRateSelector } from './confirm-transaction';

describe('Confirm Transaction Selector', () => {
  describe('conversionRateSelector', () => {
    it('returns conversionRate from state', () => {
      const state = {
        metamask: {
          currencyRates: {
            ETH: {
              conversionRate: 556.12,
            },
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      };
      expect(conversionRateSelector(state)).toStrictEqual(556.12);
    });
  });
});
