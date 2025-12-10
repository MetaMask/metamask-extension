import React from 'react';
import { Hex } from '@metamask/utils';
import { fireEvent } from '@testing-library/dom';

import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import { EIP7702NetworkConfiguration } from '../../../../hooks/useBatchAuthorizationRequests';
import { AccountNetwork } from './account-network';

const mockDowngradeAccount = jest.fn();
const mockUpgradeAccount = jest.fn();
jest.mock('../../../../hooks/useEIP7702Account', () => ({
  useEIP7702Account: () => ({
    downgradeAccount: mockDowngradeAccount,
    upgradeAccount: mockUpgradeAccount,
  }),
}));

const ADDRESS_MOCK = Object.values(
  mockState.metamask.internalAccounts.accounts,
)[0].address as Hex;

function renderComponent(
  networkConfig: Partial<EIP7702NetworkConfiguration> = {},
) {
  return renderWithProvider(
    <AccountNetwork
      address={ADDRESS_MOCK}
      networkConfiguration={
        {
          chainId: 'eip155:0xaa36a7',
          chainIdHex: '0xaa36a7',
          name: 'Sepolia',
          isSupported: true,
          upgradeContractAddress: '0x1',
          isEvm: true,
          nativeCurrency: 'ETH',
          blockExplorerUrls: [''],
          defaultBlockExplorerUrlIndex: 1,
          ...networkConfig,
        } as EIP7702NetworkConfiguration
      }
    />,
    configureStore(mockState),
  );
}

describe('AccountNetwork', () => {
  it('renders details about the network', async () => {
    const { getByText } = renderComponent();

    expect(getByText('Sepolia')).toBeInTheDocument();
    expect(getByText('Smart Account')).toBeInTheDocument();
    expect(getByText('Switch back')).toBeInTheDocument();
  });

  it('click on switch should call downgradeAccount method for smart accounts', async () => {
    const { getByText } = renderComponent();
    fireEvent.click(getByText('Switch back'));

    expect(mockDowngradeAccount).toHaveBeenCalled();
  });

  it('click on switch should call upgradeAccount method for standard accounts', async () => {
    const { getByText } = renderComponent({ isSupported: false });
    fireEvent.click(getByText('Switch'));

    expect(mockUpgradeAccount).toHaveBeenCalled();
  });
});
