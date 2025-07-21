import React from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useNestedTransactionLabels } from '../../confirm/info/hooks/useNestedTransactionLabels';
import {
  BackgroundColor,
  Display,
  TextAlign,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  IconName,
  Tag,
} from '../../../../../components/component-library';
import Tooltip from '../../../../../components/ui/tooltip';
import { isBatchTransaction } from '../../../../../../shared/lib/transactions.utils';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NestedTransactionTag() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions } = currentConfirmation ?? {};

  const isBatch = isBatchTransaction(nestedTransactions);
  const functionNames = useNestedTransactionLabels({ nestedTransactions });

  if (!isBatch || nestedTransactions?.length === 1) {
    return null;
  }
  const tooltip = t('transactionIncludesTypes', [functionNames.join(', ')]);

  return (
    <Box paddingBottom={4} textAlign={TextAlign.Center}>
      <Tooltip title={tooltip} position="bottom">
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
