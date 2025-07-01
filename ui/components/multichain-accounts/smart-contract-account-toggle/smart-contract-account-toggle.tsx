import React, { useCallback, useEffect, useRef, useState } from 'react';
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

type SmartContractAccountToggleProps = {
  networkConfig: EIP7702NetworkConfiguration;
  address: string;
  userIntent: boolean | null;
  setUserIntent: (value: boolean | null) => void;
  returnToPage?: string; // Optional page to return to after transaction
};

export const SmartContractAccountToggle = ({
  networkConfig,
  address,
  userIntent,
  setUserIntent,
  returnToPage,
}: SmartContractAccountToggleProps) => {
  const { name, isSupported, upgradeContractAddress, chainIdHex } =
    networkConfig;
  const history = useHistory();
  const dispatch = useDispatch();
  const unconfirmedTransactions = useSelector(
    unconfirmedTransactionsListSelector,
  );
  const { downgradeAccount, upgradeAccount, isUpgraded } = useEIP7702Account({
    chainId: chainIdHex,
    onRedirect: () => null,
  });

  const [addressSupportSmartAccount, setAddressSupportSmartAccount] =
    useState(isSupported);

  const prevHasPendingRequests = useRef<boolean>();
  const { hasPendingRequests } = useBatchAuthorizationRequests(
    address,
    chainIdHex,
  );

  // Use userIntent as primary source of truth, fallback to actual account state
  const toggleValue = userIntent ?? addressSupportSmartAccount;

  // Check initial account state and verify transaction results
  useEffect(() => {
    const checkUpgradeStatus = async () => {
      try {
        const upgraded = await isUpgraded(address);
        setAddressSupportSmartAccount(upgraded);
        // Only clear userIntent when we have confirmed the actual state matches the intent
        // AND there are no pending requests (transaction is confirmed)
        if (
          userIntent !== null &&
          userIntent === upgraded &&
          !hasPendingRequests
        ) {
          setUserIntent(null);
        }
      } catch (error) {
        // Fall back to isSupported if we can't determine upgrade status
        setAddressSupportSmartAccount(isSupported);
      }
    };

    // Only check actual account state if userIntent is null (no pending user action)
    // OR when pending requests complete (to verify transaction result)
    if (userIntent === null) {
      // Check initial state (when component mounts)
      if (prevHasPendingRequests.current === undefined) {
        checkUpgradeStatus();
      }
      // Verify transaction result when pending requests complete
      else if (prevHasPendingRequests.current && !hasPendingRequests) {
        checkUpgradeStatus();
      }
    } else if (prevHasPendingRequests.current && !hasPendingRequests) {
      // If we have userIntent and pending requests just completed, verify the result
      checkUpgradeStatus();
    }

    prevHasPendingRequests.current = hasPendingRequests;
  }, [
    isUpgraded,
    address,
    isSupported,
    hasPendingRequests,
    userIntent,
    setUserIntent,
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
        dispatch(setRedirectAfterDefaultPage({ path: returnToPage, address }));
      }

      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${latestTransaction.id}`);
      setUserIntent(null);
      return true;
    }
    return false;
  }, [
    unconfirmedTransactions,
    address,
    chainIdHex,
    history,
    setUserIntent,
    returnToPage,
    dispatch,
  ]);

  // Monitor for transactions when userIntent is set
  useEffect(() => {
    if (userIntent !== null) {
      // Try to find transaction immediately
      findAndRedirectToTransaction();

      // If not found immediately, check again after a short delay
      // const timeoutId = setTimeout(() => {
      //   if (userIntent !== null) {
      //     findAndRedirectToTransaction();
      //   }
      // }, 500);

      // return () => clearTimeout(timeoutId);
    }
  }, [userIntent, findAndRedirectToTransaction]);

  const onSwitch = useCallback(async () => {
    // Immediately update the user intent to show user's action
    setUserIntent(!toggleValue);

    try {
      // Dispatch the transaction
      if (toggleValue) {
        await downgradeAccount(address as Hex);
      } else if (upgradeContractAddress) {
        await upgradeAccount(address as Hex, upgradeContractAddress);
      }
    } catch (error) {
      // Reset userIntent on error
      setUserIntent(null);
    }
  }, [
    address,
    downgradeAccount,
    toggleValue,
    upgradeAccount,
    upgradeContractAddress,
    setUserIntent,
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
        disabled={
          hasPendingRequests ||
          userIntent !== null ||
          (!toggleValue && !upgradeContractAddress)
        }
      />
    </Box>
  );
};
