import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { BtcAccountType } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { addressSummary } from '../../../../helpers/utils/util';
import { getMultichainAccountUrl } from '../../../../helpers/utils/multichain/blockExplorer';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import { mockNetworkState } from '../../../../../test/stub/networks';
import ConfirmRemoveAccount from '.';

global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };

const mockAccount = createMockInternalAccount({
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  name: 'Account 1',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
});

const mockNonEvmAccount = createMockInternalAccount({
  id: 'e3a1c914-0bf3-41b3-b569-7c00185ad982',
  name: 'Btc account',
  address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  type: BtcAccountType.P2wpkh,
});

const mockEvmNetwork = {
  nickname: 'network',
  isEvmNetwork: true,
  chainId: 'eip155:99',
  network: {
    type: 'rpc',
    chainId: '0x99',
    rpcUrl: 'https://rpc.network',
    rpcPrefs: {
      blockExplorerUrl: 'https://explorer.network',
    },
  },
};

const mockNonEvmNetwork = {
  nickname: 'network',
  isEvmNetwork: true,
  chainId: MultichainNetworks.BITCOIN,
  network: {
    chainId: MultichainNetworks.BITCOIN,
    rpcPrefs: {
      blockExplorerUrl: 'https://blockstream.info',
    },
  },
};

describe('Confirm Remove Account', () => {
  const state = {
    metamask: {
      completedOnboarding: true,
      ...mockNetworkState({ chainId: '0x99' }),
      internalAccounts: {
        accounts: {
          [mockAccount.id]: mockAccount,
          [mockNonEvmAccount.id]: mockNonEvmAccount,
        },
        selectedAccount: mockNonEvmAccount,
      },
    },
  };

  const props = {
    hideModal: jest.fn(),
    removeAccount: jest.fn().mockResolvedValue(),
    account: mockAccount,
    network: mockEvmNetwork,
  };

  const mockStore = configureMockStore()(state);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should only hide modal when clicking "Nevermind"', () => {
    const { queryByText } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    fireEvent.click(queryByText('Nevermind'));

    expect(props.removeAccount).not.toHaveBeenCalled();
    expect(props.hideModal).toHaveBeenCalled();
  });

  it('should call method removeAccount with account address', async () => {
    const { queryByText } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    fireEvent.click(queryByText('Remove'));

    expect(props.removeAccount).toHaveBeenCalledWith(props.account.address);
    expect(props.hideModal).toHaveBeenCalled();
  });

  it('should close modal when clicking close from the header', () => {
    const { queryByTestId } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    fireEvent.click(queryByTestId('modal-header-close'));

    expect(props.hideModal).toHaveBeenCalled();
  });

  it('should display non-EVM accounts and explorer link leads to non-EVM explorer', async () => {
    const updatedProps = {
      ...props,
      account: mockNonEvmAccount,
      network: mockNonEvmNetwork,
    };
    const expectedAddressSummary = addressSummary(
      mockNonEvmAccount.address,
      4,
      4,
      false,
    );

    const expectedAccountLink = getMultichainAccountUrl(
      mockNonEvmAccount.address,
      mockNonEvmNetwork,
    );

    const { getByText, getByTestId } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...updatedProps} />,
      mockStore,
    );

    expect(getByText(expectedAddressSummary)).toBeInTheDocument();

    const explorerLink = getByTestId('explorer-link');
    expect(explorerLink).toBeInTheDocument();

    fireEvent.click(explorerLink);

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: expectedAccountLink,
    });
  });
});
