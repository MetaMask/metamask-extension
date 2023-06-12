import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import EthSignModal from './eth-sign-modal';

const mockHideModal = jest.fn();
const mockGetDisabledRpcMethodPreferences = jest.fn();

jest.mock('../../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../../store/actions.ts'),
  hideModal: () => mockHideModal,
  getDisabledRpcMethodPreferences: () => mockGetDisabledRpcMethodPreferences,
}));

describe('Eth Sign Modal', () => {
  const mockState = {
    appState: {
      modal: {
        modalState: {
          props: {},
        },
      },
    },
    metamask: {
      provider: {
        type: 'rpc',
        chainId: '0x5',
      },
      disabledRpcMethodPreferences: { eth_sign: true },
    },
  };

  const mockStore = configureMockStore([thunk])(mockState);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<EthSignModal />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
