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
  UNKNOWN_NETWORK,
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
    >
      <Box
        className="confirmation-network-switch__icons"
        display={DISPLAY.FLEX}
        marginTop={8}
      >
        <Box
          className="confirmation-network-switch__icon"
          display={DISPLAY.BLOCK}
        >
          <SiteIcon
            icon={
              CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                currentNetwork.chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                  ? currentNetwork.chainId
                  : UNKNOWN_NETWORK
              ]
            }
            name={currentNetwork.nickname}
            size={64}
          />
          <Typography
            color={COLORS.BLACK}
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.NORMAL}
            align={TEXT_ALIGN.CENTER}
            boxProps={{
              display: DISPLAY.FLEX,
              justifyContent: JUSTIFY_CONTENT.CENTER,
            }}
          >
            {currentNetwork.nickname ||
              NETWORK_TO_NAME_MAP[currentNetwork.type]}
          </Typography>
        </Box>
        <Box
          className="confirmation-network-switch__center-icon"
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          justifyContent={JUSTIFY_CONTENT.CENTER}
        >
          <span className="confirmation-network-switch__check" />
          <img src="./images/broken-line.svg" alt="broken-line" />
        </Box>
        <Box
          className="confirmation-network-switch__icon"
          display={DISPLAY.BLOCK}
        >
          <SiteIcon
            icon={
              CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                newNetwork.chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
                  ? newNetwork.chainId
                  : UNKNOWN_NETWORK
              ]
            }
            name={newNetwork.name}
            size={64}
          />
          <Typography
            color={COLORS.BLACK}
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
    </Box>
  );
}

ConfirmationNetworkSwitch.propTypes = {
  newNetwork: PropTypes.shape({
    chainId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
};
