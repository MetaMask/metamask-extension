import React from 'react';
import { fireEvent } from '@testing-library/react';
import { EthScope } from '@metamask/keyring-api';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { AccountNetworkIndicator } from '.';

// Use a real account from mockState and override address and scopes
const accountKeys = Object.keys(mockState.metamask.internalAccounts.accounts);
const firstAccountKey =
  accountKeys[0] as keyof typeof mockState.metamask.internalAccounts.accounts;
const baseAccount =
  mockState.metamask.internalAccounts.accounts[firstAccountKey];

const mockEvmAccount: MergedInternalAccount = {
  ...baseAccount,
  scopes: [EthScope.Eoa],
  type: 'eip155:eoa',
  balance: '0x0',
  pinned: false,
  hidden: false,
  lastSelected: 0,
  active: 0,
  keyring: { type: 'HD Key Tree' },
  label: null,
};

const render = (account = mockEvmAccount) => {
  return renderWithProvider(
    <AccountNetworkIndicator account={account} />,
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
      expect(getByText('Binance Smart Chain')).toBeInTheDocument();
    }
  });
});
