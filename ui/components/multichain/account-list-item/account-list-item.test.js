/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { shortenAddress } from '../../../helpers/utils/util';
import { AccountListItem, AccountListItemMenuTypes } from '.';

const account = {
  ...mockState.metamask.internalAccounts.accounts[
    'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
  ],
  balance: '0x152387ad22c3f0',
  keyring: {
    type: 'HD Key Tree',
  },
};

const DEFAULT_PROPS = {
  identity: account,
  onClick: jest.fn(),
};

const render = (props = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
    activeTab: {
      id: 113,
      title: 'E2E Test Dapp',
      origin: 'https://metamask.github.io',
      protocol: 'https:',
      url: 'https://metamask.github.io/test-dapp/',
    },
  });
  const allProps = { ...DEFAULT_PROPS, ...props };
  return renderWithProvider(<AccountListItem {...allProps} />, store);
};

describe('AccountListItem', () => {
  it('renders AccountListItem component and shows account name, address, and balance', () => {
    const { container } = render();
    expect(screen.getByText(account.metadata.name)).toBeInTheDocument();
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
      identity: {
        ...account,
        metadata: {
          ...account.metadata,
          name: 'This is a super long name that requires tooltip',
        },
      },
    });
    expect(
      document.querySelector('.multichain-account-list-item__tooltip'),
    ).toBeInTheDocument();
  });

  it('renders the three-dot menu to launch the details menu', () => {
    render({ menuType: AccountListItemMenuTypes.Account });
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
    render({ onClick, menuType: AccountListItemMenuTypes.Account });
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

  it('does not render a tag for a null label', () => {
    const { container } = render({
      identity: {
        ...account,
        label: null,
      },
    });
    expect(container.querySelector('.mm-tag')).not.toBeInTheDocument();
  });

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  it('renders the snap label for unnamed snap accounts', () => {
    const { container } = render({
      identity: {
        ...account,
        balance: '0x0',
        keyring: 'Snap Keyring',
        label: 'Snaps (Beta)',
      },
    });
    const tag = container.querySelector('.mm-tag');
    expect(tag.textContent).toBe('Snaps (Beta)');
  });

  it('renders the snap name for named snap accounts', () => {
    const { container } = render({
      identity: {
        ...account,
        balance: '0x0',
        keyring: 'Snap Keyring',
        label: 'Test Snap Name (Beta)',
      },
    });
    const tag = container.querySelector('.mm-tag');
    expect(tag.textContent).toBe('Test Snap Name (Beta)');
  });
  ///: END:ONLY_INCLUDE_IF
});
