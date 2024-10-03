import React from 'react';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { setBackgroundConnection } from '../../../store/background-connection';
import {
  AccountOverviewBtc,
  AccountOverviewBtcProps,
} from './account-overview-btc';

const defaultProps: AccountOverviewBtcProps = {
  defaultHomeActiveTabName: '',
  onTabClick: jest.fn(),
  setBasicFunctionalityModalOpen: jest.fn(),
  onSupportLinkClick: jest.fn(),
};

const render = (props: AccountOverviewBtcProps = defaultProps) => {
  const store = configureStore({
    metamask: mockState.metamask,
  });

  return renderWithProvider(<AccountOverviewBtc {...props} />, store);
};

describe('AccountOverviewBtc', () => {
  beforeEach(() => {
    setBackgroundConnection({ setBridgeFeatureFlags: jest.fn() } as never);
  });

  it('shows only Tokens and Activity tabs', () => {
    const { queryByTestId } = render();

    expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
    expect(queryByTestId('account-overview__nfts-tab')).not.toBeInTheDocument();
    expect(queryByTestId('account-overview__activity-tab')).toBeInTheDocument();
  });

  it('does not show tokens links', () => {
    const { queryByTestId } = render();

    expect(queryByTestId('account-overview__asset-tab')).toBeInTheDocument();
    expect(queryByTestId('import-token-button')).not.toBeInTheDocument();
    // TODO: This one might be required, but we do not really handle tokens for BTC yet...
    expect(queryByTestId('refresh-list-button')).not.toBeInTheDocument();
  });
});
