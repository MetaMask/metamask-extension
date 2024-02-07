import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ConfirmAddCustodianToken from '.';

describe('Confirm Add Custodian Token', () => {
  global.platform = { openTab: jest.fn() };

  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
    },
    history: {
      push: '/',
      mostRecentOverviewPage: '/',
    },
  };

  const store = configureMockStore()(mockStore);

  it('shows the modal with its text', () => {
    renderWithProvider(
      <ConfirmAddCustodianToken
        onModalClose={() => console.log('Close')}
        custodianName="Qredo"
        custodianURL="https://qredo.com"
      />,
      store,
    );

    const tokenContainer = screen.getByText(
      "To connect your accounts log into your Qredo account and click on the 'connect to MMI' button.",
    );
    expect(tokenContainer).toBeInTheDocument();
  });
});
