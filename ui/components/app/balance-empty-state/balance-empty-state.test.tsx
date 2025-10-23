import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import {
  BalanceEmptyState,
  BalanceEmptyStateProps,
} from './balance-empty-state';

// Mock useRamps hook
const mockOpenBuyCryptoInPdapp = jest.fn();
jest.mock('../../../hooks/ramps/useRamps/useRamps', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => ({
    openBuyCryptoInPdapp: mockOpenBuyCryptoInPdapp,
  })),
  RampsMetaMaskEntry: {
    TokensBanner: 'tokens-banner',
    ActivityBanner: 'activity-banner',
    BtcBanner: 'btc-banner',
  },
}));

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const renderComponent = (props: Partial<BalanceEmptyStateProps> = {}) => {
  return renderWithProvider(<BalanceEmptyState {...props} />, store);
};

describe('BalanceEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component', () => {
    renderComponent();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call openBuyCryptoInPdapp when button is clicked', () => {
    renderComponent();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOpenBuyCryptoInPdapp).toHaveBeenCalledTimes(1);
  });
});
