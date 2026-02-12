import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NetworkFilterComponent } from '.';

// Mock the i18n hook to simply return the key
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

// Mock the NetworkFilter component to render a simple div for testing purposes
jest.mock('../../app/assets/asset-list/network-filter', () => () => (
  <div>NetworkFilter</div>
));

describe('NetworkFilterComponent', () => {
  const defaultProps = {
    isFullScreen: false,
    toggleNetworkFilterPopover: jest.fn(),
    isTestNetwork: false,
    currentNetworkConfig: {
      chainId: '0x1',
      nickname: 'Ethereum',
    },
    isNetworkFilterPopoverOpen: false,
    closePopover: jest.fn(),
    isTokenNetworkFilterEqualCurrentNetwork: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<NetworkFilterComponent {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it('renders button with current network nickname when isTokenNetworkFilterEqualCurrentNetwork is true', () => {
    render(<NetworkFilterComponent {...defaultProps} />);
    const button = screen.getByTestId('sort-by-popover-toggle');
    expect(button).toHaveTextContent('Ethereum');
  });

  it('renders button with popularNetworks text when isTokenNetworkFilterEqualCurrentNetwork is false', () => {
    render(
      <NetworkFilterComponent
        {...defaultProps}
        isTokenNetworkFilterEqualCurrentNetwork={false}
      />,
    );
    const button = screen.getByTestId('sort-by-popover-toggle');
    expect(button).toHaveTextContent('popularNetworks');
  });

  it('calls toggleNetworkFilterPopover when button is clicked', () => {
    render(<NetworkFilterComponent {...defaultProps} />);
    const button = screen.getByTestId('sort-by-popover-toggle');
    fireEvent.click(button);
    expect(defaultProps.toggleNetworkFilterPopover).toHaveBeenCalled();
  });

  it('disables button when isTestNetwork is true', () => {
    render(<NetworkFilterComponent {...defaultProps} isTestNetwork={true} />);
    const button = screen.getByTestId('sort-by-popover-toggle');
    expect(button).toBeDisabled();
  });

  it('disables button when currentNetworkConfig.chainId is not in FEATURED_NETWORK_CHAIN_IDS', () => {
    // Use a chain id that is not in the featured list
    render(
      <NetworkFilterComponent
        {...defaultProps}
        currentNetworkConfig={{ chainId: '0x999', nickname: 'Unknown' }}
      />,
    );
    const button = screen.getByTestId('sort-by-popover-toggle');
    expect(button).toBeDisabled();
  });

  it('renders the popover with NetworkFilter component when isNetworkFilterPopoverOpen is true', () => {
    render(
      <NetworkFilterComponent
        {...defaultProps}
        isNetworkFilterPopoverOpen={true}
      />,
    );
    // Check that the NetworkFilter mock is rendered inside the popover
    expect(screen.getByText('NetworkFilter')).toBeInTheDocument();
  });
});
