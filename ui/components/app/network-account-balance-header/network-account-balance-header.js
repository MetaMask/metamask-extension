import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import IconWithFallback from '../../ui/icon-with-fallback';
import Identicon from '../../ui/identicon';
import {
  TextVariant,
  FontWeight,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
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
      flexDirection={BoxFlexDirection.Row}
      padding={4}
      className="network-account-balance-header"
      alignItems={BoxAlignItems.center}
      justifyContent={BoxJustifyContent.spaceBetween}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
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
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.FlexStart}
        >
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            color={TextColor.textAlternative}
            data-testid="signature-request-network-display"
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
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.FlexEnd}
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
