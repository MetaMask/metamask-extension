import React from 'react';
import { useSelector } from 'react-redux';
import {
  Display,
  AlignItems,
  JustifyContent,
  BackgroundColor,
  BlockSize,
  IconColor,
} from '../../../helpers/constants/design-system';
import { getSelectedAccountCachedBalance } from '../../../selectors';
import { getIsCustodianSupportedChain } from '../../../selectors/institutional/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { Icon, IconName, IconSize, Box, Text } from '../../component-library';

const WrongNetworkNotification: React.FC = () => {
  const t = useI18nContext();
  const providerConfig = useSelector<
    object,
    { nickname: string; type: string }
  >(getProviderConfig);
  const balance = useSelector<string | null>(getSelectedAccountCachedBalance);

  const isCustodianSupportedChain = useSelector(getIsCustodianSupportedChain);

  const network = providerConfig.nickname || providerConfig.type;

  return !isCustodianSupportedChain && balance ? (
    <Box
      className="wrong-network-notification"
      data-testid="wrong-network-notification"
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={[1, 6]}
      backgroundColor={BackgroundColor.errorMuted}
      width={BlockSize.Full}
    >
      <Icon
        name={IconName.Danger}
        size={IconSize.Sm}
        color={IconColor.errorDefault}
      />
      <Text marginLeft={2}>
        {t('custodyWrongChain', [
          network ? network.charAt(0).toUpperCase() + network.slice(1) : '',
        ])}
      </Text>
    </Box>
  ) : null;
};

export default WrongNetworkNotification;
