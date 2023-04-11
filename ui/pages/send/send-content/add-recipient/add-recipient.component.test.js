import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import AddRecipient from '.';

describe('Add Recipient Component', () => {
  describe('render', () => {
    const mockStore = configureMockStore()(mockState);
    it('should match snapshot', () => {
      const { container } = renderWithProvider(<AddRecipient />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Send State', () => {
    const mockStore = configureMockStore()(mockSendState);

    it('should match snapshot', () => {
      const { container } = renderWithProvider(<AddRecipient />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Domain Resolution', () => {
    const mockDomainResolutionState = {
      ...mockState,
      DNS: {
        resolution: 'DNS Resolution',
      },
    };
    const mockStore = configureMockStore()(mockDomainResolutionState);

    it('should match snapshot', () => {
      const { container } = renderWithProvider(<AddRecipient />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Own Account Recipient Search', () => {
    const ownAccountSeachState = {
      ...mockState,
      send: {
        ...mockState.send,
        recipientInput: 'Test',
        recipientMode: 'MY_ACCOUNTS',
      },
    };
    const mockStore = configureMockStore()(ownAccountSeachState);

    it('should match snapshot', () => {
      const { container } = renderWithProvider(<AddRecipient />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Recent recipient order', () => {
    const recentRecipientState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        addressBook: {
          '0x5': {
            '0x0000000000000000000000000000000000000001': {
              address: '0x0000000000000000000000000000000000000001',
              chainId: '0x5',
              isEns: false,
              memo: '',
              name: '',
            },
            '0x0000000000000000000000000000000000000002': {
              address: '0x0000000000000000000000000000000000000002',
              chainId: '0x5',
              isEns: false,
              memo: '',
              name: '',
            },
            '0x0000000000000000000000000000000000000003': {
              address: '0x0000000000000000000000000000000000000003',
              chainId: '0x5',
              isEns: false,
              memo: '',
              name: '',
            },
          },
        },
        currentNetworkTxList: [
          {
            time: 1674425700001,
            txParams: {
              to: '0x0000000000000000000000000000000000000001',
            },
          },
          {
            time: 1674425700002,
            txParams: {
              to: '0x0000000000000000000000000000000000000002',
            },
          },
          {
            time: 1674425700003,
            txParams: {
              to: '0x0000000000000000000000000000000000000003',
            },
          },
        ],
      },
    };
    const mockStore = configureMockStore()(recentRecipientState);

    it('should render latest used recipient first', () => {
      const { getAllByTestId } = renderWithProvider(
        <AddRecipient />,
        mockStore,
      );

      const recipientList = getAllByTestId('recipient');

      expect(recipientList[0]).toHaveTextContent('0x0000...0003');
      expect(recipientList[1]).toHaveTextContent('0x0000...0002');
    });
  });
});
