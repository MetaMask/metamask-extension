import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/jest';
import { MultichainConnectedSiteMenu } from './multichain-connected-site-menu.component';

describe('Multichain Connected Site Menu', () => {
  const mockStore = {
    metamask: {
      connectedSubjects: [
        {
          extensionId: null,
          origin: 'https://metamask.github.io',
          name: 'MetaMask < = > Ledger Bridge',
          iconUrl: null,
        },
      ],
    },
  };
  const store = configureMockStore()(mockStore);
  describe('render', () => {
    it('should match snapshot', () => {
      const { getByTestId, container } = renderWithProvider(
        <MultichainConnectedSiteMenu />,
        store,
      );
      expect(getByTestId('connection-menu')).toBeDefined();
      expect(container).toMatchSnapshot();
    });
  });
});
