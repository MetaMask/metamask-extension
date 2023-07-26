/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { shortenAddress } from '../../../helpers/utils/util';
import { AccountListItem } from '.';

const account = {
  ...mockState.metamask.internalAccounts.accounts[
    'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
  ],
  balance: '0x152387ad22c3f0',
};

const DEFAULT_PROPS = {
  account,
  onClick: jest.fn(),
};

const render = (props = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  const allProps = { ...DEFAULT_PROPS, ...props };
  return renderWithProvider(<AccountListItem {...allProps} />, store);
};

describe('AccountListItem', () => {
  it('renders AccountListItem component and shows account name, address, and balance', () => {
    const { container } = render();
    expect(screen.getByText(account.name)).toBeInTheDocument();
    expect(
      screen.getByText(shortenAddress(toChecksumHexAddress(account.address))),
    ).toBeInTheDocument();
    expect(document.querySelector('[title="0.006 ETH"]')).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  it('renders selected block when account is selected', () => {
    render({ selected: true });
    expect(
      document.querySelector('.multichain-account-list-item--selected'),
    ).toBeInTheDocument();
  });

  it('renders the account name tooltip for long names', () => {
    render({
      selected: true,
      account: {
        ...account,
        name: 'This is a super long name that requires tooltip',
      },
    });
    expect(
      document.querySelector('.multichain-account-list-item__tooltip'),
    ).toBeInTheDocument();
  });

  it('renders the tree-dot menu to lauch the details menu', () => {
    render();
    const optionsButton = document.querySelector(
      '[aria-label="Test Account Options"]',
    );
    expect(optionsButton).toBeInTheDocument();
    fireEvent.click(optionsButton);
    expect(
      document.querySelector('.multichain-account-list-item-menu__popover'),
    ).toBeInTheDocument();
  });

  it('executes the action when the item is clicked', () => {
    const onClick = jest.fn();
    render({ onClick });
    const item = document.querySelector('.multichain-account-list-item');
    fireEvent.click(item);
    expect(onClick).toHaveBeenCalled();
  });

  it('clicking the three-dot menu opens up options', () => {
    const onClick = jest.fn();
    render({ onClick });
    const item = document.querySelector(
      '[data-testid="account-list-item-menu-button"]',
    );
    fireEvent.click(item);
    expect(
      document.querySelector('[data-testid="account-list-menu-open-explorer"]'),
    ).toBeInTheDocument();
  });

  it('renders connected site icon', () => {
    const connectedAvatarName = 'Uniswap';
    const { getByAltText } = render({
      connectedAvatar: 'https://uniswap.org/favicon.ico',
      connectedAvatarName,
    });

    expect(getByAltText(`${connectedAvatarName} logo`)).toBeInTheDocument();
  });

  it('renders the snap label for snap accounts', () => {
    const { getByText } = render({
      account: {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          keyring: {
            type: 'Snap Keyring',
          },
        },
        name: 'Snap Account',
        options: {},
        supportedMethods: [
          'personal_sign',
          'eth_sendTransaction',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData',
          'eth_signTypedData_v1',
          'eth_signTypedData_v2',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      },
    });

    expect(getByText('Snaps')).toBeInTheDocument();
  });
});
