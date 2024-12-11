import React from 'react';
import { RequestStatus } from '../../../../shared/constants/bridge';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import { BridgeQuotesModal } from './bridge-quotes-modal';

describe('BridgeQuotesModal', () => {
  it('should render the modal', () => {
    const mockStore = createBridgeMockStore({
      bridgeStateOverrides: {
        quotes: mockBridgeQuotesErc20Erc20,
        getQuotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    });

    const { baseElement } = renderWithProvider(
      <BridgeQuotesModal
        isOpen={true}
        onClose={() => {
          console.log('close');
        }}
      />,
      configureStore(mockStore),
    );

    expect(baseElement).toMatchSnapshot();
  });
});
