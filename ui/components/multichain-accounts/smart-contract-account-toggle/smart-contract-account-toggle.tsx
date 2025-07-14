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
  address: Hex;
  pendingToggleState: boolean | null;
  setPendingToggleState: (value: boolean | null) => void;
  returnToPage?: string; // Optional page to return to after transaction
};

export const SmartContractAccountToggle = ({
  networkConfig,
  address,
  pendingToggleState,
  setPendingToggleState,
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

  // Use pendingToggleState as primary source of truth, fallback to actual account state
  const toggleValue = pendingToggleState ?? addressSupportSmartAccount;

  // Check initial account state and verify transaction results
  useEffect(() => {
    const checkUpgradeStatus = async () => {
      try {
        const upgraded = await isUpgraded(address);
        setAddressSupportSmartAccount(upgraded);
        // Only clear pendingToggleState when we have confirmed the actual state matches the intent
        // AND there are no pending requests (transaction is confirmed)
        if (
          pendingToggleState !== null &&
          pendingToggleState === upgraded &&
          !hasPendingRequests
        ) {
          setPendingToggleState(null);
        }
      } catch (error) {
        // Fall back to isSupported if we can't determine upgrade status
        setAddressSupportSmartAccount(isSupported);
      }
    };

    // Only check actual account state if pendingToggleState is null (no pending user action)
    // OR when pending requests complete (to verify transaction result)
    if (pendingToggleState === null) {
      // Check initial state (when component mounts)
      if (prevHasPendingRequests.current === undefined) {
        checkUpgradeStatus();
      }
      // Verify transaction result when pending requests complete
      else if (prevHasPendingRequests.current && !hasPendingRequests) {
        checkUpgradeStatus();
      }
    } else if (prevHasPendingRequests.current && !hasPendingRequests) {
      // If we have pendingToggleState and pending requests just completed, verify the result
      checkUpgradeStatus();
    }

    prevHasPendingRequests.current = hasPendingRequests;
  }, [
    isUpgraded,
    address,
    isSupported,
    hasPendingRequests,
    pendingToggleState,
    setPendingToggleState,
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
      setPendingToggleState(null);
      return true;
    }
    return false;
  }, [
    unconfirmedTransactions,
    address,
    chainIdHex,
    history,
    setPendingToggleState,
    returnToPage,
    dispatch,
  ]);

  // Monitor for transactions when pendingToggleState is set
  useEffect(() => {
    if (pendingToggleState !== null) {
      const found = findAndRedirectToTransaction();

      // If no transaction is found, set a timeout to reset pendingToggleState
      // This prevents the toggle from being permanently disabled
      if (!found) {
        const timeoutId = setTimeout(() => {
          setPendingToggleState(null);
        }, 5000); // 5 second timeout

        return () => clearTimeout(timeoutId);
      }
    }
    return undefined;
  }, [pendingToggleState, findAndRedirectToTransaction, setPendingToggleState]);

  const onSwitch = useCallback(async () => {
    // Immediately update the pending toggle state to show user's action
    setPendingToggleState(!toggleValue);

    try {
      // Dispatch the transaction
      if (toggleValue) {
        await downgradeAccount(address);
      } else if (upgradeContractAddress) {
        await upgradeAccount(address, upgradeContractAddress);
      }
    } catch (error) {
      // Reset pendingToggleState on error
      setPendingToggleState(null);
    }
  }, [
    address,
    downgradeAccount,
    toggleValue,
    upgradeAccount,
    upgradeContractAddress,
    setPendingToggleState,
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
          pendingToggleState !== null ||
          (!toggleValue && !upgradeContractAddress)
        }
      />
    </Box>
  );
};
