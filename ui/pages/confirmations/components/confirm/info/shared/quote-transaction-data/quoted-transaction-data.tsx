import React from 'react';
import { BatchTransactionParams } from '@metamask/transaction-controller';
import { Box } from '@metamask/design-system-react';
import { Hex } from '@metamask/utils';
import { TxData } from '@metamask/bridge-controller';

import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import { ConfirmInfoRowText } from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useDappSwapContext } from '../../../../../context/dapp-swap';
import { useNestedTransactionLabels } from '../../hooks/useNestedTransactionLabels';
import { TransactionData } from '../transaction-data/transaction-data';

export const QuotedSwapTransactionData = () => {
  const { isQuotedSwapDisplayedInInfo, selectedQuote } = useDappSwapContext();

  const { approval, trade } = selectedQuote ?? {};

  const approvalLabel = useNestedTransactionLabels({
    nestedTransactions: [approval as BatchTransactionParams],
    useIndex: 1,
  })[0];

  const tradeLabel = useNestedTransactionLabels({
    nestedTransactions: [trade as BatchTransactionParams],
    useIndex: 0,
  })[0];

  if (!isQuotedSwapDisplayedInInfo) {
    return null;
  }

  return (
    <Box>
      {approval && (
        <ConfirmInfoSection>
          <ConfirmInfoExpandableRow
            label={approvalLabel}
            content={
              <TransactionData
                data={(approval as TxData)?.data as Hex}
                to={(approval as TxData)?.to as Hex}
                noPadding
                nestedTransactionIndex={1}
              />
            }
          >
            <ConfirmInfoRowText text="" />
          </ConfirmInfoExpandableRow>
        </ConfirmInfoSection>
      )}
      <ConfirmInfoSection>
        <ConfirmInfoExpandableRow
          label={tradeLabel}
          content={
            <TransactionData
              data={(trade as TxData)?.data as Hex}
              to={(trade as TxData)?.to as Hex}
              noPadding
              nestedTransactionIndex={2}
            />
          }
        >
          <ConfirmInfoRowText text="" />
        </ConfirmInfoExpandableRow>
      </ConfirmInfoSection>
    </Box>
  );
};
