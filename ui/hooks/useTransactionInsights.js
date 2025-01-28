import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';
import { Tab } from '../components/ui/tabs';
import DropdownTab from '../components/ui/tabs/snaps/dropdown-tab';
import { SnapInsight } from '../components/app/snaps/snap-insight/snap-insight';
import {
  getInsightSnapIds,
  getInsightSnaps,
  getSnapsMetadata,
} from '../selectors';
import { deleteInterface } from '../store/actions';
import { getSnapName } from '../helpers/utils/util';
import { useInsightSnaps } from './snaps/useInsightSnaps';

const isAllowedTransactionTypes = (transactionType) =>
  transactionType === TransactionType.contractInteraction ||
  transactionType === TransactionType.simpleSend ||
  transactionType === TransactionType.tokenMethodSafeTransferFrom ||
  transactionType === TransactionType.tokenMethodTransferFrom ||
  transactionType === TransactionType.tokenMethodTransfer;

// A hook was needed to return JSX here as the way Tabs work JSX has to be included in
// https://github.com/MetaMask/metamask-extension/blob/main/ui/components/app/confirm-page-container/confirm-page-container-content/confirm-page-container-content.component.js#L129
// Thus it is not possible to use React Component here
const useTransactionInsights = ({ txData }) => {
  const dispatch = useDispatch();
  const insightSnaps = useSelector(getInsightSnaps);
  const insightSnapIds = useSelector(getInsightSnapIds);
  const snapsMetadata = useSelector(getSnapsMetadata);

  const snapsNameGetter = getSnapName(snapsMetadata);

  const [selectedInsightSnapId, setSelectedInsightSnapId] = useState(
    insightSnaps[0]?.id,
  );

  const { data, warnings } = useInsightSnaps(txData.id);

  useEffect(() => {
    if (insightSnapIds.length > 0 && !selectedInsightSnapId) {
      setSelectedInsightSnapId(insightSnapIds[0]);
    }
  }, [insightSnapIds, selectedInsightSnapId, setSelectedInsightSnapId]);

  useEffect(() => {
    return () => {
      data?.map(
        ({ response }) =>
          response?.id && dispatch(deleteInterface(response.id)),
      );
    };
  }, [data]);

  if (!isAllowedTransactionTypes(txData.type) || !insightSnaps.length) {
    return null;
  }

  const selectedSnap = insightSnaps.find(
    ({ id }) => id === selectedInsightSnapId,
  );

  // TODO(hbmalik88): refactor this into another component once we've redone
  // the logic inside of tabs.component.js is re-done to account for nested tabs
  let insightComponent;

  if (insightSnaps.length === 1) {
    insightComponent = (
      <Tab
        className="confirm-page-container-content__tab"
        name={snapsNameGetter(selectedSnap.id)}
      >
        <SnapInsight snapId={selectedInsightSnapId} data={data?.[0]} />
      </Tab>
    );
  } else if (insightSnaps.length > 1) {
    const dropdownOptions = insightSnaps?.map(({ id }) => {
      const name = snapsNameGetter(id);
      return {
        value: id,
        name,
      };
    });

    const selectedSnapData = data?.find(
      (result) => result?.snapId === selectedInsightSnapId,
    );

    insightComponent = (
      <DropdownTab
        className="confirm-page-container-content__tab"
        options={dropdownOptions}
        selectedOption={selectedInsightSnapId}
        onChange={(snapId) => setSelectedInsightSnapId(snapId)}
      >
        <SnapInsight snapId={selectedInsightSnapId} data={selectedSnapData} />
      </DropdownTab>
    );
  }

  return { insightComponent, warnings };
};

export default useTransactionInsights;
