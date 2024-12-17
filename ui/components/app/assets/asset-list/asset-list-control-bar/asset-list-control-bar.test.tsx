import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/jest';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import AssetListControlBar from './asset-list-control-bar';

describe('AssetListControlBar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fire metrics event when refresh button is clicked', async () => {
    const store = configureMockStore([thunk])({
      metamask: {
        selectedNetworkClientId: 'selectedNetworkClientId',
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                networkClientId: 'selectedNetworkClientId',
              },
            ],
          },
        },
      },
    });

    const mockTrackEvent = jest.fn();

    const { findByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <AssetListControlBar />
      </MetaMetricsContext.Provider>,
      store,
    );

    const importButton = await findByTestId('import-token-button');
    importButton.click();

    const refreshListItem = await findByTestId('refreshList__button');
    refreshListItem.click();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Tokens,
      event: MetaMetricsEventName.TokenListRefreshed,
    });
  });
});
