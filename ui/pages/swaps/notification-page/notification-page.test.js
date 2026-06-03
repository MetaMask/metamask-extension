import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createSwapsMockStore } from '../../../../test/jest';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { QUOTES_EXPIRED_ERROR } from '../../../../shared/constants/swaps';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import NotificationPage from './notification-page';

const middleware = [thunk];

describe('NotificationPage', () => {
  it('renders the component with the QUOTES_EXPIRED_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <NotificationPage notificationKey={QUOTES_EXPIRED_ERROR} />,
      store,
    );
    expect(
      getByText(messages.swapAreYouStillThere.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapAreYouStillThereDescription.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapShowLatestQuotes.message),
    ).toBeInTheDocument();
    expect(getByText(messages.termsOfService.message)).toBeInTheDocument();
  });

  it('renders the component with an unsupported error key', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, queryByText } = renderWithProvider(
      <NotificationPage notificationKey="unsupportedNotificationKey" />,
      store,
    );
    expect(
      queryByText(messages.swapAreYouStillThere.message),
    ).not.toBeInTheDocument();
    expect(
      queryByText(messages.swapAreYouStillThereDescription.message),
    ).not.toBeInTheDocument();
    expect(
      queryByText(messages.swapShowLatestQuotes.message),
    ).not.toBeInTheDocument();
    expect(getByText(messages.termsOfService.message)).toBeInTheDocument();
  });
});
