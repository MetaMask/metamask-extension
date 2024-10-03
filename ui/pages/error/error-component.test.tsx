import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import browser from 'webextension-polyfill';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';

import { getMessage } from '../../helpers/utils/i18n-helper';
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../../app/_locales/en/messages.json';
import { SUPPORT_REQUEST_LINK } from '../../helpers/constants/common';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import ErrorPage from './error.component';

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
  },
}));

describe('ErrorPage', () => {
  const mockTrackEvent = jest.fn();
  const MockError = new Error(
    "Cannot read properties of undefined (reading 'message')",
  ) as Error & { code?: string };
  MockError.code = '500';

  const mockI18nContext = jest
    .fn()
    .mockReturnValue((key: string, variables: string[]) =>
      getMessage('en', messages, key, variables),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    (useI18nContext as jest.Mock).mockImplementation(mockI18nContext);
  });

  it('should render the error message, code, and name if provided', () => {
    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <ErrorPage error={MockError} />
      </MetaMetricsContext.Provider>,
    );

    expect(
      getByTestId('error-page-error-message').textContent,
    ).toMatchInlineSnapshot(
      `"Message: Cannot read properties of undefined (reading 'message')"`,
    );
    expect(
      getByTestId('error-page-error-code').textContent,
    ).toMatchInlineSnapshot(`"Code: 500"`);
    expect(
      getByTestId('error-page-error-name').textContent,
    ).toMatchInlineSnapshot(`"Code: Error"`);
  });

  it('should not render error details if no error information is provided', () => {
    const error = {};

    const { queryByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <ErrorPage error={error} />
      </MetaMetricsContext.Provider>,
    );

    expect(queryByTestId('error-page-error-message')).toBeNull();
    expect(queryByTestId('error-page-error-code')).toBeNull();
    expect(queryByTestId('error-page-error-name')).toBeNull();
    expect(queryByTestId('error-page-error-stack')).toBeNull();
  });

  it('should render sentry user feedback form', () => {
    const { container } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <ErrorPage error={MockError} />
      </MetaMetricsContext.Provider>,
    );
    expect(container.querySelector('#sentry-feedback')).toBeDefined();
  });

  it('should reload the extension when the "Try Again" button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <ErrorPage error={MockError} />
      </MetaMetricsContext.Provider>,
    );
    const tryAgainButton = getByTestId('error-page-try-again-button');
    fireEvent.click(tryAgainButton);
    expect(browser.runtime.reload).toHaveBeenCalled();
  });

  it('should open the support link and track the MetaMetrics event when the "Contact Support" button is clicked', () => {
    window.open = jest.fn();

    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <ErrorPage error={MockError} />
      </MetaMetricsContext.Provider>,
    );

    const contactSupportButton = getByTestId(
      'error-page-contact-support-button',
    );
    fireEvent.click(contactSupportButton);

    expect(window.open).toHaveBeenCalledWith(SUPPORT_REQUEST_LINK, '_blank');

    expect(mockTrackEvent).toHaveBeenCalledWith(
      {
        category: MetaMetricsEventCategory.Error,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_REQUEST_LINK,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
  });
});
