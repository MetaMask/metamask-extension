import React from 'react';
import {
  BatchTransactionParams,
  TransactionMeta,
} from '@metamask/transaction-controller';
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

/**
 * Inner component that renders the nested transaction tag.
 * Must be keyed by confirmationId when rendered to force remount when
 * confirmation changes, ensuring consistent hook calls in useNestedTransactionLabels.
 *
 * @param options0
 * @param options0.nestedTransactions
 */
const NestedTransactionTagContent = ({
  nestedTransactions,
}: {
  nestedTransactions: BatchTransactionParams[];
}) => {
  const t = useI18nContext();
  const functionNames = useNestedTransactionLabels({ nestedTransactions });

  const tooltip = t('transactionIncludesTypes', [functionNames.join(', ')]);

  return (
    <Box paddingBottom={4} textAlign={TextAlign.Center}>
      <Tooltip title={tooltip} position="bottom">
        <Tag
          label={t('includesXTransactions', [nestedTransactions.length])}
          startIconName={IconName.Info}
          paddingLeft={2}
          paddingRight={2}
          display={Display.InlineFlex}
          backgroundColor={BackgroundColor.backgroundMuted}
          color={TextColor.textAlternative}
          labelProps={{ color: TextColor.textAlternative }}
        />
      </Tooltip>
    </Box>
  );
};

/**
 * Wrapper component that guards against rendering when nested transactions
 * are not available or invalid. This prevents React hook violations that occur
 * when switching between confirmations with different numbers of nested transactions.
 * See: https://github.com/MetaMask/metamask-extension/issues/29191
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NestedTransactionTag() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions } = currentConfirmation ?? {};

  const isBatch = isBatchTransaction(nestedTransactions);

  if (!isBatch || !nestedTransactions || nestedTransactions.length <= 1) {
    return null;
  }

  return (
    <NestedTransactionTagContent
      key={currentConfirmation?.id}
      nestedTransactions={nestedTransactions}
    />
  );
}
