import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { DailyAllowance, TokenSymbol } from '../../remote.types';
import RemoteModeDailyAllowanceCard from './remote-mode-daily-allowance-card.component';

const mockDailyAllowance: DailyAllowance = {
  tokenType: TokenSymbol.USDC,
  amount: 100,
  iconUrl: './images/icon-usdc.png',
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
