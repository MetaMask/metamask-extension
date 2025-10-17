import React from 'react';
import { fireEvent, screen, render } from '@testing-library/react';
import { BalanceEmptyState } from './balance-empty-state';

// Mock useRamps hook
const mockOpenBuyCryptoInPdapp = jest.fn();
jest.mock('../../../hooks/ramps/useRamps/useRamps', () => ({
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

// Mock useSelector
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

// Mock useContext
const mockTrackEvent = jest.fn();
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(() => mockTrackEvent),
}));

// Mock i18n hook
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const renderComponent = (props = {}) => {
  const { useSelector } = require('react-redux');

  // Mock selector returns
  useSelector
    .mockReturnValueOnce('en') // getCurrentLocale
    .mockReturnValueOnce('0x1') // getCurrentChainId
    .mockReturnValueOnce({ nickname: 'Ethereum Mainnet' }); // getMultichainCurrentNetwork

  return render(<BalanceEmptyState {...props} />);
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
