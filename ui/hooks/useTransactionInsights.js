import React, { useEffect, useState } from 'react';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  useDispatch,
  ///: END:ONLY_INCLUDE_IF
  useSelector,
} from 'react-redux';

import { SeverityLevel } from '@metamask/snaps-sdk';
import { TransactionType } from '@metamask/transaction-controller';
import { stripHexPrefix } from '../../shared/modules/hexstring-utils';
import { Tab } from '../components/ui/tabs';
import DropdownTab from '../components/ui/tabs/snaps/dropdown-tab';
import { SnapInsight } from '../components/app/snaps/snap-insight/snap-insight';
import {
  getInsightSnapIds,
  getInsightSnaps,
  getSnapsMetadata,
} from '../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { deleteInterface } from '../store/actions';
///: END:ONLY_INCLUDE_IF
import { getSnapName } from '../helpers/utils/util';
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
const useTransactionInsights = ({ txData }) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const dispatch = useDispatch();
  ///: END:ONLY_INCLUDE_IF
  const { txParams, chainId, origin } = txData;
  const caip2ChainId = `eip155:${stripHexPrefix(chainId)}`;
  const insightSnaps = useSelector(getInsightSnaps);
  const insightSnapIds = useSelector(getInsightSnapIds);
  const snapsMetadata = useSelector(getSnapsMetadata);

  const snapsNameGetter = getSnapName(snapsMetadata);

  const [selectedInsightSnapId, setSelectedInsightSnapId] = useState(
    insightSnaps[0]?.id,
  );

  const insightHookParams = {
    transaction: txParams,
    chainId: caip2ChainId,
    origin,
    insightSnaps: insightSnapIds,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
    insightSnapId: selectedInsightSnapId,
    ///: END:ONLY_INCLUDE_IF
  };

  const { data, loading } = useTransactionInsightSnaps({
    ...insightHookParams,
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
    eagerFetching: false,
    ///: END:ONLY_INCLUDE_IF
  });

  useEffect(() => {
    if (insightSnapIds.length > 0 && !selectedInsightSnapId) {
      setSelectedInsightSnapId(insightSnapIds[0]);
    }
  }, [insightSnapIds, selectedInsightSnapId, setSelectedInsightSnapId]);

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  useEffect(() => {
    return () => {
      data?.map(
        ({ response }) =>
          response?.id && dispatch(deleteInterface(response.id)),
      );
    };
  }, [data]);
  ///: END:ONLY_INCLUDE_IF

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
        <SnapInsight
          snapId={selectedInsightSnapId}
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          data={data?.[0]}
          ///: END:ONLY_INCLUDE_IF
          loading={loading}
          ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
          insightHookParams={insightHookParams}
          ///: END:ONLY_INCLUDE_IF
        />
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

    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    const selectedSnapData = data?.find(
      (promise) => promise?.snapId === selectedInsightSnapId,
    );
    ///: END:ONLY_INCLUDE_IF

    insightComponent = (
      <DropdownTab
        className="confirm-page-container-content__tab"
        options={dropdownOptions}
        selectedOption={selectedInsightSnapId}
        onChange={(snapId) => setSelectedInsightSnapId(snapId)}
      >
        <SnapInsight
          snapId={selectedInsightSnapId}
          loading={loading}
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          data={selectedSnapData}
          ///: END:ONLY_INCLUDE_IF
          ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
          insightHookParams={insightHookParams}
          ///: END:ONLY_INCLUDE_IF
        />
      </DropdownTab>
    );
  }

  const warnings = data?.reduce((warningsArr, promise) => {
    if (promise.response?.severity === SeverityLevel.Critical) {
      const {
        snapId,
        response: { id },
      } = promise;
      warningsArr.push({ snapId, id });
    }
    return warningsArr;
  }, []);

  return { insightComponent, warnings };
};

export default useTransactionInsights;
