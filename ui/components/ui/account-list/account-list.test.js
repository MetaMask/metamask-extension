import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import AccountList from './account-list';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const args = {
    accounts: [
      {
        address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        addressLabel: 'Account 1',
        lastConnectedDate: 'Feb-22-2022',
        balance: '87a73149c048545a3fe58',
        has: () => {
          /**  nothing to do */
        },
      },
    ],
    selectedAccounts: {
      address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
      addressLabel: 'Account 2',
      lastConnectedDate: 'Feb-22-2022',
      balance: '87a73149c048545a3fe58',
      has: () => {
        /** nothing to do */
      },
    },
    addressLastConnectedMap: {
      '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4': 'Feb-22-2022',
    },
    allAreSelected: () => true,
    nativeCurrency: 'USD',
    selectNewAccountViaModal: jest.fn(),
    deselectAll: jest.fn(),
    selectAll: jest.fn(),
    handleAccountClick: jest.fn(),
  };
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
});
