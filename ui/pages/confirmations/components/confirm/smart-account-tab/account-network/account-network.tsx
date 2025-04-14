import React, { useCallback } from 'react';
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
  const { downgradeAccount, upgradeAccount } = useEIP7702Account();
  const { name, isSupported, upgradeContractAddress } = networkConfiguration;
  const networkIcon = getNetworkIcon(networkConfiguration);
  const { hasPendingRequests } = useBatchAuthorizationRequests(
    address,
    networkConfiguration.chainIdHex,
  );

  const onSwitch = useCallback(async () => {
    if (isSupported) {
      await downgradeAccount(address);
    } else if (upgradeContractAddress) {
      await upgradeAccount(address, upgradeContractAddress);
    }
  }, [address, downgradeAccount, isSupported, upgradeContractAddress]);

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
            {isSupported
              ? t('confirmAccountTypeSmartContract')
              : t('confirmAccountTypeStandard')}
          </Text>
        </Box>
      </Box>
      {hasPendingRequests ? (
        <Box marginRight={5}>
          <Preloader size={12} />
        </Box>
      ) : (
        <ButtonLink onClick={onSwitch}>{t('switch')}</ButtonLink>
      )}
    </Box>
  );
};
