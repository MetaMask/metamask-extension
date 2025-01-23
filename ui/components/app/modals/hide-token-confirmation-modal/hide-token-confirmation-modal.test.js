import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import * as actions from '../../../../store/actions';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../../test/stub/networks';
import HideTokenConfirmationModal from '.';

const mockHistoryPush = jest.fn();
const mockHideModal = jest.fn();
const mockHideToken = jest.fn().mockResolvedValue();

jest.mock('../../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../../store/actions.ts'),
  hideModal: () => mockHideModal,
  hideToken: () => mockHideToken,
  ignoreTokens: jest.fn().mockReturnValue(jest.fn().mockResolvedValue()),
}));

describe('Hide Token Confirmation Modal', () => {
  const tokenState = {
    address: '0xTokenAddress',
    symbol: 'TKN',
    image: '',
  };

  const tokenState2 = {
    address: '0xTokenAddress2',
    symbol: 'TKN2',
    image: '',
    chainId: '0x89',
  };

  const tokenModalState = {
    ...mockState,
    appState: {
      ...mockState.appState,
      modal: {
        modalState: {
          props: {
            history: {
              push: mockHistoryPush,
            },
            token: tokenState,
          },
        },
      },
    },
  };

  const mockStore = configureMockStore([thunk])(tokenModalState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <HideTokenConfirmationModal />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should hide modal', () => {
    const { queryByTestId } = renderWithProvider(
      <HideTokenConfirmationModal />,
      mockStore,
    );

    const cancelButton = queryByTestId('hide-token-confirmation__cancel');

    fireEvent.click(cancelButton);

    expect(mockHideModal).toHaveBeenCalled();
  });

  it('should hide token with token address from state', () => {
    const { queryByTestId } = renderWithProvider(
      <HideTokenConfirmationModal />,
      mockStore,
    );

    const hideButton = queryByTestId('hide-token-confirmation__hide');

    fireEvent.click(hideButton);

    expect(mockHideModal).toHaveBeenCalled();
    expect(actions.ignoreTokens).toHaveBeenCalledWith({
      tokensToIgnore: tokenState.address,
      networkClientId: 'goerli',
    });
  });

  it('should hide token from another chain', () => {
    const tokenModalStateWithDifferentChain = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        selectedNetworkClientId: 'bsc',
        ...mockNetworkState({ chainId: '0x89', id: 'bsc' }),
      },
      appState: {
        ...mockState.appState,
        modal: {
          modalState: {
            props: {
              history: {
                push: mockHistoryPush,
              },
              token: tokenState2,
            },
          },
        },
      },
    };

    const mockStoreDifferentChain = configureMockStore([thunk])(
      tokenModalStateWithDifferentChain,
    );

    const { queryByTestId } = renderWithProvider(
      <HideTokenConfirmationModal />,
      mockStoreDifferentChain,
    );

    const hideButton = queryByTestId('hide-token-confirmation__hide');

    fireEvent.click(hideButton);

    expect(mockHideModal).toHaveBeenCalled();
    expect(actions.ignoreTokens).toHaveBeenCalledWith({
      tokensToIgnore: tokenState2.address,
      networkClientId: 'bsc',
    });
  });
});
