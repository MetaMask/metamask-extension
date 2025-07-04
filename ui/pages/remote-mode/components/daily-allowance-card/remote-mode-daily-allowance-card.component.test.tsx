import React from 'react';
import configureMockStore from 'redux-mock-store';
import { AssetType } from '@metamask/bridge-controller';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import {
  DailyAllowance,
  TOKEN_DETAILS,
  TokenSymbol,
} from '../../../../../shared/lib/remote-mode';
import RemoteModeDailyAllowanceCard from './remote-mode-daily-allowance-card.component';

const mockDailyAllowance: DailyAllowance = {
  symbol: TokenSymbol.USDC,
  amount: 100,
  image: TOKEN_DETAILS[TokenSymbol.USDC].image,
  name: TOKEN_DETAILS[TokenSymbol.USDC].name,
  type: AssetType.token,
  address: '',
  decimals: 6,
};

const renderComponent = (
  props = {
    dailyAllowance: mockDailyAllowance,
    onRemove: () => undefined,
  },
) => {
  const store = configureMockStore([])({
    metamask: {},
  });
  return renderWithProvider(<RemoteModeDailyAllowanceCard {...props} />, store);
};

describe('RemoteModeDailyAllowanceCard Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();
    const { getByText } = renderComponent({
      dailyAllowance: mockDailyAllowance,
      onRemove,
    });
    getByText('Remove').click();
    expect(onRemove).toHaveBeenCalled();
  });
});
