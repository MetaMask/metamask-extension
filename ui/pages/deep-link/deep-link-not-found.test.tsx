import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { DeepLink } from './deep-link';

const store = configureMockStore([thunk])({
  metamask: { preferences: {} },
});

const renderPage = () => {
  return renderWithProvider(<DeepLink pageNotFound />, store, '/missing');
};

describe('DeepLink missing page', () => {
  beforeEach(() => {
    global.platform.getExtensionURL = (route = '/') => `home.html#${route}`;
  });

  it('shows the missing-page message and a link home', () => {
    const { getByRole, getByText } = renderPage();

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

  it('renders the deep-link interstitial when no link is present', async () => {
    const { findByText } = renderWithProvider(<DeepLink />, store, '/link');

    expect(
      await findByText(messages.deepLink_ErrorMissingUrl.message),
    ).toBeInTheDocument();
  });
});
