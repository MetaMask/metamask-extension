import React from 'react';
import { waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import nock from 'nock';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
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

const responseOfTokenList = [];
describe('NewNetworkInfo', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetch token successfully', () => {
    const state = {
      metamask: {
        ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        useExternalServices: true,
        useTokenDetection: false,
        currencyRates: {},
      },
    };

    it('should match snapshot and render component', async () => {
      nock('https://token.api.cx.metamask.io')
        .get('/tokens/0x1?occurrenceFloor=100&includeNativeAssets=false')
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
        `"Gas is ETH The native token on this network is ETH. It is the token used for gas fees. "`,
      );
    });

    it('should render a question mark icon image for non-main network', async () => {
      nock('https://token.api.cx.metamask.io')
        .get('/tokens/0x1?occurrenceFloor=100&includeNativeAssets=false')
        .reply(200, responseOfTokenList);

      const updateTokenDetectionSupportStatus = await fetchWithCache({
        url: 'https://token.api.cx.metamask.io/tokens/0x1?occurrenceFloor=100&includeNativeAssets=false',
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
      nock('https://token.api.cx.metamask.io')
        .get('/tokens/0x3?occurrenceFloor=100&includeNativeAssets=false')
        .reply(200, '{"error":"ChainId 0x3 is not supported"}');

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
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),

          useExternalServices: true,
          useTokenDetection: true,
          currencyRates: {},
        },
      };

      it('should not render link when auto token detection is set true and token detection is supported', async () => {
        nock('https://token.api.cx.metamask.io')
          .get('/tokens/0x1?occurrenceFloor=100&includeNativeAssets=false')
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
        nock('https://token.api.cx.metamask.io')
          .get('/tokens/0x1?occurrenceFloor=100&includeNativeAssets=false')
          .replyWithError('something awful happened');

        const store = configureMockStore()(newState);
        const { getByTestId } = renderWithProvider(<NewNetworkInfo />, store);
        // render add token link when token is supported
        await waitFor(() => {
          expect(getByTestId('new-network-info__wrapper')).toBeInTheDocument();
        });
      });

      it('should render link when auto token detection is set false but token detection is not supported', async () => {
        nock('https://token.api.cx.metamask.io')
          .get('/tokens/0x1?occurrenceFloor=100&includeNativeAssets=false')
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
        nock('https://token.api.cx.metamask.io')
          .get('/tokens/0x1?occurrenceFloor=100&includeNativeAssets=false')
          .reply(200, responseOfTokenList);

        const updateTokenDetectionSupportStatus = await fetchWithCache({
          url: 'https://token.api.cx.metamask.io/tokens/0x1?occurrenceFloor=100&includeNativeAssets=false',
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
          getByText(
            'Your tokens may not automatically show up in your wallet. You can always add tokens manually.',
          ),
        ).toBeInTheDocument();
      });
    });
  });
});
