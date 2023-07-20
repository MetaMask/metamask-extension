import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import IconWithFallback from '../../ui/icon-with-fallback';
import Identicon from '../../ui/identicon';
import {
  Display,
  FlexDirection,
  TextVariant,
  FontWeight,
  AlignItems,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { I18nContext } from '../../../contexts/i18n';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { Text } from '../../component-library';

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
  const networkIconWrapperClass = networkIcon
    ? 'network-account-balance-header__network-account__ident-icon-ethereum'
    : 'network-account-balance-header__network-account__ident-icon-ethereum--gray';

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
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
        >
          <Identicon address={accountAddress} diameter={32} />
          <IconWithFallback
            name={networkName}
            size={16}
            icon={networkIcon}
            wrapperClassName={networkIconWrapperClass}
          />
        </Box>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.flexStart}
          flexDirection={FlexDirection.Column}
        >
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            color={TextColor.textAlternative}
          >
            {networkName}
          </Text>

          <Text
            variant={TextVariant.bodySm}
            as="h6"
            color={TextColor.textDefault}
            fontWeight={FontWeight.Bold}
          >
            {accountName}
          </Text>
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.flexEnd}
        flexDirection={FlexDirection.Column}
      >
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          color={TextColor.textAlternative}
        >
          {t('balance')}
        </Text>

        <Text
          variant={TextVariant.bodySm}
          as="h6"
          color={TextColor.textDefault}
          fontWeight={FontWeight.Bold}
          align={TextAlign.End}
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
