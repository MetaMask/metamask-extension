import React from 'react';
import { it } from '@jest/globals';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { AppLayoutProvider } from '../../../contexts/app-layout';
import { AccountOverviewTabs } from './account-overview-tabs';

jest.mock('../../../store/actions', () => ({
  setDefaultHomeActiveTabName: jest.fn(),
  detectNfts: jest.fn(() => ({ type: 'MOCK_DETECT_NFTS' })),
}));

jest.mock('../../app/assets/asset-list', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ variant }: { variant?: string }) => (
    <div data-testid="asset-list" data-variant={variant} />
  ),
}));

jest.mock('../../app/assets/nfts/nfts-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../../app/assets/defi-list/defi-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

const renderTabs = ({
  isWideLayout = false,
}: {
  isWideLayout?: boolean;
} = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      enabledNetworkMap: { eip155: { [CHAIN_IDS.MAINNET]: true } },
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        assetsDefiPositionsEnabled: true,
      },
    },
  });

  return renderWithProvider(
    <AppLayoutProvider isWideLayout={isWideLayout}>
      <AccountOverviewTabs
        setBasicFunctionalityModalOpen={jest.fn()}
        onSupportLinkClick={jest.fn()}
      />
    </AppLayoutProvider>,
    store,
  );
};

describe('AccountOverviewTabs', () => {
  it('renders the token, defi, and nft tabs', () => {
    const { getByTestId } = renderTabs();

    expect(getByTestId('account-overview__asset-tab')).toBeInTheDocument();
    expect(getByTestId('account-overview__defi-tab')).toBeInTheDocument();
    expect(getByTestId('account-overview__nfts-tab')).toBeInTheDocument();
  });

  it.each<[boolean, string]>([
    [true, 'table'],
    [false, 'list'],
  ])(
    'renders the asset list with isWideLayout %s as the %s variant',
    (isWideLayout, variant) => {
      const { getByTestId } = renderTabs({ isWideLayout });

      expect(getByTestId('asset-list')).toHaveAttribute(
        'data-variant',
        variant,
      );
    },
  );
});
