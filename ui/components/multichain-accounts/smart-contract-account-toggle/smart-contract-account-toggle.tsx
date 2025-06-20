import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hex } from '@metamask/utils';
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

export const SmartContractAccountToggle = ({
  networkConfig,
  address,
}: {
  networkConfig: EIP7702NetworkConfiguration;
  address: Hex;
}) => {
  const { name, isSupported, upgradeContractAddress, chainIdHex } =
    networkConfig;
  const { downgradeAccount, upgradeAccount, isUpgraded } = useEIP7702Account({
    chainId: chainIdHex,
  });

  const [addressSupportSmartAccount, setAddressSupportSmartAccount] =
    useState(isSupported);

  const prevHasPendingRequests = useRef<boolean>();
  const { hasPendingRequests } = useBatchAuthorizationRequests(
    address,
    chainIdHex,
  );

  // Check initial account state and verify transaction results
  useEffect(() => {
    const checkUpgradeStatus = async () => {
      try {
        const upgraded = await isUpgraded(address);
        setAddressSupportSmartAccount(upgraded);
      } catch (error) {
        // Fall back to isSupported if we can't determine upgrade status
        setAddressSupportSmartAccount(isSupported);
      }
    };

    // Check initial state (when component mounts)
    if (prevHasPendingRequests.current === undefined) {
      checkUpgradeStatus();
    }
    // Verify transaction result when pending requests complete
    else if (prevHasPendingRequests.current && !hasPendingRequests) {
      checkUpgradeStatus();
    }

    prevHasPendingRequests.current = hasPendingRequests;
  }, [isUpgraded, address, isSupported, hasPendingRequests]);

  const onSwitch = useCallback(async () => {
    // Immediately update the toggle state to show user's intent
    setAddressSupportSmartAccount(!addressSupportSmartAccount);

    // Dispatch the transaction
    if (addressSupportSmartAccount) {
      await downgradeAccount(address);
    } else if (upgradeContractAddress) {
      await upgradeAccount(address, upgradeContractAddress);
    }
  }, [
    address,
    downgradeAccount,
    addressSupportSmartAccount,
    upgradeAccount,
    upgradeContractAddress,
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
        value={addressSupportSmartAccount}
        onToggle={onSwitch}
        disabled={
          hasPendingRequests ||
          (!addressSupportSmartAccount && !upgradeContractAddress)
        }
      />
    </Box>
  );
};
