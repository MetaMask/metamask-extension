import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import {
  SwapAllowance,
  TokenSymbol,
} from '../../../../../shared/lib/remote-mode';
import RemoteModeSwapAllowanceCard from './remote-mode-swap-allowance-card.component';

const mockSwapAllowance: SwapAllowance = {
  from: TokenSymbol.USDC,
  to: TokenSymbol.WETH,
  amount: 100,
};

const renderComponent = (
  props = {
    swapAllowance: mockSwapAllowance,
    onRemove: () => undefined,
  },
) => {
  const store = configureMockStore([])({
    metamask: {},
  });
  return renderWithProvider(<RemoteModeSwapAllowanceCard {...props} />, store);
};

describe('RemoteModeSwapAllowanceCard Component', () => {
  it('should render correctly', () => {
    expect(() => {
      renderComponent();
    }).not.toThrow();
  });

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();
    const { getByText } = renderComponent({
      swapAllowance: mockSwapAllowance,
      onRemove,
    });
    getByText('Remove').click();
    expect(onRemove).toHaveBeenCalled();
  });
});
