import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { TransactionType } from '../../shared/constants/transaction';
import { getInsightSnaps } from '../selectors';
import { Tab } from '../components/ui/tabs';
import DropdownTab from '../components/ui/tabs/snaps/dropdown-tab';
import { SnapInsight } from '../components/app/confirm-page-container/snaps/snap-insight';

const isAllowedTransactionTypes = (transactionType) =>
  transactionType === TransactionType.contractInteraction ||
  transactionType === TransactionType.simpleSend ||
  transactionType === TransactionType.tokenMethodSafeTransferFrom ||
  transactionType === TransactionType.tokenMethodTransferFrom ||
  transactionType === TransactionType.tokenMethodTransfer;

// A hook was needed to return JSX here as the way Tabs work JSX has to be included in
// https://github.com/MetaMask/metamask-extension/blob/develop/ui/components/app/confirm-page-container/confirm-page-container-content/confirm-page-container-content.component.js#L129
// Thus it is not possible to use React Component here
const useTransactionInsights = ({ txData }) => {
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
  const caip2ChainId = `eip155:${parseInt(chainId, 16).toString()}`;

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
