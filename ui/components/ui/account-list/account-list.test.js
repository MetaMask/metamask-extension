import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { BtcAccountType, BtcMethod } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MultichainNativeAssets } from '../../../../shared/constants/multichain/assets';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import AccountList from './account-list';

const ONE_ETH_IN_WEI_AS_HEX = '0xde0b6b3a7640000';

const mockHandleAccountClick = jest.fn();
const defaultAddress = '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4';
const defaultAccount = {
  ...createMockInternalAccount({
    address: defaultAddress,
    name: 'Account 1',
  }),
  addressLabel: 'Account 1',
  balance: ONE_ETH_IN_WEI_AS_HEX,
};
const mockNonEvmAccount = {
  ...createMockInternalAccount({
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    name: 'BTC Account',
    type: BtcAccountType.P2wpkh,
    methods: [BtcMethod.SendBitcoin],
  }),
  addressLabel: 'BTC Account',
  balance: '1',
};

const defaultArgs = {
  accounts: [defaultAccount],
  selectedAccounts: new Set([defaultAddress]),
  addressLastConnectedMap: {
    [defaultAddress]: 'Feb-22-2022',
  },
  allAreSelected: () => true,
  nativeCurrency: 'USD',
  selectNewAccountViaModal: jest.fn(),
  deselectAll: jest.fn(),
  selectAll: jest.fn(),
  handleAccountClick: mockHandleAccountClick,
};

const render = (args = defaultArgs) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      internalAccounts: {
        ...mockState.metamask.internalAccounts,
        accounts: {
          ...mockState.metamask.internalAccounts.accounts,
          ...defaultArgs.accounts.reduce((acc, account) => {
            acc[account.id] = account;
            return acc;
          }, {}),
        },
      },
      accounts: {
        [defaultAccount.address]: {
          balance: ONE_ETH_IN_WEI_AS_HEX,
          address: [defaultAccount.address],
        },
      },
      balances: {
        [mockNonEvmAccount.id]: {
          [MultichainNativeAssets.BITCOIN]: {
            amount: '1',
            unit: 'BTC',
          },
        },
      },
    },
  });

  return renderWithProvider(<AccountList {...args} />, store);
};

describe('AccountList', () => {
  it('renders AccountList component and shows New account text', () => {
    render();
    expect(screen.getByText('New account')).toBeInTheDocument();
  });

  it('renders AccountList component and shows Account 1 text', () => {
    render();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
  });

  it('renders AccountList component and shows ETH text', () => {
    render();
    expect(screen.getByText('ETH')).toBeInTheDocument();
  });

  it('disables the handleAccountClick action for non-EVM accounts', () => {
    const { container } = render({
      ...defaultArgs,
      accounts: [
        {
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Btc account',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [BtcMethod.SendBitcoin],
          type: BtcAccountType.P2wpkh,
          address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        },
      ],
    });
    const accountButton = container.querySelector(
      '[data-testid="choose-account-list-0"]',
    );

    fireEvent.click(accountButton);
    expect(mockHandleAccountClick).not.toHaveBeenCalled();
  });

  it('enables the handleAccountClick action for EVM accounts', () => {
    const { container } = render();
    const accountButton = container.querySelector(
      '[data-testid="choose-account-list-0"]',
    );

    fireEvent.click(accountButton);
    expect(mockHandleAccountClick).toHaveBeenCalled();
  });

  it('displays the correct account balance and ticker', () => {
    const args = {
      ...defaultArgs,
      accounts: [defaultAccount, mockNonEvmAccount],
    };
    process.env.DEBUG_PRINT_LIMIT = 10000000000;
    const { getByText, getByTestId, getByTitle } = render(args);
    expect(getByTestId('choose-account-list-0')).toBeInTheDocument();
    expect(getByTestId('choose-account-list-1')).toBeInTheDocument();
    expect(getByText(defaultAccount.addressLabel)).toBeInTheDocument();
    expect(getByText(mockNonEvmAccount.addressLabel)).toBeInTheDocument();
    expect(getByTitle('1 ETH')).toBeInTheDocument();
    expect(getByTitle('1 BTC')).toBeInTheDocument();
  });
});
