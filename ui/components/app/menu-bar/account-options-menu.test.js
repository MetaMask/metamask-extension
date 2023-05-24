import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import AccountOptionsMenu from './account-options-menu';

const initState = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    providerConfig: {
      type: 'test',
      chainId: '1',
    },
    identities: {
      '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
        name: 'Custody Account A',
        address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
      },
    },
    selectedAddress: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
    keyrings: [
      {
        type: 'Custody',
        accounts: ['0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275'],
      },
    ],
    custodyStatusMaps: '123',
    custodyAccountDetails: {
      '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
        custodianName: 'saturn',
      },
    },
    custodianSupportedChains: {
      '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
        supportedChains: ['1', '2'],
        custodianName: 'saturn',
      },
    },
    mmiConfiguration: {
      portfolio: {
        enabled: true,
        url: 'https://dashboard.metamask-institutional.io',
      },
      custodians: [
        {
          type: 'saturn',
          name: 'saturn',
          apiUrl: 'https://saturn-custody.dev.metamask-institutional.io',
          iconUrl: 'images/saturn.svg',
          displayName: 'Saturn Custody',
          production: true,
          refreshTokenUrl: null,
          isNoteToTraderSupported: false,
          version: 1,
        },
      ],
    },
  },
};
const mockStore = configureStore();

const props = {
  onClose: jest.fn(),
  anchorElement: document.body,
};

const mockedGetCustodianToken = jest.fn().mockReturnValue({ type: 'TYPE' });
const mockedGetAllCustodianAccountsWithToken = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    getCustodianToken: mockedGetCustodianToken,
    getAllCustodianAccountsWithToken: mockedGetAllCustodianAccountsWithToken,
  }),
}));

describe('AccountOptionsMenu', () => {
  it('shows the remove account and remove jwt menu options', async () => {
    const store = mockStore(initState);
    renderWithProvider(<AccountOptionsMenu {...props} />, store);

    await waitFor(() => {
      expect(
        screen.queryByTestId('account-options-menu__connected-sites'),
      ).toBeInTheDocument();

      const removeAccount = screen.queryByTestId(
        'account-options-menu__remove-account',
      );
      fireEvent.click(removeAccount);
      expect(props.onClose).toHaveBeenCalled();

      const removeJwt = screen.queryByTestId(
        'account-options-menu__remove-jwt',
      );
      fireEvent.click(removeJwt);
      expect(mockedGetCustodianToken).toHaveBeenCalled();
    });
  });
});
