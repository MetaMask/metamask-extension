import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { NotificationDetailNetworkFee } from './notification-detail-network-fee';

describe('NotificationDetailNetworkFee', () => {
  const defaultProps = {
    networkFee: '$0.62 (0.00039275 ETH)',
    gasLimit: '21000',
    gasUsed: '21000',
    baseFee: '17.202502617',
    priorityFee: '1.5',
    maxFee: '1.5 (0.00000003 ETH)',
  };

  it('renders without crashing', () => {
    const { getByText } = render(
      <NotificationDetailNetworkFee {...defaultProps} />,
    );
    expect(getByText('Network Fee')).toBeInTheDocument();
  });

  it('toggles fee details on click', () => {
    const { getByText } = render(
      <NotificationDetailNetworkFee {...defaultProps} />,
    );
    const button = getByText('Network Fee');
    fireEvent.click(button);
    expect(getByText('Gas limit (units)')).toBeInTheDocument();
    expect(getByText('Gas used (units)')).toBeInTheDocument();
    expect(getByText('Base fee (GWEI)')).toBeInTheDocument();
    expect(getByText('Priority fee (GWEI)')).toBeInTheDocument();
    expect(getByText('Max fee per gas')).toBeInTheDocument();
  });
});
