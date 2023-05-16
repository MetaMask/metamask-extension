import React from 'react';
import { useSelector } from 'react-redux';
import {
  DISPLAY,
  AlignItems,
  JustifyContent,
  BackgroundColor,
  BLOCK_SIZES,
  IconColor,
} from '../../../helpers/constants/design-system';
import { getSelectedAccountCachedBalance } from '../../../selectors';
import { getIsCustodianSupportedChain } from '../../../selectors/institutional/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { Text, Icon, IconName, IconSize } from '../../component-library';
import Box from '../../ui/box';

const WrongNetworkNotification = () => {
  const t = useI18nContext();
  const providerConfig = useSelector(getProviderConfig);
  const balance = useSelector(getSelectedAccountCachedBalance);

  const isCustodianSupportedChain = useSelector(getIsCustodianSupportedChain);

  const network = providerConfig.nickname || providerConfig.type;

  return !isCustodianSupportedChain && balance ? (
    <Box
      className="wrong-network-notification"
      data-testid="wrong-network-notification"
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={[1, 6]}
      backgroundColor={BackgroundColor.errorMuted}
      width={BLOCK_SIZES.FULL}
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
