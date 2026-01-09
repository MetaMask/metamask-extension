import React from 'react';
import { BatchTransactionParams } from '@metamask/transaction-controller';
import { Box } from '@metamask/design-system-react';
import { Hex } from '@metamask/utils';
import { QuoteResponse, TxData } from '@metamask/bridge-controller';

import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import { ConfirmInfoRowText } from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useDappSwapContext } from '../../../../../context/dapp-swap';
import { useNestedTransactionLabels } from '../../hooks/useNestedTransactionLabels';
import { TransactionData } from '../transaction-data/transaction-data';

/**
 * Inner component that renders the swap transaction data.
 * This component only mounts when selectedQuote is valid, ensuring
 * consistent hook calls throughout its lifecycle.
 *
 * @param options0
 * @param options0.selectedQuote
 */
const QuotedSwapTransactionDataContent = ({
  selectedQuote,
}: {
  selectedQuote: QuoteResponse;
}) => {
  const { approval, trade } = selectedQuote;

  const approvalLabel = useNestedTransactionLabels({
    nestedTransactions: approval ? [approval as BatchTransactionParams] : [],
    useIndex: 1,
  })[0];

  const tradeLabel = useNestedTransactionLabels({
    nestedTransactions: trade ? [trade as BatchTransactionParams] : [],
    useIndex: 0,
  })[0];

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

/**
 * Wrapper component that guards against rendering when quote data is not available.
 * This prevents React hook violations that occur when switching between confirmations
 * from different dApps, which causes selectedQuote to become undefined.
 * See: https://github.com/MetaMask/metamask-extension/issues/29191
 */
export const QuotedSwapTransactionData = () => {
  const { isQuotedSwapDisplayedInInfo, selectedQuote } = useDappSwapContext();

  if (!isQuotedSwapDisplayedInInfo || !selectedQuote) {
    return null;
  }

  return <QuotedSwapTransactionDataContent selectedQuote={selectedQuote} />;
};
