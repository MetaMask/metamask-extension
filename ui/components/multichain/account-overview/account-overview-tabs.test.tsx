import React from 'react';
import { fireEvent } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { AccountOverviewTabKey } from '../../../../shared/constants/app-state';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { AccountOverviewTabs } from './account-overview-tabs';

jest.mock('../../app/assets/asset-list', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../app/transaction-list', () => ({
  __esModule: true,
  default: () => null,
}));

describe('AccountOverviewTabs - event metrics', () => {
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes network_filter property with enabled networks in CAIP format', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: {
          'eip155': {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.POLYGON]: true,
          },
        },
      },
    });

    const { getByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <AccountOverviewTabs
          onTabClick={jest.fn()}
          defaultHomeActiveTabName={AccountOverviewTabKey.Activity}
          showTokens={true}
          showNfts={false}
          showActivity={true}
          setBasicFunctionalityModalOpen={jest.fn()}
          onSupportLinkClick={jest.fn()}
        />
      </MetaMetricsContext.Provider>,
      store,
    );

    // Click a tab to trigger event
    fireEvent.click(getByText('Tokens'));

    // Verify network_filter property is included in correct format
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          network_filter: expect.arrayContaining(['eip155:1', 'eip155:137']),
        }),
      }),
    );
  });
});
