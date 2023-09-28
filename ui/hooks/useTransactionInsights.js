import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { SeverityLevel } from '@metamask/snaps-utils';
import { CHAIN_ID_TO_NETWORK_ID_MAP } from '../../shared/constants/network';
import { stripHexPrefix } from '../../shared/modules/hexstring-utils';
import { TransactionType } from '../../shared/constants/transaction';
import { Tab } from '../components/ui/tabs';
import DropdownTab from '../components/ui/tabs/snaps/dropdown-tab';
import { SnapInsight } from '../components/app/confirm-page-container/snaps/snap-insight';
import { getInsightSnaps } from '../selectors';
import { useTransactionInsightSnaps } from './snaps/useTransactionInsightSnaps';

const isAllowedTransactionTypes = (transactionType) =>
  transactionType === TransactionType.contractInteraction ||
  transactionType === TransactionType.simpleSend ||
  transactionType === TransactionType.tokenMethodSafeTransferFrom ||
  transactionType === TransactionType.tokenMethodTransferFrom ||
  transactionType === TransactionType.tokenMethodTransfer;

// A hook was needed to return JSX here as the way Tabs work JSX has to be included in
// https://github.com/MetaMask/metamask-extension/blob/develop/ui/components/app/confirm-page-container/confirm-page-container-content/confirm-page-container-content.component.js#L129
// Thus it is not possible to use React Component here
const useTransactionInsights = ({ txData, hasFetchedV2Insight = false }) => {
  const { txParams, chainId, origin } = txData;
  const networkId = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
  const caip2ChainId = `eip155:${networkId ?? stripHexPrefix(chainId)}`;
  const insightSnaps = useSelector(getInsightSnaps);

  const [selectedInsightSnapId, setSelectedInsightSnapId] = useState(
    insightSnaps[0]?.id,
  );

  const { data, loading } = useTransactionInsightSnaps({
    transaction: txParams,
    chainId: caip2ChainId,
    origin,
    insightSnaps,
    ///: BEGIN:ONLY_INCLUDE_IN(build-main)
    insightSnapId: selectedInsightSnapId,
    ///: END:ONLY_INCLUDE_IN
    hasFetchedV2Insight,
  });

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

  let insightComponent;

  if (insightSnaps.length === 1) {
    insightComponent = (
      <Tab
        className="confirm-page-container-content__tab"
        name={selectedSnap?.manifest.proposedName}
      >
        <SnapInsight data={data?.[0]} loading={loading} />
      </Tab>
    );
  } else {
    const dropdownOptions = insightSnaps?.map(
      ({ id, manifest: { proposedName } }) => ({
        value: id,
        name: proposedName,
      }),
    );

    const selectedSnapData = data?.find(
      (promise) => promise.snapId === selectedInsightSnapId,
    );

    insightComponent = (
      <DropdownTab
        className="confirm-page-container-content__tab"
        options={dropdownOptions}
        selectedOption={selectedInsightSnapId}
        onChange={(snapId) => setSelectedInsightSnapId(snapId)}
      >
        <SnapInsight loading={loading} data={selectedSnapData} />
      </DropdownTab>
    );
  }

  const warnings = data?.reduce((warningsArr, promise) => {
    if (promise.response?.severity === SeverityLevel.Critical) {
      const {
        snapId,
        response: { content },
      } = promise;
      warningsArr.push({ snapId, content });
    }
    return warningsArr;
  }, []);

  return { insightComponent, warnings };
};

export default useTransactionInsights;
