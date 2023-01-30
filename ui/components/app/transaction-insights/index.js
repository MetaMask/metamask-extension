///: BEGIN:ONLY_INCLUDE_IN(flask)

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { TransactionType } from '../../../../shared/constants/transaction';
import { getInsightSnaps } from '../../../selectors';
import { SnapInsight } from '../confirm-page-container';

const isAllowedTransactionTypes = (transactionType) =>
  transactionType === TransactionType.contractInteraction ||
  transactionType === TransactionType.simpleSend ||
  transactionType === TransactionType.tokenMethodSafeTransferFrom ||
  transactionType === TransactionType.tokenMethodTransferFrom ||
  transactionType === TransactionType.tokenMethodTransfer;

const TransactionInsights = ({ txData }) => {
  const insightSnaps = useSelector(getInsightSnaps);
  const [selectedInsightSnapId, setSelectedInsightSnapId] = useState();

  useEffect(() => {
    if (insightSnaps.length && !selectedInsightSnapId) {
      setSelectedInsightSnapId(insightSnaps[0]?.id);
    }
  }, [insightSnaps, selectedInsightSnapId, setSelectedInsightSnapId]);

  if (!isAllowedTransactionTypes(txData.type) || !insightSnaps.length) {
    return null;
  }

  const selectedSnap = insightSnaps.find(
    ({ id }) => id === selectedInsightSnapId,
  );

  const { txParams, chainId, origin } = txData;
  const networkId = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
  const caip2ChainId = `eip155:${networkId ?? stripHexPrefix(chainId)}`;

  if (insightSnaps.length === 1) {
    return (
      <Tab
        className="confirm-page-container-content__tab"
        name={selectedSnap.manifest.proposedName}
      >
        <SnapInsight
          transaction={txParams}
          origin={origin}
          chainId={caip2ChainId}
          selectedSnap={selectedSnap}
        />
      </Tab>
    );
  }

  const dropdownOptions = insightSnaps?.map(
    ({ id, manifest: { proposedName } }) => ({
      value: id,
      name: proposedName,
    }),
  );

  return (
    <DropdownTab
      className="confirm-page-container-content__tab"
      options={dropdownOptions}
      selectedOption={selectedInsightSnapId}
      onChange={(snapId) => setSelectedInsightSnapId(snapId)}
    >
      <SnapInsight
        transaction={txParams}
        origin={origin}
        chainId={caip2ChainId}
        selectedSnap={selectedSnap}
      />
    </DropdownTab>
  );
};

export default TransactionInsights;

///: END:ONLY_INCLUDE_IN
