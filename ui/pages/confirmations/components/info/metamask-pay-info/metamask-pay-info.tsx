/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionPayIsPostQuote } from '../../../hooks/pay/useTransactionPayData';
import { CustomAmountInfo } from '../custom-amount-info';
import { AccountOverrideRow } from '../../rows/test/account-override-row';
import { PostQuoteRow } from '../../rows/test/post-quote-row';
import { TargetTokenRow } from '../../rows/test/target-token-row';

export function MetaMaskPayInfo() {
  const t = useI18nContext();
  const isPostQuote = useTransactionPayIsPostQuote();

  return (
    <CustomAmountInfo
      autoFocusAmount
      currency="usd"
      hasMax
      payWithLabelOverride={isPostQuote ? t('receive') : undefined}
    >
      <PostQuoteRow />
      <TargetTokenRow />
      <AccountOverrideRow />
    </CustomAmountInfo>
  );
}
