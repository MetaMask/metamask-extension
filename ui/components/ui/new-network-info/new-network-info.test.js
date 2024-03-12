import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import nock from 'nock';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import NewNetworkInfo from './new-network-info';

const fetchWithCache =
  require('../../../../shared/lib/fetch-with-cache').default;

const localStorageMock = (function () {
  let store = {};
  return {
    getItem(key) {
      return store[key];
    },

    setItem(key, value) {
      store[key] = value.toString();
    },

    clear() {
      store = {};
    },

    removeItem(key) {
      delete store[key];
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const responseOfTokenList = [
  {
    address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
    symbol: 'SNX',
    decimals: 18,
    name: 'Synthetix Network Token',
    iconUrl: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
    aggregators: [
      'aave',
      'bancor',
      'cmc',
      'cryptocom',
      'coinGecko',
      'oneInch',
      'paraswap',
      'pmm',
      'synthetix',
      'zapper',
      'zerion',
      'zeroEx',
    ],
    occurrences: 12,
  },
  {
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    symbol: 'UNI',
    decimals: 18,
    name: 'Uniswap',
    iconUrl:
      'https://images.prismic.io/token-price-prod/d0352dd9-5de8-4633-839d-bc3422c44d9c_UNI%404x.png',
    aggregators: [
      'aave',
      'bancor',
      'cmc',
      'cryptocom',
      'coinGecko',
      'oneInch',
      'paraswap',
      'pmm',
      'zapper',
      'zerion',
      'zeroEx',
    ],
    occurrences: 11,
  },
];
describe('NewNetworkInfo', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetch token successfully', () => {
    const state = {
      metamask: {
        providerConfig: {
          ticker: 'ETH',
          nickname: '',
          chainId: '0x1',
          type: 'mainnet',
        },
        useTokenDetection: false,
        currencyRates: {},
      },
    };

    it('should match snapshot and render component', async () => {
      nock('https://token-api.metaswap.codefi.network')
        .get('/tokens/0x1')
        .reply(200, responseOfTokenList);

      const store = configureMockStore()(state);
      const { getByText, getByTestId } = renderWithProvider(
        <NewNetworkInfo />,
        store,
      );
      // wait for the fetch to finish
      await waitFor(() => {
        expect(getByTestId('new-network-info__wrapper')).toBeInTheDocument();
      });
      // render title
      expect(getByText("You're now using")).toBeInTheDocument();
      // render the network name
      expect(getByText('Ethereum Mainnet')).toBeInTheDocument();
      expect(
        getByTestId('new-network-info__bullet-paragraph').textContent,
      ).toMatchInlineSnapshot(
        `"Gas is ETHThe native token on this network is ETH. It is the token used for gas fees."`,
      );
    });

    it('should render a question mark icon image for non-main network', async () => {
      nock('https://token-api.metaswap.codefi.network')
        .get('/tokens/0x1')
        .reply(200, responseOfTokenList);

      const updateTokenDetectionSupportStatus = await fetchWithCache({
        url: 'https://token-api.metaswap.codefi.network/tokens/0x1',
        functionName: 'getTokenDetectionSupportStatus',
      });

      state.metamask.nativeCurrency = '';

      const store = configureMockStore()(
        state,
        updateTokenDetectionSupportStatus,
      );
      const { container, getByTestId } = renderWithProvider(
        <NewNetworkInfo />,
        store,
      );
      // wait for the fetch to finish
      await waitFor(() => {
        expect(getByTestId('new-network-info__wrapper')).toBeInTheDocument();
      });

      const questionMark = container.querySelector('.question');

      expect(questionMark).toBeDefined();
    });

    it('should not render first bullet when provider ticker is null', async () => {
      nock('https://token-api.metaswap.codefi.network')
        .get('/tokens/0x3')
        .reply(200, '{"error":"ChainId 0x3 is not supported"}');

      state.metamask.providerConfig.ticker = null;

      const store = configureMockStore()(state);
      const { container, getByTestId } = renderWithProvider(
        <NewNetworkInfo />,
        store,
      );
      // wait for the fetch to finish
      await new Promise((r) => setTimeout(r, 2000));
      await waitFor(() => {
        expect(getByTestId('new-network-info__wrapper')).toBeInTheDocument();
      });
      const firstBox = container.querySelector(
        'new-network-info__content-box-1',
      );

      expect(firstBox).toBeNull();
    });

    describe('add token link', () => {
      const newState = {
        metamask: {
          providerConfig: {
            ticker: 'ETH',
            nickname: '',
            chainId: '0x1',
            type: 'mainnet',
          },
          useTokenDetection: true,
          currencyRates: {},
        },
      };

      it('should not render link when auto token detection is set true and token detection is supported', async () => {
        nock('https://token-api.metaswap.codefi.network')
          .get('/tokens/0x1')
          .reply(200, responseOfTokenList);

        const store = configureMockStore()(newState);
        const { getByTestId, queryByTestId } = renderWithProvider(
          <NewNetworkInfo />,
          store,
        );
        // should not render add token link
        await waitFor(() => {
          expect(getByTestId('new-network-info__wrapper')).toBeInTheDocument();
        });
        expect(
          queryByTestId('new-network-info__add-token-manually'),
        ).toBeNull();
      });

      it('should render link when auto token detection is set true and token detection is not supported', async () => {
        nock('https://token-api.metaswap.codefi.network')
          .get('/tokens/0x1')
          .replyWithError('something awful happened');

        const store = configureMockStore()(newState);
        const { getByTestId } = renderWithProvider(<NewNetworkInfo />, store);
        // render add token link when token is supported
        await waitFor(() => {
          expect(getByTestId('new-network-info__wrapper')).toBeInTheDocument();
        });
      });

      it('should render link when auto token detection is set false but token detection is not supported', async () => {
        nock('https://token-api.metaswap.codefi.network')
          .get('/tokens/0x1')
          .reply(403);

        const store = configureMockStore()(state);
        const { getByTestId } = renderWithProvider(<NewNetworkInfo />, store);
        // render add token link when token is supported
        await waitFor(() => {
          expect(getByTestId('new-network-info__wrapper')).toBeInTheDocument();
        });
        expect(
          getByTestId('new-network-info__add-token-manually'),
        ).toBeInTheDocument();
      });

      it('should render link when auto token detection is set false and token detection is supported', async () => {
        nock('https://token-api.metaswap.codefi.network')
          .get('/tokens/0x1')
          .reply(200, responseOfTokenList);

        const updateTokenDetectionSupportStatus = await fetchWithCache({
          url: 'https://token-api.metaswap.codefi.network/tokens/0x1',
          functionName: 'getTokenDetectionSupportStatus',
        });

        const store = configureMockStore()(
          state,
          updateTokenDetectionSupportStatus,
        );
        const { getByText, getByTestId } = renderWithProvider(
          <NewNetworkInfo />,
          store,
        );
        // wait for the fetch to finish
        await waitFor(() => {
          expect(getByTestId('new-network-info__wrapper')).toBeInTheDocument();
        });
        // render add token link when token is supported
        expect(
          getByText('Click here to manually add the tokens.'),
        ).toBeInTheDocument();
      });
    });
  });
});
