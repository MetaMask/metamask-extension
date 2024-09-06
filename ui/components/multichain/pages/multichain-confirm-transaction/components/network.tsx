import React, { useContext } from 'react';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../component-library';
import { I18nContext } from '../../../../../contexts/i18n';
import { MultichainProviderConfig } from '../../../../../../shared/constants/multichain/networks';

export type MultichainTransactionNetworkProps = {
  network: MultichainProviderConfig;
};
export const MultichainTransactionNetwork = ({
  network,
}: MultichainTransactionNetworkProps) => {
  const t = useContext(I18nContext);

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      padding={4}
    >
      <Text color={TextColor.textDefault}>{t('network')}</Text>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
      >
        <AvatarNetwork
          className="mm-picker-network__avatar-network"
          src={network.rpcPrefs?.imageUrl ?? ''}
          name={network.nickname}
          size={AvatarNetworkSize.Xs}
          marginRight={2}
        />
        <Text color={TextColor.textDefault}>{network.nickname}</Text>
      </Box>
    </Box>
  );
};
