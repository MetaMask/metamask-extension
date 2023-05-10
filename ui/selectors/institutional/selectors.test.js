import { toChecksumAddress } from 'ethereumjs-util';
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

describe('Institutional selectors', () => {
  const state = {
    metamask: {
      providerConfig: {
        type: 'test',
        chainId: '1',
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

  describe('getWaitForConfirmDeepLinkDialog', () => {
    it('extracts a state property', () => {
      const result = getWaitForConfirmDeepLinkDialog(state);
      expect(result).toStrictEqual(state.metamask.waitForConfirmDeepLinkDialog);
    });
  });

  describe('getCustodyAccountDetails', () => {
    it('extracts a state property', () => {
      const result = getCustodyAccountDetails(state);
      expect(result).toStrictEqual(state.metamask.custodyAccountDetails);
    });
  });

  describe('getTransactionStatusMap', () => {
    it('extracts a state property', () => {
      const result = getTransactionStatusMap(state);
      expect(result).toStrictEqual(state.metamask.custodyStatusMaps);
    });
  });

  describe('getCustodianSupportedChains', () => {
    it('extracts a state property', () => {
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
      const result = getMmiPortfolioEnabled(state);
      expect(result).toStrictEqual(
        state.metamask.mmiConfiguration.portfolio.enabled,
      );
    });
  });

  describe('getMmiPortfolioUrl', () => {
    it('extracts a state property', () => {
      const result = getMmiPortfolioUrl(state);
      expect(result).toStrictEqual(
        state.metamask.mmiConfiguration.portfolio.url,
      );
    });
  });

  describe('getConfiguredCustodians', () => {
    it('extracts a state property', () => {
      const result = getConfiguredCustodians(state);
      expect(result).toStrictEqual(state.metamask.mmiConfiguration.custodians);
    });
  });

  describe('getCustodianIconForAddress', () => {
    it('extracts a state property', () => {
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
    it('extracts a state property', () => {
      const result = getIsCustodianSupportedChain(
        state,
        '0x5ab19e7091dd208f352f8e727b6dcc6f8abb6275',
      );
      expect(result).toStrictEqual(true);
    });
  });
});
