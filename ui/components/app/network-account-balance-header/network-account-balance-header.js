import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import IconWithFallback from '../../ui/icon-with-fallback';
import Identicon from '../../ui/identicon';
import {
  DISPLAY,
  FLEX_DIRECTION,
  TypographyVariant,
  FONT_WEIGHT,
  AlignItems,
  JustifyContent,
  TEXT_ALIGN,
  TextColor,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { I18nContext } from '../../../contexts/i18n';
import Typography from '../../ui/typography';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';

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
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.ROW}
      padding={4}
      className="network-account-balance-header"
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={AlignItems.center}
        gap={2}
      >
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
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
          display={DISPLAY.FLEX}
          alignItems={AlignItems.flexStart}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <Typography
            variant={TypographyVariant.H6}
            color={TextColor.textAlternative}
            marginBottom={0}
          >
            {networkName}
          </Typography>

          <Typography
            variant={TypographyVariant.H6}
            color={TextColor.textDefault}
            fontWeight={FONT_WEIGHT.BOLD}
            marginTop={0}
          >
            {accountName}
          </Typography>
        </Box>
      </Box>
      <Box
        display={DISPLAY.FLEX}
        alignItems={AlignItems.flexEnd}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Typography
          variant={TypographyVariant.H6}
          color={TextColor.textAlternative}
          marginBottom={0}
        >
          {t('balance')}
        </Typography>

        <Typography
          variant={TypographyVariant.H6}
          color={TextColor.textDefault}
          fontWeight={FONT_WEIGHT.BOLD}
          marginTop={0}
          align={TEXT_ALIGN.END}
        >
          {accountBalance} {tokenName}
        </Typography>
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
