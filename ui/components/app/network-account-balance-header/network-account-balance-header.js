import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Identicon from '../../ui/identicon/identicon.component';
import {
  DISPLAY,
  FLEX_DIRECTION,
  TYPOGRAPHY,
  COLORS,
  FONT_WEIGHT,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { I18nContext } from '../../../contexts/i18n';
import Typography from '../../ui/typography';

export default function NetworkAccountBalanceHeader({
  networkName,
  accountName,
  accountBalance,
  tokenName,
  accountAddress,
}) {
  const t = useContext(I18nContext);

  return (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.ROW}
      padding={4}
      className="network-account-balance-header"
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={ALIGN_ITEMS.CENTER}
        gap={2}
      >
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
          alignItems={ALIGN_ITEMS.CENTER}
        >
          <Identicon address={accountAddress} diameter={32} />
          <Identicon
            address={accountAddress}
            diameter={16}
            imageBorder
            image="./images/eth_badge.svg"
            className="network-account-balance-header__network-account__ident-icon-ethereum"
          />
        </Box>
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.FLEX_START}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <Typography
            variant={TYPOGRAPHY.H6}
            color={COLORS.TEXT_ALTERNATIVE}
            marginBottom={0}
          >
            {networkName}
          </Typography>

          <Typography
            variant={TYPOGRAPHY.H6}
            color={COLORS.TEXT_DEFAULT}
            fontWeight={FONT_WEIGHT.BOLD}
            marginTop={0}
          >
            {accountName}
          </Typography>
        </Box>
      </Box>
      <Box
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.FLEX_END}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Typography
          variant={TYPOGRAPHY.H6}
          color={COLORS.TEXT_ALTERNATIVE}
          marginBottom={0}
        >
          {t('balance')}
        </Typography>

        <Typography
          variant={TYPOGRAPHY.H6}
          color={COLORS.TEXT_DEFAULT}
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
  accountBalance: PropTypes.number,
  tokenName: PropTypes.string,
  accountAddress: PropTypes.string,
};
