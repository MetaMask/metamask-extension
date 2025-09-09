import React from 'react';
import { fireEvent } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { AccountNetworkIndicator } from '.';

const MOCK_SCOPES = ['eip155:0', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'];

const render = (scopes = MOCK_SCOPES) => {
  return renderWithProvider(
    <AccountNetworkIndicator scopes={scopes} />,
    configureStore(mockState),
  );
};

describe('AccountNetworkIndicator', () => {
  it('renders the avatar group with network images', () => {
    const { getByTestId, container } = render();

    const avatarGroup = getByTestId('avatar-group');
    expect(avatarGroup).toBeTruthy();

    const networkImages = container.querySelectorAll(
      '.mm-avatar-network__network-image',
    );
    expect(networkImages.length).toBeGreaterThan(0);

    expect(container).toMatchSnapshot('account-network-indicator');
  });

  it('shows the tooltip when hovered', () => {
    const { container, getByText } = render();

    const tooltipTrigger = container.querySelector('[data-tooltipped]');
    expect(tooltipTrigger).not.toBeNull();

    if (tooltipTrigger) {
      fireEvent.mouseEnter(tooltipTrigger);
      expect(tooltipTrigger.getAttribute('aria-describedby')).not.toBeNull();

      expect(getByText('Polygon')).toBeInTheDocument();
      expect(getByText('BNB Chain')).toBeInTheDocument();
    }
  });
});
