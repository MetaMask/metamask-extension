/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { merge } from 'lodash';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { shortenAddress } from '../../../helpers/utils/util';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import {
  SEPOLIA_DISPLAY_NAME,
  CHAIN_IDS,
} from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { AccountListItem, AccountListItemMenuTypes } from '.';

const mockAccount = {
  ...mockState.metamask.internalAccounts.accounts[
    'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
  ],
  balance: '0x152387ad22c3f0',
  keyring: {
    type: 'HD Key Tree',
  },
};

const mockNonEvmAccount = {
  ...mockAccount,
  id: 'b7893c59-e376-4cc0-93ad-05ddaab574a6',
  address: 'bc1qn3stuu6g37rpxk3jfxr4h4zmj68g0lwxx5eker',
  type: 'bip122:p2wpkh',
};

const DEFAULT_PROPS = {
  account: mockAccount,
  selected: false,
  onClick: jest.fn(),
};

const render = (props = {}, state = {}) => {
  const defaultState = {
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      internalAccounts: {
        accounts: {
          ...mockState.metamask.internalAccounts.accounts,
          [mockAccount.id]: mockAccount,
          [mockNonEvmAccount.id]: mockNonEvmAccount,
        },
        selectedAccount: mockAccount.id,
      },
      balances: {
        [mockNonEvmAccount.id]: {
          'bip122:000000000019d6689c085ae165831e93/slip44:0': {
            amount: '1.00000000',
            unit: 'BTC',
          },
        },
      },
      rates: {
        btc: {
          conversionDate: 0,
          conversionRate: '100000',
        },
      },
    },
    activeTab: {
      id: 113,
      title: 'E2E Test Dapp',
      origin: 'https://metamask.github.io',
      protocol: 'https:',
      url: 'https://metamask.github.io/test-dapp/',
    },
  };

  const store = configureStore(merge(defaultState, state));
  const allProps = { ...DEFAULT_PROPS, ...props };
  return renderWithProvider(<AccountListItem {...allProps} />, store);
};

describe('AccountListItem', () => {
  it('renders AccountListItem component and shows account name, address, and balance', () => {
    const { container } = render();
    expect(screen.getByText(mockAccount.metadata.name)).toBeInTheDocument();
    expect(
      screen.getByText(
        shortenAddress(toChecksumHexAddress(mockAccount.address)),
      ),
    ).toBeInTheDocument();
    expect(document.querySelector('[title="0.006 ETH"]')).toBeInTheDocument();

    expect(container).toMatchSnapshot('evm-account-list-item');
  });

  it('renders AccountListItem component and shows account name, address, and balance for non-EVM account', () => {
    const { container } = render({ account: mockNonEvmAccount });
    expect(screen.getByText(mockAccount.metadata.name)).toBeInTheDocument();
    expect(
      screen.getByText(shortenAddress(mockNonEvmAccount.address)),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[title="$100,000.00 USD"]'),
    ).toBeInTheDocument();

    expect(container).toMatchSnapshot('non-EVM-account-list-item');
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
        ...mockAccount,
        metadata: {
          ...mockAccount.metadata,
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

  it('does not render a tag for a null label', () => {
    const { container } = render({
      account: {
        ...mockAccount,
        label: null,
      },
    });
    expect(container.querySelector('.mm-tag')).not.toBeInTheDocument();
  });

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  it('renders the snap label for unnamed snap accounts', () => {
    const { container } = render({
      account: {
        ...mockAccount,
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
      account: {
        ...mockAccount,
        balance: '0x0',
        keyring: 'Snap Keyring',
        label: 'Test Snap Name (Beta)',
      },
    });
    const tag = container.querySelector('.mm-tag');
    expect(tag.textContent).toBe('Test Snap Name (Beta)');
  });
  ///: END:ONLY_INCLUDE_IF

  describe('Multichain Behaviour', () => {
    describe('currency display', () => {
      it('renders tokens for EVM account', () => {
        const { container } = render(
          {
            account: mockAccount,
          },
          {
            metamask: {
              ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
              preferences: {
                showFiatInTestnets: false,
              },
            },
          },
        );

        const firstCurrencyDisplay = container.querySelector(
          '[data-testid="first-currency-display"]',
        );
        const secondCurrencyDisplay = container.querySelector(
          '[data-testid="second-currency-display"]',
        );
        const avatarGroup = container.querySelector(
          '[data-testid="avatar-group"]',
        );

        const expectedBalance = '0.006';

        expect(firstCurrencyDisplay).toBeInTheDocument();
        expect(firstCurrencyDisplay.firstChild.textContent).toContain(
          expectedBalance,
        );
        expect(firstCurrencyDisplay.lastChild.textContent).toContain('ETH');
        expect(secondCurrencyDisplay.textContent).toContain('');
        expect(avatarGroup).not.toBeInTheDocument();
      });

      it('renders fiat for EVM account', () => {
        const { container } = render(
          {
            account: mockAccount,
          },
          {
            metamask: {
              ...mockNetworkState({
                chainId: CHAIN_IDS.SEPOLIA,
                nickname: SEPOLIA_DISPLAY_NAME,
                ticker: 'ETH',
              }),
              preferences: {
                showFiatInTestnets: true,
              },
            },
          },
        );

        const firstCurrencyDisplay = container.querySelector(
          '[data-testid="first-currency-display"]',
        );
        const secondCurrencyDisplay = container.querySelector(
          '[data-testid="second-currency-display"]',
        );
        const avatarGroup = container.querySelector(
          '[data-testid="avatar-group"]',
        );

        const expectedBalance = '$3.31';

        expect(firstCurrencyDisplay).toBeInTheDocument();
        expect(firstCurrencyDisplay.firstChild.textContent).toContain(
          expectedBalance,
        );
        expect(firstCurrencyDisplay.lastChild.textContent).toContain('USD');
        expect(secondCurrencyDisplay.textContent).toContain('');
        expect(avatarGroup).not.toBeInTheDocument();
      });

      it('renders fiat for non-EVM account', () => {
        const { container } = render(
          {
            account: mockNonEvmAccount,
          },
          {
            metamask: {
              preferences: {
                showFiatInTestnets: true,
              },
            },
          },
        );

        const firstCurrencyDisplay = container.querySelector(
          '[data-testid="first-currency-display"]',
        );
        const secondCurrencyDisplay = container.querySelector(
          '[data-testid="second-currency-display"]',
        );
        const avatarGroup = container.querySelector(
          '[data-testid="avatar-group"]',
        );

        const expectedBalance = '$100,000.00';

        expect(firstCurrencyDisplay).toBeInTheDocument();
        expect(firstCurrencyDisplay.firstChild.textContent).toContain(
          expectedBalance,
        );
        expect(firstCurrencyDisplay.lastChild.textContent).toContain('USD');
        expect(secondCurrencyDisplay).not.toBeInTheDocument();
        expect(avatarGroup).toBeInTheDocument();
      });
    });
  });
});
