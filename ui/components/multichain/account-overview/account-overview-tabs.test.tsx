import React from 'react';
import { fireEvent } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { AccountOverviewTabKey } from '../../../../shared/constants/app-state';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { AccountOverviewTabs } from './account-overview-tabs';

jest.mock('../../app/assets/asset-list', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../../app/transaction-list', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../../app/assets/nfts/nfts-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock(
  '../../app/transaction-list/unified-transaction-list.component',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => null,
  }),
);

jest.mock('../../app/assets/defi-list/defi-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

describe('AccountOverviewTabs - event metrics', () => {
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes network_filter property with both EVM and non-EVM networks in CAIP format', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.POLYGON]: true,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
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
    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.TokenScreenOpened,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        network_filter: [
          'eip155:1',
          'eip155:137',
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        ],
      },
    });
  });
});
