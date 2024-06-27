import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import {
  BtcAccountType,
  BtcMethod,
  EthAccountType,
} from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import AccountList from './account-list';

const mockHandleAccountClick = jest.fn();
const defaultAddress = '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4';

const defaultArgs = {
  accounts: [
    {
      address: defaultAddress,
      addressLabel: 'Account 1',
      label: 'Account 1',
      balance: '87a73149c048545a3fe58',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'Account 1',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      methods: ETH_EOA_METHODS,
      type: EthAccountType.Eoa,
      has: () => {
        /**  nothing to do */
      },
    },
  ],
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
          methods: [BtcMethod.SendMany],
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
});
