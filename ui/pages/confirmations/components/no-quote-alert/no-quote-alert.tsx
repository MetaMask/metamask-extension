import React, { useCallback, useMemo, useState } from 'react';
import type { QuoteErrorInfo } from '@metamask/transaction-pay-controller';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type NoQuoteAlertProps = {
  readonly error: QuoteErrorInfo;
};

/**
 * Inline message for a MetaMask Pay quote that failed validation.
 *
 * Shows a generic, user-facing reason by default. Double clicking toggles the
 * structured error from the pay controller, so support and QA can read the
 * underlying failure (e.g. a simulation revert) without a debug build.
 *
 * @param props
 * @param props.error - Structured quote error from the pay controller.
 */
export function NoQuoteAlert({ error }: NoQuoteAlertProps) {
  const t = useI18nContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDoubleClick = useCallback(
    () => setIsExpanded((expanded) => !expanded),
    [],
  );

  const collapsedMessage =
    error.reason === 'insufficient-source-balance'
      ? t('alertInsufficientPayMethodBalance')
      : t('alertNoPayTokenQuotesMessage');

  const messages = useMemo(() => {
    if (!isExpanded) {
      return [collapsedMessage];
    }

    return [collapsedMessage, error.message, ...(error.detail ?? [])];
  }, [collapsedMessage, error, isExpanded]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      onDoubleClick={handleDoubleClick}
      data-testid="no-quote-alert"
    >
      {messages.map((message) => (
        <Text
          key={message}
          variant={TextVariant.BodySm}
          color={TextColor.ErrorDefault}
          className="text-center"
        >
          {message}
        </Text>
      ))}
    </Box>
  );
}
