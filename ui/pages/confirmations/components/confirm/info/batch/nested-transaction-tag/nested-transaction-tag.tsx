import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../../context/confirm';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useNestedTransactionLabel } from '../../hooks/useNestedTransactionLabel';
import {
  Box,
  IconName,
  Tag,
} from '../../../../../../../components/component-library';
import {
  BackgroundColor,
  Display,
  TextAlign,
  TextColor,
} from '../../../../../../../helpers/constants/design-system';
import Tooltip from '../../../../../../../components/ui/tooltip';

export function NestedTransactionTag() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions, txParams } = currentConfirmation ?? {};
  const { to, from } = txParams ?? {};

  const isBatch =
    Boolean(nestedTransactions?.length) &&
    to?.toLowerCase() === from.toLowerCase();

  if (!isBatch) {
    return null;
  }

  const functionNames =
    nestedTransactions?.map((transaction, index) => {
      const { functionName } = useNestedTransactionLabel({
        nestedTransaction: transaction,
      });
      return (
        functionName ??
        `${t('confirmNestedTransactionTitle', [String(index + 1)])}`
      );
    }) ?? [];

  const label = t('transactionIncludesTypes', [functionNames.join(', ')]);

  return (
    <Box paddingBottom={4} textAlign={TextAlign.Center} >
      <Tooltip title={label} position="bottom">
        <Tag
          label={t('includesXTransactions', [nestedTransactions?.length])}
          startIconName={IconName.Info}
          paddingLeft={2}
          paddingRight={2}
          display={Display.InlineFlex}
          backgroundColor={BackgroundColor.backgroundMuted}
          color={TextColor.textAlternativeSoft}
          labelProps={{ color: TextColor.textAlternativeSoft }}
        />
      </Tooltip>
    </Box>
  );
}
