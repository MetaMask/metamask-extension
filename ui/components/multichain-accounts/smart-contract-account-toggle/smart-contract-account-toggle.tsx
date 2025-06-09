import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Hex } from '@metamask/utils';

export const SmartContractAccountToggle = ({
  networkConfig,
  address,
}: {
  networkConfig: EIP7702NetworkConfiguration;
  address: Hex;
}) => {
  const { name, isSupported, upgradeContractAddress, chainIdHex } =
    networkConfig;
  const { downgradeAccount, upgradeAccount } = useEIP7702Account({
    chainId: chainIdHex,
  });
  const [addressSupportSmartAccount, setAddressSupportSmartAccount] =
    useState(isSupported);

  const prevHasPendingRequests = useRef<boolean>();
  const { hasPendingRequests } = useBatchAuthorizationRequests(
    address,
    chainIdHex,
  );

  useEffect(() => {
    if (prevHasPendingRequests.current) {
      if (prevHasPendingRequests.current !== hasPendingRequests) {
        setAddressSupportSmartAccount(!addressSupportSmartAccount);
      }
    }
    prevHasPendingRequests.current = hasPendingRequests;
  }, [addressSupportSmartAccount, hasPendingRequests, prevHasPendingRequests]);

  const onSwitch = useCallback(async () => {
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
        disabled={hasPendingRequests}
      />
    </Box>
  );
};
