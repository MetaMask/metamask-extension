import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';
import TokenButtons from './token-buttons';
import { mockNetworkState } from '../../../../test/stub/networks';
import { AssetType } from '../../../../shared/constants/transaction';
import { renderWithProvider } from '../../../../test/jest/rendering';
import thunk from 'redux-thunk';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import mockState from '../../../../test/data/mock-state.json';
import * as actions from '../../../store/actions';

const token = {
  type: AssetType.token,
  chainId: '0x89',
  address: '0xF0906D83c5a0bD6b74bC9b62D7D9F2014c6525C0',
  symbol: 'TEST',
  decimals: 18,
  image: '',
  balance: {
    value: '0',
    display: '0',
    fiat: '',
  },
} as const;

describe('TokenButtons Component', () => {
  const mockStore = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not redirect when setCorrectChain throws an error', async () => {
    const store = configureMockStore([thunk])(mockStore);

    const history = createMemoryHistory();
    jest.spyOn(history, 'push');

    jest.spyOn(actions, 'setActiveNetwork').mockImplementation(() => {
      throw new Error('setActiveNetwork mock failure');
    });

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { getByTestId } = renderWithProvider(
      <TokenButtons token={token} />,
      store,
    );

    const sendButton = getByTestId('eth-overview-send');

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(history.push).not.toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to switch chains.`),
    );
    consoleErrorSpy.mockRestore();
  });

  it('does not redirect when setCorrectChain throws an error', async () => {
    const store = configureMockStore([thunk])(mockStore);

    const history = createMemoryHistory();
    jest.spyOn(history, 'push');

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { getByTestId } = renderWithProvider(
      <TokenButtons token={token} />,
      store,
    );

    const sendButton = getByTestId('eth-overview-send');

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(history.push).not.toHaveBeenCalled();
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
