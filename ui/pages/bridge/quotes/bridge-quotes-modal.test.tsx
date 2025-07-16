import React from 'react';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { RequestStatus } from '../../../../app/scripts/controllers/bridge/constants';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import { BridgeQuotesModal } from './bridge-quotes-modal';

describe('BridgeQuotesModal', () => {
  it('should render the modal', () => {
    const mockStore = createBridgeMockStore(
      {},
      {},
      {
        quotes: mockBridgeQuotesErc20Erc20,
        getQuotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.FETCHED,
      },
    );

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
