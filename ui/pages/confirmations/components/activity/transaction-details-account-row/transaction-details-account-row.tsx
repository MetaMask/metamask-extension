import React from 'react';
import { useSelector } from 'react-redux';
import { Text, Box } from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getAccountName, getInternalAccounts } from '../../../../../selectors';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar/preferred-avatar';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsAccountRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();
  const internalAccounts = useSelector(getInternalAccounts);

  const {
    txParams: { from },
  } = transactionMeta;

  const accountName = getAccountName(internalAccounts, from);
  const displayName = accountName || shortenAddress(from);

  return (
    <TransactionDetailsRow
      label={t('account')}
      data-testid="transaction-details-account-row"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        <PreferredAvatar address={from} />
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {displayName}
        </Text>
      </Box>
    </TransactionDetailsRow>
  );
}
