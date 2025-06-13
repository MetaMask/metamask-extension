import React from 'react';
import configureMockStore from 'redux-mock-store';
import { AssetType } from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import {
  DailyAllowance,
  TOKEN_DETAILS,
  TokenSymbol,
} from '../../../../../shared/lib/remote-mode';
import SendAllowanceBanner from './send-allowance-banner.component';

const mockAllowance: DailyAllowance = {
  symbol: TokenSymbol.ETH,
  amount: 100,
  image: TOKEN_DETAILS[TokenSymbol.ETH].image,
  name: TOKEN_DETAILS[TokenSymbol.ETH].name,
  type: AssetType.native,
  address: '',
  decimals: 18,
};

const renderComponent = () => {
  const store = configureMockStore()({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isRemoteModeEnabled: true,
    },
  });
  return renderWithProvider(
    <SendAllowanceBanner allowance={mockAllowance} />,
    store,
  );
};

// note: placeholder test for now (will be expanded as component is finalized)
describe('SendAllowanceBanner Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });
});
