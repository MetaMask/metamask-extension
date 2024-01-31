/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { shortenAddress } from '../../../helpers/utils/util';
import { AccountListItem } from '.';

const identity = {
  ...mockState.metamask.identities[
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
  ],
  balance: '0x152387ad22c3f0',
};

const DEFAULT_PROPS = {
  identity,
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
    expect(screen.getByText(identity.name)).toBeInTheDocument();
    expect(
      screen.getByText(shortenAddress(toChecksumHexAddress(identity.address))),
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
        ...identity,
        name: 'This is a super long name that requires tooltip',
      },
    });
    expect(
      document.querySelector('.multichain-account-list-item__tooltip'),
    ).toBeInTheDocument();
  });

  it('renders the three-dot menu to lauch the details menu', () => {
    render({ showOptions: true });
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
    render({ onClick, showOptions: true });
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

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  it('renders the snap label for snap accounts', () => {
    const { getByText } = render({
      identity: {
        address: '0xb552685e3d2790eFd64a175B00D51F02cdaFEe5D',
        name: 'Snap Account',
      },
    });

    expect(getByText('Snaps (Beta)')).toBeInTheDocument();
  });
  ///: END:ONLY_INCLUDE_IF
});
