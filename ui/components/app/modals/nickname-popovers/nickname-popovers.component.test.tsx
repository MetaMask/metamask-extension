import React from 'react';
import { fireEvent } from '@testing-library/react';
import { BtcAccountType } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP,
  MultichainNetworks,
} from '../../../../../shared/constants/multichain/networks';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { mockNetworkState } from '../../../../../test/stub/networks';
import NicknamePopover from './nickname-popovers.component';

const mockAccount = createMockInternalAccount({
  name: 'Account 1',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
});

const mockNonEvmAccount = createMockInternalAccount({
  name: 'Account 1',
  address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  type: BtcAccountType.P2wpkh,
});

const mockEvmExplorer = 'http://mock-explorer.com';

const render = (
  {
    props,
  }: {
    props: {
      address: string;
      onClose?: () => void;
    };
  } = {
    props: {
      address: mockAccount.address,
      onClose: jest.fn(),
    },
  },
) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      internalAccounts: {
        accounts: {
          [mockAccount.id]: mockAccount,
          [mockNonEvmAccount.id]: mockNonEvmAccount,
        },
        selectedAccount: mockAccount.id,
      },
      ...mockNetworkState({
        chainId: '0x5',
        blockExplorerUrl: mockEvmExplorer,
      }),
      completedOnboarding: true,
    },
  });

  return renderWithProvider(<NicknamePopover {...props} />, store);
};

describe('NicknamePopover', () => {
  it('matches snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('opens EVM block explorer', () => {
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };

    // Accounts controlelr addresses are lower cased but it gets converted to checksummed in this util
    const expectedExplorerUrl = `${mockEvmExplorer}/address/${normalizeSafeAddress(
      mockAccount.address,
    )}`;
    const { getByText } = render({ props: { address: mockAccount.address } });

    const viewExplorerButton = getByText('View on block explorer');
    fireEvent.click(viewExplorerButton);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: expectedExplorerUrl,
    });
  });

  it('opens non-EVM block explorer', () => {
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };
    const expectedExplorerUrl = `${
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_URL_MAP[MultichainNetworks.BITCOIN]
    }/${normalizeSafeAddress(mockNonEvmAccount.address)}`;

    const { getByText } = render({
      props: { address: mockNonEvmAccount.address },
    });

    const viewExplorerButton = getByText('View on block explorer');

    fireEvent.click(viewExplorerButton);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: expectedExplorerUrl,
    });
  });
});
