import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  FontWeight,
  Text,
  TextAlign,
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
 * Truncation and overflow measurement live on the text node itself. Design-system
 * `Text` renders a block `p` and does not forward refs, so `asChild` merges
 * styles onto an element we can measure.
 *
 * @param options0 - Component props.
 * @param options0.message - The error message to display.
 * @returns Foldable error text.
 */
export function MoneyTransactionDetailsError({
  message,
}: MoneyTransactionDetailsErrorProps) {
  const t = useI18nContext();
  const textRef = useRef<HTMLParagraphElement>(null);
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
    <div className="flex w-full min-w-0 max-w-full flex-col items-end gap-0.5">
      <Text
        asChild
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.ErrorDefault}
        ellipsis={!expanded}
        textAlign={expanded ? TextAlign.Right : undefined}
        className="max-w-full"
      >
        <p ref={textRef} data-testid="money-transaction-details-error">
          {message}
        </p>
      </Text>
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
