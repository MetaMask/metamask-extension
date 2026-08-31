import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  FontWeight,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type MoneyTransactionDetailsErrorProps = {
  message: string;
};

/**
 * Failed-status error copy that folds to one line with Show more / Show less.
 *
 * @param options0 - Component props.
 * @param options0.message - The error message to display.
 * @returns Foldable error text.
 */
export function MoneyTransactionDetailsError({
  message,
}: MoneyTransactionDetailsErrorProps) {
  const t = useI18nContext();
  const textRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) {
      return;
    }
    setIsOverflowing(element.scrollWidth > element.clientWidth);
  }, [message]);

  return (
    <div className="flex max-w-full flex-col items-end gap-0.5">
      <div
        ref={textRef}
        className={expanded ? 'text-right' : 'max-w-full truncate'}
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.ErrorDefault}
          data-testid="money-transaction-details-error"
        >
          {message}
        </Text>
      </div>
      {isOverflowing || expanded ? (
        <TextButton
          size={TextButtonSize.BodySm}
          onClick={() => setExpanded((current) => !current)}
          data-testid="money-transaction-details-error-toggle"
        >
          {expanded ? t('showLess') : t('showMore')}
        </TextButton>
      ) : null}
    </div>
  );
}
