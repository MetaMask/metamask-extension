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
});
