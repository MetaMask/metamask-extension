import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { useHistory } from 'react-router-dom';
import thunk from 'redux-thunk';
import { mockNetworkState } from '../../../../test/stub/networks';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockState from '../../../../test/data/mock-state.json';
import * as actions from '../../../store/actions';
import {
  PREPARE_SWAP_ROUTE,
  SEND_ROUTE,
} from '../../../helpers/constants/routes';
import CoinButtons from './coin-buttons';
import { InternalEthEoaAccount } from '@metamask/keyring-api/dist/internal/types';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('../../../ducks/send', () => ({
  ...jest.requireActual('../../../ducks/send'),
  startNewDraftTransaction: jest.fn(() => ({
    type: 'MOCK_START_NEW_DRAFT_TRANSACTION',
  })),
}));

const selectedAccountMock: InternalEthEoaAccount = {
  id: 'b39bc837-4c0f-4692-9e24-f2aef2eaefad',
  address: '0x0521797e19b8e274e4ed3bfe5254faf6fac96f09',
  options: {},
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  type: 'eip155:eoa',
  metadata: {
    name: 'Account 2',
    importTime: 1732668178048,
    lastSelected: 1732670357591,
    keyring: {
      type: 'Simple Key Pair',
    },
  },
};

describe('CoinButtons Component', () => {
  let mockPush: jest.Mock;
  const mockStore = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      useExternalServices: true,
    },
  };

  beforeEach(() => {
    mockPush = jest.fn();
    (useHistory as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not redirect to swap when there is a mismatched chainId between account and network', async () => {
    const store = configureMockStore([thunk])(mockStore);

    jest.spyOn(actions, 'setActiveNetwork').mockImplementation(() => {
      throw new Error('setActiveNetwork mock failure');
    });

    const consoleErrorSpy = jest.spyOn(console, 'error');

    const { getByTestId } = renderWithProvider(
      <CoinButtons
        account={selectedAccountMock}
        chainId={CHAIN_IDS.POLYGON}
        trackingLocation="Home"
        isSwapsChain={true}
        isSigningEnabled={true}
        isBridgeChain={true}
        isBuyableChain={true}
      />,
      store,
    );

    const swapButton = getByTestId('token-overview-button-swap');

    fireEvent.click(swapButton);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to switch chains.`),
    );
    consoleErrorSpy.mockRestore();
  });

  it('does redirect to swap when there is a matched chainId between account and network', async () => {
    const store = configureMockStore([thunk])(mockStore);

    const consoleErrorSpy = jest.spyOn(console, 'error');

    const { getByTestId } = renderWithProvider(
      <CoinButtons
        account={selectedAccountMock}
        chainId={CHAIN_IDS.MAINNET}
        trackingLocation="Home"
        isSwapsChain={true}
        isSigningEnabled={true}
        isBridgeChain={true}
        isBuyableChain={true}
      />,
      store,
    );

    const swapButton = getByTestId('token-overview-button-swap');

    fireEvent.click(swapButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(PREPARE_SWAP_ROUTE);
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('does not redirect to send when there is a mismatched chainId between account and network', async () => {
    const store = configureMockStore([thunk])(mockStore);

    jest.spyOn(actions, 'setActiveNetwork').mockImplementation(() => {
      throw new Error('setActiveNetwork mock failure');
    });

    const consoleErrorSpy = jest.spyOn(console, 'error');

    const { getByTestId } = renderWithProvider(
      <CoinButtons
        account={selectedAccountMock}
        chainId={CHAIN_IDS.POLYGON}
        trackingLocation="Home"
        isSwapsChain={true}
        isSigningEnabled={true}
        isBridgeChain={true}
        isBuyableChain={true}
      />,
      store,
    );

    const sendButton = getByTestId('coin-overview-send');

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to switch chains.`),
    );
    consoleErrorSpy.mockRestore();
  });

  it('does redirect to send when there is a matched chainId between account and network', async () => {
    const store = configureMockStore([thunk])(mockStore);

    const consoleErrorSpy = jest.spyOn(console, 'error');

    const { getByTestId } = renderWithProvider(
      <CoinButtons
        account={selectedAccountMock}
        chainId={CHAIN_IDS.MAINNET}
        trackingLocation="Home"
        isSwapsChain={true}
        isSigningEnabled={true}
        isBridgeChain={true}
        isBuyableChain={true}
      />,
      store,
    );

    const sendButton = getByTestId('coin-overview-send');

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(SEND_ROUTE);
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
