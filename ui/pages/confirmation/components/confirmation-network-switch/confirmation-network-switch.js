import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Box from '../../../../components/ui/box';
import SiteIcon from '../../../../components/ui/site-icon';
import Typography from '../../../../components/ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  DISPLAY,
  JUSTIFY_CONTENT,
  BLOCK_SIZES,
  ALIGN_ITEMS,
  TEXT_ALIGN,
} from '../../../../helpers/constants/design-system';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';

export default function ConfirmationNetworkSwitch({ newNetwork }) {
  const currentNetwork = useSelector((state) => ({
    nickname: state.metamask.provider.nickname,
    type: state.metamask.provider.type,
    chainId: state.metamask.provider.chainId,
  }));

  return (
    <Box
      className="confirmation-network-switch"
      display={DISPLAY.FLEX}
      height={BLOCK_SIZES.FULL}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      marginTop={8}
    >
      <Box
        className="confirmation-network-switch__icon"
        display={DISPLAY.BLOCK}
      >
        {currentNetwork.chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP ? (
          <SiteIcon
            icon={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[currentNetwork.chainId]}
            name={currentNetwork.nickname}
            size={64}
          />
        ) : (
          <div className="confirmation-network-switch__unknown-icon">
            <i className="fa fa-question fa-2x" />
          </div>
        )}
        <Typography
          color={COLORS.TEXT_DEFAULT}
          variant={TYPOGRAPHY.H6}
          fontWeight={FONT_WEIGHT.NORMAL}
          align={TEXT_ALIGN.CENTER}
          boxProps={{
            display: DISPLAY.FLEX,
            justifyContent: JUSTIFY_CONTENT.CENTER,
          }}
        >
          {currentNetwork.nickname || NETWORK_TO_NAME_MAP[currentNetwork.type]}
        </Typography>
      </Box>
      <Box
        className="confirmation-network-switch__center-icon"
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
      >
        <i className="fa fa-angle-right fa-lg confirmation-network-switch__check" />
        <div className="confirmation-network-switch__dashed-line" />
      </Box>
      <Box
        className="confirmation-network-switch__icon"
        display={DISPLAY.BLOCK}
      >
        {newNetwork.chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP ? (
          <SiteIcon
            icon={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[newNetwork.chainId]}
            name={newNetwork.name}
            size={64}
          />
        ) : (
          <div className="confirmation-network-switch__unknown-icon">
            <i className="fa fa-question fa-2x" />
          </div>
        )}
        <Typography
          color={COLORS.TEXT_DEFAULT}
          variant={TYPOGRAPHY.H6}
          fontWeight={FONT_WEIGHT.NORMAL}
          align={TEXT_ALIGN.CENTER}
          boxProps={{
            display: DISPLAY.FLEX,
            justifyContent: JUSTIFY_CONTENT.CENTER,
          }}
        >
          {newNetwork.name}
        </Typography>
      </Box>
    </Box>
  );
}

ConfirmationNetworkSwitch.propTypes = {
  newNetwork: PropTypes.shape({
    chainId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
};
