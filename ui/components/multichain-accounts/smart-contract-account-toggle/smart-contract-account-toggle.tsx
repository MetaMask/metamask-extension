import React, { useCallback, useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useEIP7702Account } from '../../../pages/confirmations/hooks/useEIP7702Account';
import { useBatchAuthorizationRequests } from '../../../pages/confirmations/hooks/useBatchAuthorizationRequests';

import ToggleButton from '../../ui/toggle-button';
import { Box, Text } from '../../component-library';
import {
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { EIP7702NetworkConfiguration } from '../../../pages/confirmations/hooks/useEIP7702Networks';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import { unconfirmedTransactionsListSelector } from '../../../selectors';
import { setRedirectAfterDefaultPage } from '../../../ducks/history/history';
import {
  setToggleState,
  selectToggleState,
} from '../../../ducks/smart-accounts/smart-accounts';
import type { MetaMaskReduxState } from '../../../store/store';

type SmartContractAccountToggleProps = {
  networkConfig: EIP7702NetworkConfiguration;
  address: Hex;
  returnToPage?: string;
};

export const SmartContractAccountToggle = ({
  networkConfig,
  address,
  returnToPage,
}: SmartContractAccountToggleProps) => {
  const { name, isSupported, upgradeContractAddress, chainIdHex } =
    networkConfig;
  const history = useHistory();
  const dispatch = useDispatch();
  const unconfirmedTransactions = useSelector(
    unconfirmedTransactionsListSelector,
  );

  // Get toggleState from Redux
  const toggleState = useSelector((state: MetaMaskReduxState) =>
    selectToggleState(state, address, chainIdHex),
  );

  const { downgradeAccount, upgradeAccount, isUpgraded } = useEIP7702Account({
    chainId: chainIdHex,
    onRedirect: () => null,
  });

  const [addressSupportSmartAccount, setAddressSupportSmartAccount] =
    useState(isSupported);

  const { hasPendingRequests } = useBatchAuthorizationRequests(
    address,
    chainIdHex,
  );

  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Use toggleState as primary source, fallback to actual account state
  const toggleValue = toggleState ?? addressSupportSmartAccount;

  // Keep toggle disabled when user has pending intent OR when there are pending requests
  const isToggleDisabled = hasPendingRequests || hasUserInteracted;

  // Check account state on mount and when no pending requests
  useEffect(() => {
    if (!hasPendingRequests) {
      const checkUpgradeStatus = async () => {
        try {
          const upgraded = await isUpgraded(address);

          // Only check for mismatch if:
          // 1. User has intent (toggleState !== null)
          // 2. Intent doesn't match reality (toggleState !== upgraded)
          // 3. No pending requests (transaction completed)
          // 4. User isn't in the middle of clicking (not hasUserInteracted)
          if (
            toggleState !== null &&
            toggleState !== upgraded &&
            !hasPendingRequests &&
            !hasUserInteracted
          ) {
            dispatch(
              setToggleState({
                address,
                chainId: chainIdHex,
                value: null,
              }),
            );
          }

          setAddressSupportSmartAccount(upgraded);
        } catch (error) {
          setAddressSupportSmartAccount(isSupported);
        }
      };
      checkUpgradeStatus();
    }
  }, [
    hasPendingRequests,
    toggleState,
    isUpgraded,
    address,
    isSupported,
    dispatch,
    chainIdHex,
    hasUserInteracted,
  ]);

  const findAndRedirectToTransaction = useCallback(() => {
    const matchingTransactions = unconfirmedTransactions.filter(
      (tx: TransactionMeta) =>
        tx.txParams?.from === address && tx.chainId === chainIdHex,
    );

    if (matchingTransactions.length > 0) {
      const latestTransaction = matchingTransactions.sort(
        (a: TransactionMeta, b: TransactionMeta) => b.time - a.time,
      )[0];

      if (returnToPage) {
        const redirectPath =
          returnToPage === '/account-details'
            ? `${returnToPage}/${address}`
            : returnToPage;
        dispatch(setRedirectAfterDefaultPage({ path: redirectPath, address }));
      }

      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${latestTransaction.id}`);
      return true;
    }
    return false;
  }, [
    unconfirmedTransactions,
    address,
    chainIdHex,
    history,
    returnToPage,
    dispatch,
  ]);

  // Monitor for transactions when toggleState is set
  useEffect(() => {
    if (hasPendingRequests) {
      const found = findAndRedirectToTransaction();

      // If no transaction is found, reset after timeout
      if (!found) {
        const timeoutId = setTimeout(() => {
          dispatch(
            setToggleState({
              address,
              chainId: chainIdHex,
              value: null,
            }),
          );
        }, 5000); // 5 second timeout

        return () => clearTimeout(timeoutId);
      }
    }
    return undefined;
  }, [
    hasPendingRequests,
    findAndRedirectToTransaction,
    dispatch,
    address,
    chainIdHex,
  ]);

  const onSwitch = useCallback(async () => {
    // Immediately update the pending toggle state to show user's action
    dispatch(
      setToggleState({
        address,
        chainId: chainIdHex,
        value: !toggleValue,
      }),
    );

    setHasUserInteracted(true);

    try {
      // Dispatch the transaction
      if (toggleValue) {
        await downgradeAccount(address);
      } else if (upgradeContractAddress) {
        await upgradeAccount(address, upgradeContractAddress);
      }
    } catch (error) {
      // Reset toggleState on error
      dispatch(
        setToggleState({
          address,
          chainId: chainIdHex,
          value: null,
        }),
      );
    }
  }, [
    address,
    chainIdHex,
    downgradeAccount,
    toggleValue,
    upgradeAccount,
    upgradeContractAddress,
    dispatch,
  ]);

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      marginTop={2}
    >
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textAlternative}
      >
        {name}
      </Text>
      <ToggleButton
        value={toggleValue}
        onToggle={onSwitch}
        disabled={isToggleDisabled}
      />
    </Box>
  );
};
