import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hex } from '@metamask/utils';

import { getNetworkIcon } from '../../../../../../../shared/modules/network.utils';
import Preloader from '../../../../../../components/ui/icon/preloader';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonLink,
  Text,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  BorderColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { getAvatarNetworkColor } from '../../../../../../helpers/utils/accounts';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { EIP7702NetworkConfiguration } from '../../../../hooks/useEIP7702Networks';
import { useBatchAuthorizationRequests } from '../../../../hooks/useBatchAuthorizationRequests';
import { useEIP7702Account } from '../../../../hooks/useEIP7702Account';

export const AccountNetwork = ({
  address,
  networkConfiguration,
}: {
  address: Hex;
  networkConfiguration: EIP7702NetworkConfiguration;
}) => {
  const t = useI18nContext();
  const { name, isSupported, upgradeContractAddress, chainIdHex } =
    networkConfiguration;
  const { downgradeAccount, upgradeAccount } = useEIP7702Account({
    chainId: chainIdHex,
  });
  const [addressSupportSmartAccount, setAddressSupportSmartAccount] =
    useState(isSupported);
  const networkIcon = getNetworkIcon(networkConfiguration);
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
      alignItems={AlignItems.center}
      marginTop={4}
    >
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexStart}
        alignItems={AlignItems.center}
      >
        <AvatarNetwork
          borderColor={BorderColor.backgroundDefault}
          backgroundColor={getAvatarNetworkColor(name)}
          name={name}
          src={networkIcon}
          size={AvatarNetworkSize.Md}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          marginInlineStart={4}
        >
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodyMdMedium}
          >
            {name}
          </Text>
          <Text color={TextColor.textAlternative} variant={TextVariant.bodyMd}>
            {addressSupportSmartAccount
              ? t('smartAccountLabel')
              : t('standardAccountLabel')}
          </Text>
        </Box>
      </Box>
      {hasPendingRequests ? (
        <Box marginRight={5}>
          <Preloader size={12} />
        </Box>
      ) : (
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        <ButtonLink onClick={onSwitch} data-testid={`switch_account-${name}`}>
          {addressSupportSmartAccount ? t('switchBack') : t('switch')}
        </ButtonLink>
      )}
    </Box>
  );
};
