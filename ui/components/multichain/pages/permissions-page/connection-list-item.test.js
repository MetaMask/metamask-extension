/* eslint-disable jest/no-if */
import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { getURLHost } from '../../../../helpers/utils/util';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { getAccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import { ConnectionListItem } from './connection-list-item';

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector) => mockUseSelector(selector),
}));

describe('ConnectionListItem', () => {
  const store = configureStore(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to state 1 (disabled) with empty account groups array
    mockUseSelector.mockReturnValue([]);
  });

  it('renders correctly for Snap connection', () => {
    // Mock SnapIcon selector
    mockUseSelector.mockImplementation((selector) => {
      if (
        typeof selector === 'function' &&
        selector.toString().includes('getSnapMetadata')
      ) {
        return { name: 'Test Snap 1' };
      }
      return [];
    });

    const mockConnection = {
      id: 'npm:@metamask/testSnap1',
      origin: 'npm:@metamask/testSnap1',
      packageName: 'Test Snap 1',
      subjectType: 'snap',
      iconUrl: null,
      addresses: [], // Add empty addresses array for Snap
    };
    const { getByText, getByTestId } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={jest.fn()} />,
      store,
    );

    expect(getByTestId('connection-list-item')).toBeInTheDocument();
    expect(getByText('Test Snap 1')).toBeInTheDocument();
    expect(
      document.querySelector('.connection-list-item__snap-avatar'),
    ).toBeInTheDocument();
  });

  it('renders correctly for non-Snap connection in state 1', () => {
    // Mock state 1 behavior - isState2Enabled should be false
    mockUseSelector.mockImplementation((selector) => {
      if (
        typeof selector === 'function' &&
        selector.toString().includes('getAllPermittedChainsForSelectedTab')
      ) {
        return ['eip155:1', 'eip155:137'];
      }
      if (selector.name === 'getIsMultichainAccountsState2Enabled') {
        return false;
      }
      return [];
    });

    const mockConnection = {
      id: 'https://metamask.github.io',
      origin: 'https://metamask.github.io',
      subjectType: 'website',
      iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkIconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkName: 'Test Dapp Network',
      addresses: [
        '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B',
        '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      ],
    };

    const { getByText, getByTestId } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={jest.fn()} />,
      store,
    );

    expect(getByTestId('connection-list-item')).toBeInTheDocument();
    expect(
      getByText(getURLHost('https://metamask.github.io')),
    ).toBeInTheDocument();
    expect(
      getByTestId('connection-list-item__avatar-favicon'),
    ).toBeInTheDocument();
    // In state 1, shows individual address count
    expect(getByText(/2.*accounts.*2.*networks/u)).toBeInTheDocument();
  });

  it('renders correctly for non-Snap connection in state 2', () => {
    // Mock state 2 behavior
    mockUseSelector.mockImplementation((selector) => {
      if (
        typeof selector === 'function' &&
        selector.toString().includes('getAllPermittedChainsForSelectedTab')
      ) {
        return ['eip155:1', 'eip155:137'];
      }
      if (selector.name === 'getIsMultichainAccountsState2Enabled') {
        return true;
      }
      if (selector === getAccountGroupWithInternalAccounts) {
        return [
          {
            id: 'entropy:test/0',
            type: 'multichain-account',
            accounts: [
              { address: '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B' },
              { address: '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1' },
            ],
            metadata: { name: 'Default' },
          },
        ];
      }
      return [];
    });

    const mockConnection = {
      id: 'https://metamask.github.io',
      origin: 'https://metamask.github.io',
      subjectType: 'website',
      iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkIconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkName: 'Test Dapp Network',
      addresses: [
        '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B',
        '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      ],
    };

    const { getByText, getByTestId } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={jest.fn()} />,
      store,
    );

    expect(getByTestId('connection-list-item')).toBeInTheDocument();
    expect(
      getByText(getURLHost('https://metamask.github.io')),
    ).toBeInTheDocument();
    expect(
      getByTestId('connection-list-item__avatar-favicon'),
    ).toBeInTheDocument();
    // In state 2, shows account group count instead of individual address count
    expect(getByText(/2.*accounts.*2.*networks/u)).toBeInTheDocument();
  });

  it('handles state 2 with multiple account groups', () => {
    // Mock state 2 with multiple groups
    mockUseSelector.mockImplementation((selector) => {
      if (
        typeof selector === 'function' &&
        selector.toString().includes('getAllPermittedChainsForSelectedTab')
      ) {
        return ['eip155:1', 'eip155:137'];
      }
      if (selector.name === 'getIsMultichainAccountsState2Enabled') {
        return true;
      }
      if (selector === getAccountGroupWithInternalAccounts) {
        return [
          {
            id: 'entropy:test/0',
            type: 'multichain-account',
            accounts: [
              { address: '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B' },
            ],
            metadata: { name: 'Default' },
          },
          {
            id: 'entropy:test/1',
            type: 'multichain-account',
            accounts: [
              { address: '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1' },
            ],
            metadata: { name: 'Account 2' },
          },
        ];
      }
      return [];
    });

    const mockConnection = {
      id: 'https://metamask.github.io',
      origin: 'https://metamask.github.io',
      subjectType: 'website',
      iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkIconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkName: 'Test Dapp Network',
      addresses: [
        '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B',
        '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      ],
    };

    const { getByText } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={jest.fn()} />,
      store,
    );

    // Should show 2 account groups
    expect(getByText(/2.*accounts.*2.*networks/u)).toBeInTheDocument();
  });

  it('handles state 2 with addresses not matching any account groups', () => {
    // Mock state 2 with no matching groups
    mockUseSelector.mockImplementation((selector) => {
      if (
        typeof selector === 'function' &&
        selector.toString().includes('getAllPermittedChainsForSelectedTab')
      ) {
        return ['eip155:1', 'eip155:137'];
      }
      if (selector.name === 'getIsMultichainAccountsState2Enabled') {
        return true;
      }
      if (selector === getAccountGroupWithInternalAccounts) {
        return [
          {
            id: 'entropy:test/0',
            type: 'multichain-account',
            accounts: [{ address: '0xDifferentAddress123' }],
            metadata: { name: 'Default' },
          },
        ];
      }
      return [];
    });

    const mockConnection = {
      id: 'https://metamask.github.io',
      origin: 'https://metamask.github.io',
      subjectType: 'website',
      iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkIconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      networkName: 'Test Dapp Network',
      addresses: [
        '0xaaaF07C80ce267F3132cE7e6048B66E6E669365B',
        '0xbbbD671F1Fcc94bCF0ebC6Ec4790Da35E8d5e1E1',
      ],
    };

    const { getByText } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={jest.fn()} />,
      store,
    );

    // Should show 0 account groups since none match
    expect(getByText(/0.*accounts.*2.*networks/u)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    // Mock SnapIcon selector
    mockUseSelector.mockImplementation((selector) => {
      if (
        typeof selector === 'function' &&
        selector.toString().includes('getSnapMetadata')
      ) {
        return { name: 'Test Snap 1' };
      }
      return [];
    });

    const onClickMock = jest.fn();
    const mockConnection = {
      id: 'npm:@metamask/testSnap1',
      origin: 'npm:@metamask/testSnap1',
      packageName: 'Test Snap 1',
      subjectType: 'snap',
      iconUrl: null,
      addresses: [], // Add empty addresses array for Snap
    };
    const { getByTestId } = renderWithProvider(
      <ConnectionListItem connection={mockConnection} onClick={onClickMock} />,
      store,
    );

    fireEvent.click(getByTestId('connection-list-item'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
