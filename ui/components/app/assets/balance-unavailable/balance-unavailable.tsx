import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonLink, ButtonLinkSize, Text } from '../../../component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { retrySnapBalances } from '../../../../store/actions';

export type BalanceUnavailableProps = {
  /** Accounts whose balance fetch failed; retried when the user clicks Retry. */
  accountIds: string[];
  /** Human-readable names of the affected networks (for the tooltip text). */
  networkNames?: string[];
  /** Small variant for list rows, medium for the overview balance. */
  size?: 'sm' | 'md';
  /** Hide the Retry link (for example when shown next to another Retry). */
  hideRetry?: boolean;
  /** Hide the "Balance unavailable" text and only render the Retry link. */
  hideText?: boolean;
  'data-testid'?: string;
};

/**
 * Shown instead of a balance when the snap could not fetch it (unsynced
 * account, provider error...). Prevents a stale or placeholder `0` from being
 * presented as a confirmed balance, and lets the user retry the fetch.
 *
 * @param props - Component props.
 * @param props.accountIds - Accounts to retry.
 * @param props.networkNames - Affected network names for the title text.
 * @param props.size - Visual size.
 * @param props.hideRetry - Whether to hide the Retry link.
 * @param props.hideText - Whether to hide the text (Retry link only).
 * @param props.'data-testid' - Test id.
 */
export const BalanceUnavailable = ({
  accountIds,
  networkNames,
  size = 'md',
  hideRetry = false,
  hideText = false,
  'data-testid': dataTestId = 'balance-unavailable',
}: BalanceUnavailableProps) => {
  const t = useI18nContext();
  const [isRetrying, setIsRetrying] = useState(false);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const onRetry = useCallback(
    async (event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (isRetrying || accountIds.length === 0) {
        return;
      }
      setIsRetrying(true);
      try {
        await retrySnapBalances(accountIds);
      } catch {
        // The unavailable status stays in state; nothing else to do here.
      } finally {
        if (isMounted.current) {
          setIsRetrying(false);
        }
      }
    },
    [accountIds, isRetrying],
  );

  const title =
    networkNames && networkNames.length > 0
      ? t('balanceUnavailableDescription', [networkNames.join(', ')])
      : undefined;

  return (
    <span
      className="balance-unavailable flex items-center gap-2 flex-wrap"
      data-testid={dataTestId}
      title={title}
    >
      {!hideText && (
        <Text
          as="span"
          variant={
            size === 'sm' ? TextVariant.bodySmMedium : TextVariant.headingMd
          }
          color={TextColor.warningDefault}
          data-testid={`${dataTestId}-text`}
        >
          {t('balanceUnavailable')}
        </Text>
      )}
      {!hideRetry && (
        <ButtonLink
          size={ButtonLinkSize.Sm}
          onClick={onRetry}
          disabled={isRetrying}
          data-testid={`${dataTestId}-retry`}
        >
          {t('balanceUnavailableRetry')}
        </ButtonLink>
      )}
    </span>
  );
};

export default BalanceUnavailable;
