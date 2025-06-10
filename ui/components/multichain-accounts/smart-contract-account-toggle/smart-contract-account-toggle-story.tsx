import React, { useCallback, useState } from 'react';
import { Hex } from '@metamask/utils';
import { Box, Text } from '../../component-library';
import ToggleButton from '../../ui/toggle-button';
import {
  TextColor,
  TextVariant,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { EIP7702NetworkConfiguration } from '../../../pages/confirmations/hooks/useEIP7702Networks';

// Shared story component that works interactively
export const SmartContractAccountToggleStory = ({
  networkConfig,
  address,
  disabled = false,
}: {
  networkConfig: EIP7702NetworkConfiguration;
  address: Hex;
  disabled?: boolean;
}) => {
  const { name, isSupported, upgradeContractAddress, chainIdHex } =
    networkConfig;
  const [addressSupportSmartAccount, setAddressSupportSmartAccount] =
    useState(isSupported);
  const [isProcessing, setIsProcessing] = useState(false);

  const onSwitch = useCallback(async () => {
    if (disabled) {
      return;
    }

    setIsProcessing(true);

    // Simulate async operation delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (addressSupportSmartAccount) {
      console.log(
        `[Story] Downgrading account ${address} on ${name} (${chainIdHex})`,
      );
    } else if (upgradeContractAddress) {
      console.log(
        `[Story] Upgrading account ${address} on ${name} (${chainIdHex}) with contract ${upgradeContractAddress}`,
      );
    }

    // Toggle the state
    setAddressSupportSmartAccount(!addressSupportSmartAccount);
    setIsProcessing(false);
  }, [
    address,
    addressSupportSmartAccount,
    name,
    chainIdHex,
    upgradeContractAddress,
    disabled,
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
        disabled={disabled || isProcessing}
      />
    </Box>
  );
};
