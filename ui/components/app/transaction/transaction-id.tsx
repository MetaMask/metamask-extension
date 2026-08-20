import React from 'react';
import classnames from 'clsx';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { shortenAddress } from '../../../helpers/utils/util';

type TransactionIdProps = {
  value?: string;
};

export function TransactionId({ value }: TransactionIdProps) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: null });

  if (!value) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => handleCopy(value)}
      aria-label={t('copyTransactionId')}
      className={classnames(
        'inline-flex items-center gap-1 rounded-full h-6 min-w-0 border-0 px-2 py-1',
        copied ? 'bg-success-muted' : 'bg-muted hover:bg-muted-hover',
      )}
      data-testid="transaction-id"
    >
      <Text
        ellipsis
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Regular}
        color={copied ? TextColor.SuccessDefault : TextColor.TextDefault}
      >
        {copied ? t('transactionIdCopied') : shortenAddress(value)}
      </Text>
      <Icon
        name={copied ? IconName.CopySuccess : IconName.Copy}
        size={IconSize.Xs}
        color={copied ? IconColor.SuccessDefault : IconColor.IconAlternative}
      />
    </button>
  );
}
