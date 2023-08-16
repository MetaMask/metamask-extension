import { toChecksumAddress } from 'ethereumjs-util';
import { toHex } from '@metamask/controller-utils';
import {
  getConfiguredCustodians,
  getCustodianIconForAddress,
  getCustodyAccountDetails,
  getCustodyAccountSupportedChains,
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
  getTransactionStatusMap,
  getWaitForConfirmDeepLinkDialog,
  getIsCustodianSupportedChain,
} from './selectors';

function buildState(overrides = {}) {
  const defaultState = {
    metamask: {
      providerConfig: {
        type: 'test',
        chainId: toHex(1),
      },
      identities: {
        '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
          name: 'Custody Account A',
          address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
        },
      },
      selectedAddress: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
      waitForConfirmDeepLinkDialog: '123',
      keyrings: [
        {
          type: 'Custody',
          accounts: ['0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275'],
        },
      ],
      custodyStatusMaps: '123',
      custodyAccountDetails: {
        '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
          custodianName: 'saturn',
        },
      },
      custodianSupportedChains: {
        '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
          supportedChains: ['1', '2'],
          custodianName: 'saturn',
        },
      },
      mmiConfiguration: {
        portfolio: {
          enabled: true,
          url: 'https://dashboard.metamask-institutional.io',
        },
        custodians: [
          {
            type: 'saturn',
            name: 'saturn',
            apiUrl: 'https://saturn-custody.dev.metamask-institutional.io',
            iconUrl: 'images/saturn.svg',
            displayName: 'Saturn Custody',
            production: true,
            refreshTokenUrl: null,
            isNoteToTraderSupported: false,
            version: 1,
          },
        ],
      },
    },
  };
  return { ...defaultState, ...overrides };
}

describe('Institutional selectors', () => {
  describe('getWaitForConfirmDeepLinkDialog', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getWaitForConfirmDeepLinkDialog(state);
      expect(result).toStrictEqual(state.metamask.waitForConfirmDeepLinkDialog);
    });
  });

  describe('getCustodyAccountDetails', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getCustodyAccountDetails(state);
      expect(result).toStrictEqual(state.metamask.custodyAccountDetails);
    });
  });

  describe('getTransactionStatusMap', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getTransactionStatusMap(state);
      expect(result).toStrictEqual(state.metamask.custodyStatusMaps);
    });
  });

  describe('getCustodianSupportedChains', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getCustodyAccountSupportedChains(
        state,
        '0x5ab19e7091dd208f352f8e727b6dcc6f8abb6275',
      );
      expect(result).toStrictEqual(
        state.metamask.custodianSupportedChains[
          toChecksumAddress('0x5ab19e7091dd208f352f8e727b6dcc6f8abb6275')
        ],
      );
    });
  });

  describe('getMmiPortfolioEnabled', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getMmiPortfolioEnabled(state);
      expect(result).toStrictEqual(
        state.metamask.mmiConfiguration.portfolio.enabled,
      );
    });
  });

  describe('getMmiPortfolioUrl', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getMmiPortfolioUrl(state);
      expect(result).toStrictEqual(
        state.metamask.mmiConfiguration.portfolio.url,
      );
    });
  });

  describe('getConfiguredCustodians', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getConfiguredCustodians(state);
      expect(result).toStrictEqual(state.metamask.mmiConfiguration.custodians);
    });
  });

  describe('getCustodianIconForAddress', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getCustodianIconForAddress(
        state,
        '0x5ab19e7091dd208f352f8e727b6dcc6f8abb6275',
      );

      expect(result).toStrictEqual(
        state.metamask.mmiConfiguration.custodians[0].iconUrl,
      );
    });
  });

  describe('getIsCustodianSupportedChain', () => {
    it('returns true if the current keyring type is "custody" and currently selected chain ID is in the list of supported chain IDs', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          identities: {
            [accountAddress]: {
              address: accountAddress,
            },
          },
          keyrings: [
            {
              type: 'Custody',
              accounts: [accountAddress],
            },
          ],
          custodianSupportedChains: {
            [accountAddress]: {
              supportedChains: ['1', '2', '3'],
            },
          },
          selectedAddress: accountAddress,
          providerConfig: {
            chainId: toHex(1),
          },
        },
      });

      const isSupported = getIsCustodianSupportedChain(state);

      expect(isSupported).toBe(true);
    });

    it('returns false if the current keyring type is "custody" and the currently selected chain ID is not in the list of supported chain IDs', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          identities: {
            [accountAddress]: {
              address: accountAddress,
            },
          },
          keyrings: [
            {
              type: 'Custody',
              accounts: [accountAddress],
            },
          ],
          custodianSupportedChains: {
            [accountAddress]: {
              supportedChains: ['4'],
            },
          },
          selectedAddress: accountAddress,
          providerConfig: {
            chainId: toHex(1),
          },
        },
      });

      const isSupported = getIsCustodianSupportedChain(state);

      expect(isSupported).toBe(false);
    });

    it('returns true if the current keyring type is not "custody"', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          identities: {
            [accountAddress]: {
              address: accountAddress,
            },
          },
          keyrings: [
            {
              type: 'SomethingElse',
              accounts: [accountAddress],
            },
          ],
          custodianSupportedChains: {
            [accountAddress]: {
              supportedChains: ['4'],
            },
          },
          selectedAddress: accountAddress,
          providerConfig: {
            chainId: toHex(1),
          },
        },
      });

      const isSupported = getIsCustodianSupportedChain(state);

      expect(isSupported).toBe(true);
    });
  });
});
