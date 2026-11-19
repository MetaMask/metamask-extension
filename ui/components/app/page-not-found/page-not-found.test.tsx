import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { PageNotFound } from './page-not-found';

const store = configureMockStore([thunk])({
  metamask: { preferences: {} },
});

describe('PageNotFound', () => {
  beforeEach(() => {
    global.platform.getExtensionURL = (route = '/') => `home.html#${route}`;
  });

  it('shows the missing-page message and a link home', () => {
    const { getByRole, getByText } = renderWithProvider(
      <PageNotFound />,
      store,
      '/missing',
    );

    expect(
      getByRole('heading', {
        name: messages.deepLink_Error404Title.message,
      }),
    ).toBeInTheDocument();
    expect(
      getByText(messages.deepLink_Error404Description.message),
    ).toBeInTheDocument();
    expect(
      getByRole('link', {
        name: messages.deepLink_GoToTheHomePageButton.message,
      }),
    ).toHaveAttribute('href', 'home.html#/');
  });

  it('shows extra description copy when provided', () => {
    const { getByText } = renderWithProvider(
      <PageNotFound extraDescription="Update MetaMask to open this link." />,
      store,
      '/missing',
    );

    expect(getByText('Update MetaMask to open this link.')).toBeInTheDocument();
  });
});
