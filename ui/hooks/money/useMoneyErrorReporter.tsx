import React, { useCallback } from 'react';
import { SECOND } from '../../../shared/constants/time';
import { toast, ToastContent } from '../../components/ui/toast/toast';
import {
  reportMoneyError,
  type MoneyErrorExtra,
} from '../../helpers/money/report-money-error';
import { useI18nContext } from '../useI18nContext';

export const MONEY_ERROR_TOAST_DURATION_MS = 5 * SECOND;

export type MoneyErrorReport = {
  error: unknown;
  message: string;
  title: string;
  description: string;
  extra?: MoneyErrorExtra;
};

/**
 * Reports a Money Account failure to Sentry and shows a two-line error toast.
 *
 * Matches mobile's `useMoneyToasts` split: Sentry (or `Logger.error` on
 * mobile) plus a user-visible toast in one call, so initiation hooks do not
 * leave that pairing to each click handler.
 *
 * @returns A stable reporter.
 */
export function useMoneyErrorReporter() {
  const t = useI18nContext();

  return useCallback(
    ({ error, message, title, description, extra }: MoneyErrorReport) => {
      reportMoneyError(message, error, extra);
      toast.error(
        <ToastContent
          title={t(title)}
          description={t(description)}
          dataTestId="money-error-toast"
        />,
        { duration: MONEY_ERROR_TOAST_DURATION_MS },
      );
    },
    [t],
  );
}
