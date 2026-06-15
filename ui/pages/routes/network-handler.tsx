import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import {
  getNetworkToAutomaticallySwitchTo,
  getNumberOfAllUnapprovedTransactionsAndMessages,
} from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import { automaticallySwitchNetwork } from '../../store/actions';
import { useAppSelector } from '../../store/store';

export const NetworkHandler = () => {
  const dispatch = useDispatch();
  const networkToAutomaticallySwitchTo = useAppSelector(
    getNetworkToAutomaticallySwitchTo,
  );
  const totalUnapprovedConfirmationCount = useAppSelector(
    getNumberOfAllUnapprovedTransactionsAndMessages,
  );
  const isUnlocked = useAppSelector(getIsUnlocked);

  const prevPropsRef = useRef({
    isUnlocked,
    totalUnapprovedConfirmationCount,
  });

  useEffect(() => {
    const prevProps = prevPropsRef.current;

    if (
      networkToAutomaticallySwitchTo &&
      totalUnapprovedConfirmationCount === 0 &&
      (prevProps.totalUnapprovedConfirmationCount > 0 ||
        (prevProps.isUnlocked === false && isUnlocked))
    ) {
      dispatch(automaticallySwitchNetwork(networkToAutomaticallySwitchTo));
    }

    prevPropsRef.current = {
      isUnlocked,
      totalUnapprovedConfirmationCount,
    };
  }, [
    dispatch,
    isUnlocked,
    networkToAutomaticallySwitchTo,
    totalUnapprovedConfirmationCount,
  ]);

  return null;
};
