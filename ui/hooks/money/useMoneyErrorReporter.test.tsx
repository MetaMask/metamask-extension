/**
 * @jest-environment jsdom
 */
import React, { type ReactElement } from 'react';
import { renderHook } from '@testing-library/react';
import { toast } from '../../components/ui/toast/toast';
import { reportMoneyError } from '../../helpers/money/report-money-error';
import {
  MONEY_ERROR_TOAST_DURATION_MS,
  useMoneyErrorReporter,
} from './useMoneyErrorReporter';

jest.mock('../../helpers/money/report-money-error', () => ({
  reportMoneyError: jest.fn(),
}));

jest.mock('../../components/ui/toast/toast', () => {
  const actual = jest.requireActual('../../components/ui/toast/toast');
  return {
    ...actual,
    toast: {
      error: jest.fn(),
    },
  };
});

jest.mock('../useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const reportMoneyErrorMock = jest.mocked(reportMoneyError);
const toastErrorMock = jest.mocked(toast.error);

type ToastContentProps = {
  title: string;
  description?: string;
  dataTestId?: string;
};

const getToastContentProps = (toastMock: jest.Mock): ToastContentProps => {
  const [content] = toastMock.mock.calls[0] as [
    ReactElement<ToastContentProps>,
  ];
  return content.props;
};

describe('useMoneyErrorReporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the failure to Sentry and shows an error toast', () => {
    const error = new Error('setup failed');
    const { result } = renderHook(() => useMoneyErrorReporter());

    result.current({
      error,
      message: '[Money Account] Deposit setup failed',
      title: 'moneyToastDepositFailedTitleAddMusd',
      description: 'moneyToastDepositFailedBody',
      extra: { flow: 'deposit', intent: 'addMusd' },
    });

    expect(reportMoneyErrorMock).toHaveBeenCalledWith(
      '[Money Account] Deposit setup failed',
      error,
      { flow: 'deposit', intent: 'addMusd' },
    );
    expect(toastErrorMock).toHaveBeenCalledWith(expect.any(Object), {
      duration: MONEY_ERROR_TOAST_DURATION_MS,
    });
    expect(getToastContentProps(toastErrorMock as jest.Mock)).toStrictEqual({
      title: 'moneyToastDepositFailedTitleAddMusd',
      description: 'moneyToastDepositFailedBody',
      dataTestId: 'money-error-toast',
    });
  });
});
