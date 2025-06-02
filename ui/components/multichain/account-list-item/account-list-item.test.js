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
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import { AccountListItem, AccountListItemMenuTypes } from '.';

const mockAccount = {
  ...mockState.metamask.internalAccounts.accounts[
    'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
  ],
  balance: '0x152387ad22c3f0',
};

const mockNonEvmAccount = {
  ...mockState.metamask.internalAccounts.accounts[
    'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
  ],
  balance: '1', // updating this  to 1 because the balance for native non evm networks comes from the multichainBalances controller in decimal format and not hex.
  id: 'b7893c59-e376-4cc0-93ad-05ddaab574a6',
  address: 'bc1qn3stuu6g37rpxk3jfxr4h4zmj68g0lwxx5eker',
  type: 'bip122:p2wpkh',
};

const mockSnap = {
  id: 'local:mock-snap',
  origin: 'local:mock-snap',
  version: '1.3.7',
  iconUrl: null,
  initialPermissions: {},
  manifest: {
    description: 'mock-description',
    proposedName: 'mock-snap-name',
    repository: {
      type: 'git',
      url: 'https://127.0.0.1',
    },
    source: {
      location: {
        npm: {
          filePath: 'dist/bundle.js',
          packageName: 'local:mock-snap',
        },
      },
      shasum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
      locales: ['en'],
    },
    version: '1.3.7',
  },
  versionHistory: [
    {
      date: 1680686075921,
      origin: 'https://metamask.github.io',
      version: '1.3.7',
    },
  ],
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
      conversionRates: {
        'bip122:000000000019d6689c085ae165831e93/slip44:0': {
          rate: '100000',
        },
      },
      snaps: {
        ...mockState.metamask.snaps,
        [mockSnap.id]: mockSnap,
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
    expect(screen.getByTestId('account-network-indicator')).toBeInTheDocument();

    expect(container).toMatchSnapshot('evm-account-list-item');
  });

  it('renders AccountListItem component and shows account name, address, and balance for non-EVM account', () => {
    const { container } = render(
      { account: mockNonEvmAccount },
      {
        metamask: {
          accountsAssets: {
            [mockNonEvmAccount.id]: [MultichainNativeAssets.BITCOIN],
          },
        },
      },
    );
    expect(screen.getByText(mockAccount.metadata.name)).toBeInTheDocument();
    expect(
      screen.getByText(shortenAddress(mockNonEvmAccount.address)),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[title="$100,000.00 USD"]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('account-network-indicator')).toBeInTheDocument();

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
  it('renders the tag with the snap name for named snap accounts', () => {
    const { container } = render(
      {
        account: {
          ...mockAccount,
          metadata: {
            ...mockAccount.metadata,
            snap: {
              id: mockSnap.id,
            },
            keyring: {
              type: 'Snap Keyring',
            },
          },
          balance: '0x0',
        },
      },
      {
        metamask: {
          snaps: {
            [mockSnap.id]: {
              ...mockSnap,
              preinstalled: false,
            },
          },
        },
      },
    );
    const tag = container.querySelector('.mm-tag');
    expect(tag.textContent).toBe(`${mockSnap.manifest.proposedName} (Beta)`);
  });

  it('does not render the tag with the snap name for preinstalled snap accounts', () => {
    const { container } = render(
      {
        account: {
          ...mockAccount,
          metadata: {
            ...mockAccount.metadata,
            snap: {
              id: 'npm:@metamask/solana-wallet-snap',
            },
            keyring: {
              type: 'Snap Keyring',
            },
          },
          balance: '0x0',
        },
      },
      {
        metamask: {
          snaps: {
            [mockSnap.id]: {
              ...mockSnap,
              preinstalled: true,
            },
          },
        },
      },
    );
    const tag = container.querySelector('.mm-tag');
    expect(tag).not.toBeInTheDocument();
  });
  ///: END:ONLY_INCLUDE_IF

  describe('Multichain Behaviour', () => {
    describe('currency display', () => {
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

        const expectedBalance = '$3.31';

        expect(firstCurrencyDisplay).toBeInTheDocument();
        expect(firstCurrencyDisplay.firstChild.textContent).toContain(
          expectedBalance,
        );
        expect(firstCurrencyDisplay.lastChild.textContent).toContain('USD');
      });

      it('renders fiat and native balance for non-EVM account', () => {
        const { container } = render(
          {
            account: mockNonEvmAccount,
          },
          {
            metamask: {
              preferences: {
                showFiatInTestnets: true,
              },
              accountsAssets: {
                [mockNonEvmAccount.id]: [MultichainNativeAssets.BITCOIN],
              },
            },
          },
        );

        const firstCurrencyDisplay = container.querySelector(
          '[data-testid="first-currency-display"]',
        );

        const expectedBalance = '$100,000.00';

        expect(firstCurrencyDisplay).toBeInTheDocument();
        expect(firstCurrencyDisplay.firstChild.textContent).toContain(
          expectedBalance,
        );
        expect(firstCurrencyDisplay.lastChild.textContent).toContain('USD');
      });
    });
  });
});
