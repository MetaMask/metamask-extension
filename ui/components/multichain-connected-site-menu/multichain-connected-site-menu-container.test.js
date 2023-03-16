import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/jest';
import { MultichainConnectedSiteMenu } from './multichain-connected-site-menu.component';

describe('Multichain Connected Site Menu', () => {
  const mockStore = {
    metamask: {
      selectedAddress: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
    },
  };
  describe('render', () => {
    it('should match snapshot for not connected state', () => {
      const store = configureMockStore()(mockStore);
      const { getByTestId, container } = renderWithProvider(
        <MultichainConnectedSiteMenu />,
        store,
      );
      expect(getByTestId('connection-menu')).toBeDefined();
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for connected state', () => {
      const connectedState = {
        metamask: {
          ...mockStore.metamask,
          subjectMetadata: {
            'peepeth.com': {
              iconUrl: 'https://peepeth.com/favicon-32x32.png',
              name: 'Peepeth',
            },
          },
          subjects: {
            'peepeth.com': {
              permissions: {
                eth_accounts: {
                  caveats: [
                    {
                      type: 'restrictReturnedAccounts',
                      value: ['0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'],
                    },
                  ],
                  date: 1585676177970,
                  id: '840d72a0-925f-449f-830a-1aa1dd5ce151',
                  invoker: 'peepeth.com',
                  parentCapability: 'eth_accounts',
                },
              },
            },
          },
        },
      };
      const store = configureMockStore()(connectedState);
      const { getByTestId, container } = renderWithProvider(
        <MultichainConnectedSiteMenu />,
        store,
      );
      expect(getByTestId('connection-menu')).toBeDefined();
      expect(container).toMatchSnapshot();
    });
  });
});
