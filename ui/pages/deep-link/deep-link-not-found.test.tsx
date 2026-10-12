import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { DeepLink } from './deep-link';

const store = configureMockStore([thunk])({
  metamask: { preferences: {} },
});

describe('DeepLink missing page', () => {
  beforeEach(() => {
    global.platform.getExtensionURL = (route = '/') => `home.html#${route}`;
  });

  it('shows the missing-page screen when the deep link is not found', async () => {
    const { findByRole, findByText } = renderWithProvider(
      <DeepLink />,
      store,
      '/link?errorCode=404',
    );

    expect(
      await findByRole('heading', {
        name: messages.deepLink_Error404Title.message,
      }),
    ).toBeInTheDocument();
    expect(
      await findByText(messages.deepLink_Error404Description.message),
    ).toBeInTheDocument();
  });
});
