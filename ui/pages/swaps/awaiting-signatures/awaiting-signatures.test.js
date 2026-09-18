import React from 'react';
import configureMockStore from 'redux-mock-store';
import { createSwapsMockStore } from '../../../../test/jest';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import AwaitingSignatures from '.';

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

describe('AwaitingSignatures', () => {
  it('renders the component with initial props for 1 confirmation', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(<AwaitingSignatures />, store);
    expect(
      getByText(messages.swapConfirmWithHwWallet.message),
    ).toBeInTheDocument();
    expect(getByText(messages.cancel.message)).toBeInTheDocument();
  });
});
