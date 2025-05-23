import React from 'react';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import { NetworkListItem } from './network-list-item';

describe('NetworkListItem Component', () => {
  const defaultProps = {
    name: 'Ethereum Mainnet',
    src: './images/ethereum.png',
    isChecked: false,
    onCheckboxChange: jest.fn(),
    onMoreOptionsClick: jest.fn(),
  };

  const renderComponent = (props = {}) => {
    const store = configureStore({});
    return renderWithProvider(
      <NetworkListItem {...defaultProps} {...props} />,
      store,
    );
  };

  afterEach(() => {
    cleanup();
  });

  it('renders the network name correctly', () => {
    renderComponent();
    expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
  });

  it('shows a loading skeleton when balance is not provided', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('displays the balance when provided', () => {
    renderComponent({ balance: '0.5 ETH' });
    expect(screen.getByText('0.5 ETH')).toBeInTheDocument();
  });

  it('renders checkbox with correct checked state', () => {
    // Test unchecked state
    renderComponent({ isChecked: false });
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    cleanup(); // Clean up the DOM

    // Test checked state in a fresh render
    renderComponent({ isChecked: true });
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onCheckboxChange when checkbox is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(defaultProps.onCheckboxChange).toHaveBeenCalledTimes(1);
  });

  it('calls onMoreOptionsClick when more options button is clicked', () => {
    renderComponent({ balance: '0.5 ETH' });

    // More options button only appears when balance is provided
    fireEvent.click(screen.getByLabelText('More options'));
    expect(defaultProps.onMoreOptionsClick).toHaveBeenCalledTimes(1);
  });

  it('does not show more options button when balance is not provided', () => {
    renderComponent();

    expect(screen.queryByLabelText('More options')).not.toBeInTheDocument();
  });
});
