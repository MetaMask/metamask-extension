import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Display,
  FlexDirection,
  TextVariant,
  FontWeight,
  AlignItems,
  JustifyContent,
  TextAlign,
  TextColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import {
  Text,
  Box,
  AvatarAccount,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
} from '../../component-library';

export default function NetworkAccountBalanceHeader({
  networkName,
  accountName,
  accountBalance,
  tokenName, // Derived from nativeCurrency
  accountAddress,
  chainId,
}) {
  const t = useContext(I18nContext);
  const networkIcon = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId];
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      padding={4}
      className="network-account-balance-header"
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        <BadgeWrapper
          badge={
            <AvatarNetwork
              size={AvatarNetworkSize.Xs}
              src={networkIcon}
              name={networkName}
              borderColor={BackgroundColor.backgroundDefault}
              borderWidth={2}
            />
          }
        >
          <AvatarAccount address={accountAddress} />
        </BadgeWrapper>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.flexStart}
          flexDirection={FlexDirection.Column}
        >
          <Text color={TextColor.textAlternative}>{networkName}</Text>
          <Text color={TextColor.textDefault} fontWeight={FontWeight.Bold}>
            {accountName}
          </Text>
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.flexEnd}
        flexDirection={FlexDirection.Column}
      >
        <Text color={TextColor.textAlternative}>{t('balance')}</Text>
        <Text
          color={TextColor.textDefault}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.End}
        >
          {accountBalance} {tokenName}
        </Text>
      </Box>
    </Box>
  );
}

NetworkAccountBalanceHeader.propTypes = {
  networkName: PropTypes.string,
  accountName: PropTypes.string,
  accountBalance: PropTypes.string,
  tokenName: PropTypes.string,
  accountAddress: PropTypes.string,
  chainId: PropTypes.string,
};
