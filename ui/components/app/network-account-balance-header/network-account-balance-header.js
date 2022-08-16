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
      paddingTop={4}
      paddingRight={4}
      paddingBottom={5}
      paddingLeft={4}
    >
      <Box alignItems={ALIGN_ITEMS.CENTER}>
        <Identicon address={accountAddress} diameter={40} />
      </Box>
      <Box>
        <Identicon
          address={accountAddress}
          diameter={22}
          imageBorder
          image="./images/eth_badge.svg"
          className="network-account-balance-header__ident-icon-ethereum"
        />
      </Box>
      <Box
        alignItems={ALIGN_ITEMS.FLEX_START}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Box>
          <Typography variant={TYPOGRAPHY.H7} color={COLORS.TEXT_ALTERNATIVE}>
            {networkName}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant={TYPOGRAPHY.H6}
            color={COLORS.TEXT_DEFAULT}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {accountName}
          </Typography>
        </Box>
      </Box>
      <Box
        alignItems={ALIGN_ITEMS.FLEX_END}
        marginLeft={10}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Box>
          <Typography variant={TYPOGRAPHY.H7} color={COLORS.TEXT_ALTERNATIVE}>
            {t('balance')}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant={TYPOGRAPHY.H6}
            color={COLORS.TEXT_DEFAULT}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {accountBalance} {tokenName}
          </Typography>
        </Box>
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
