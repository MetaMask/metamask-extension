import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import AccountList from './account-list';
import { LATTICE_HD_PATHS, LEDGER_HD_PATHS, TREZOR_HD_PATHS } from '.';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const props = {
    selectedPath: TREZOR_HD_PATHS[0].value,
    device: 'trezor',
    accounts: [
      {
        address: '0x5E2003....98f417b',
        balance: '0.005794 ETH',
        index: 0,
      },
      {
        address: '0x27d17...a5B52E',
        balance: '0.000000 ETH',
        index: 1,
      },
      {
        address: '0x7D412C....3041D0f64a',
        balance: '0.000000 ETH',
        index: 2,
      },
      {
        address: '0xEb6b4...3e83270C72A',
        balance: '0.000000 ETH',
        index: 3,
      },
      {
        address: '0x1BbbdC00...CCFF917',
        balance: '0.000000 ETH',
        index: 4,
      },
    ],
    connectedAccounts: [
      '0x7f132...78a8d6',
      '0x27d17...a5B52E',
      '0x5E2003....98f417b',
    ].map((a) => a.toLowerCase()),
    selectedAccounts: [],
    chainId: '0x1',
    rpcPrefs: {},
    hdPaths: {
      ledger: LEDGER_HD_PATHS,
      lattice: LATTICE_HD_PATHS,
      trezor: TREZOR_HD_PATHS,
      onekey: TREZOR_HD_PATHS,
    },
    onPathChange: jest.fn(),
    onAccountChange: jest.fn(),
    onForgetDevice: jest.fn(),
    getPage: jest.fn(),
    onUnlockAccounts: jest.fn(),
    onCancel: jest.fn(),
    onAccountRestriction: jest.fn(),
  };
  return renderWithProvider(<AccountList {...props} />, store);
};

describe('AccountList', () => {
  it('renders AccountList component and shows Select HD path text', () => {
    render();
    expect(screen.getByText('Select HD path')).toBeInTheDocument();
  });

  it('renders AccountList component and has two accounts selected', () => {
    render();
    expect(
      screen.getAllByTitle(
        'This account has already been connected to MetaMask',
      ),
    ).toHaveLength(2);
  });

  it('renders AccountList component and find expected titles on explorer links', () => {
    render();
    expect(screen.getAllByTitle('View account on etherscan.io')).toHaveLength(
      5,
    );
  });

  it('disables the Prev button as the first account has an index of 0', () => {
    render();

    expect(
      screen.getByTestId('hw-list-pagination__prev-button'),
    ).toBeDisabled();
  });
});
