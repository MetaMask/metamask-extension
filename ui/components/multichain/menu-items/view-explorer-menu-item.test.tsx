import React from 'react';
import { BtcAccountType } from '@metamask/keyring-api';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import { formatBlockExplorerAddressUrl } from '../../../../shared/lib/multichain/networks';
import { ViewExplorerMenuItem } from '.';

const mockAccount = createMockInternalAccount({
  name: 'Account 1',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
});

const mockNonEvmAccount = createMockInternalAccount({
  address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  type: BtcAccountType.P2wpkh,
});

const render = (account = mockAccount) => {
  const defaultState = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
    },
  };
  const store = configureStore(defaultState);
  return renderWithProvider(
    <ViewExplorerMenuItem
      metricsLocation="Global Menu"
      closeMenu={jest.fn()}
      account={account}
    />,
    store,
  );
};

describe('ViewExplorerMenuItem', () => {
  it('renders "View on explorer"', () => {
    // @ts-expect-error mocking platform
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };

    const { getByText, getByTestId } = render();
    expect(getByText('View on explorer')).toBeInTheDocument();

    const openExplorerTabSpy = jest.spyOn(global.platform, 'openTab');
    fireEvent.click(getByTestId('account-list-menu-open-explorer'));
    expect(openExplorerTabSpy).toHaveBeenCalled();
  });

  it('renders "View on explorer" for non-EVM account', () => {
    const expectedExplorerUrl = formatBlockExplorerAddressUrl(
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
        MultichainNetworks.BITCOIN
      ],
      mockNonEvmAccount.address,
    );
    const expectedExplorerUrlHost = new URL(expectedExplorerUrl).host;
    // @ts-expect-error mocking platform
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };

    const { getByText, getByTestId } = render(mockNonEvmAccount);
    expect(getByText('View on explorer')).toBeInTheDocument();
    expect(getByText(expectedExplorerUrlHost)).toBeInTheDocument();

    const openExplorerTabSpy = jest.spyOn(global.platform, 'openTab');
    fireEvent.click(getByTestId('account-list-menu-open-explorer'));
    expect(openExplorerTabSpy).toHaveBeenCalledWith({
      url: expectedExplorerUrl,
    });
  });
});
