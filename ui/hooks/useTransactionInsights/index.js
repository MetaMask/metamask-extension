import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { CHAIN_ID_TO_NETWORK_ID_MAP } from '../../../shared/constants/network';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';
import { TransactionType } from '../../../shared/constants/transaction';
import { getInsightSnaps } from '../../selectors';
import { DropdownTab, Tab } from '../../components/ui/tabs';
import { SnapInsight } from '../../components/app/confirm-page-container/flask/snap-insight';

const isAllowedTransactionTypes = (transactionType) =>
  transactionType === TransactionType.contractInteraction ||
  transactionType === TransactionType.simpleSend ||
  transactionType === TransactionType.tokenMethodSafeTransferFrom ||
  transactionType === TransactionType.tokenMethodTransferFrom ||
  transactionType === TransactionType.tokenMethodTransfer;

const useTransactionInsights = ({ txData }) => {
  console.log('into useTransactionInsights');
  const insightSnaps = useSelector(getInsightSnaps);
  const [selectedInsightSnapId, setSelectedInsightSnapId] = useState(
    insightSnaps[0]?.id,
  );

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

export default useTransactionInsights;
