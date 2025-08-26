import React from 'react';
import { useSelector } from 'react-redux';
import '@testing-library/jest-dom';
import browser from 'webextension-polyfill';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { getParticipateInMetaMetrics } from '../../selectors';
import { getMessage } from '../../helpers/utils/i18n-helper';
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../../app/_locales/en/messages.json';
import ErrorPage from './error-page.component';

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
  },
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

describe('ErrorPage', () => {
  const useSelectorMock = useSelector as jest.Mock;
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
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return true;
      }
      return undefined;
    });
    (useI18nContext as jest.Mock).mockImplementation(mockI18nContext);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render the error message, code, and name if provided', () => {
    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
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
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
        <ErrorPage error={error} />
      </MetaMetricsContext.Provider>,
    );

    expect(queryByTestId('error-page-error-message')).toBeNull();
    expect(queryByTestId('error-page-error-code')).toBeNull();
    expect(queryByTestId('error-page-error-name')).toBeNull();
    expect(queryByTestId('error-page-error-stack')).toBeNull();
  });

  it('should render sentry user feedback form and submit sentry report successfully when metrics is opted in', () => {
    const { getByTestId, queryByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
        <ErrorPage error={MockError} />
      </MetaMetricsContext.Provider>,
    );
    const describeButton = getByTestId(
      'error-page-describe-what-happened-button',
    );
    fireEvent.click(describeButton);
    expect(
      queryByTestId('error-page-sentry-feedback-modal'),
    ).toBeInTheDocument();
    const textarea = getByTestId('error-page-sentry-feedback-textarea');
    fireEvent.change(textarea, {
      target: { value: 'Something went wrong on develop option page' },
    });
    const submitButton = getByTestId(
      'error-page-sentry-feedback-submit-button',
    );
    fireEvent.click(submitButton);
    expect(
      queryByTestId('error-page-sentry-feedback-modal'),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId('error-page-sentry-feedback-success-modal'),
    ).toBeInTheDocument();
    jest.advanceTimersByTime(5000);
    expect(
      queryByTestId('error-page-sentry-feedback-modal'),
    ).not.toBeInTheDocument();
  });

  it('should render not sentry user feedback option when metrics is not opted in', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getParticipateInMetaMetrics) {
        return false;
      }
      return undefined;
    });
    const { queryByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
        <ErrorPage error={MockError} />
      </MetaMetricsContext.Provider>,
    );
    const describeButton = queryByTestId(
      'error-page-describe-what-happened-button',
    );

    expect(describeButton).toBeNull();
  });

  it('should reload the extension when the "Try Again" button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
        <ErrorPage error={MockError} />
      </MetaMetricsContext.Provider>,
    );
    const tryAgainButton = getByTestId('error-page-try-again-button');
    fireEvent.click(tryAgainButton);
    expect(browser.runtime.reload).toHaveBeenCalled();
  });

  it('should open the support consent modal when the "Contact Support" button is clicked', () => {
    window.open = jest.fn();

    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
        <ErrorPage error={MockError} />
      </MetaMetricsContext.Provider>,
    );

    const contactSupportButton = getByTestId(
      'error-page-contact-support-button',
    );
    fireEvent.click(contactSupportButton);
    expect(getByTestId('visit-support-data-consent-modal')).toBeInTheDocument();
  });
});
