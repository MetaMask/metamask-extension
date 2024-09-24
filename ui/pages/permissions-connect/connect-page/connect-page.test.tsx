import React from 'react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { ConnectPage, ConnectPageRequest } from './connect-page';

const render = (
  props: {
    request: ConnectPageRequest;
    permissionsRequestId: string;
    rejectPermissionsRequest: (id: string) => void;
    approveConnection: (request: ConnectPageRequest) => void;
    activeTabOrigin: string;
  } = {
    request: {
      id: '1',
      origin: 'https://test.dapp',
    },
    permissionsRequestId: '1',
    rejectPermissionsRequest: jest.fn(),
    approveConnection: jest.fn(),
    activeTabOrigin: 'https://test.dapp',
  },
  state = {},
) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
      permissionHistory: {
        'https://test.dapp': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1709225290848,
            },
          },
        },
      },
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
  return renderWithProvider(<ConnectPage {...props} />, store);
};
describe('ConnectPage', () => {
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('should render title correctly', () => {
    const { getByText } = render();
    expect(getByText('Connect with MetaMask')).toBeDefined();
  });

  it('should render account connectionListItem', () => {
    const { getByText } = render();
    expect(
      getByText('See your accounts and suggest transactions'),
    ).toBeDefined();
  });

  it('should render network connectionListItem', () => {
    const { getByText } = render();
    expect(getByText('Use your enabled networks')).toBeDefined();
  });

  it('should render confirm and cancel button', () => {
    const { getByText } = render();
    const confirmButton = getByText('Confirm');
    const cancelButton = getByText('Cancel');
    expect(confirmButton).toBeDefined();
    expect(cancelButton).toBeDefined();
  });
});
