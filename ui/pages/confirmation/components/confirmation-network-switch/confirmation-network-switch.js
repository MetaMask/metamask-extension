import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../../components/ui/box';
import SiteIcon from '../../../../components/ui/site-icon';
import Typography from '../../../../components/ui/typography/typography';
import {
  TypographyVariant,
  FontWeight,
  Display,
  JustifyContent,
  BlockSize,
  AlignItems,
  TextAlign,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';

export default function ConfirmationNetworkSwitch({ newNetwork, fromNetwork }) {
  return (
    <Box
      className="confirmation-network-switch"
      display={Display.Flex}
      height={BlockSize.Full}
      justifyContent={JustifyContent.center}
      marginTop={8}
    >
      <Box
        className="confirmation-network-switch__icon"
        display={Display.Block}
      >
        {fromNetwork.chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP ? (
          <SiteIcon
            icon={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[fromNetwork.chainId]}
            name={fromNetwork.nickname}
            size={64}
          />
        ) : (
          <div className="confirmation-network-switch__unknown-icon">
            <i className="fa fa-question fa-2x" />
          </div>
        )}
        <Typography
          color={TextColor.textDefault}
          variant={TypographyVariant.H6}
          fontWeight={FontWeight.Normal}
          align={TextAlign.Center}
          boxProps={{
            display: Display.Flex,
            justifyContent: JustifyContent.center,
          }}
        >
          {fromNetwork.nickname || NETWORK_TO_NAME_MAP[fromNetwork.type]}
        </Typography>
      </Box>
      <Box
        className="confirmation-network-switch__center-icon"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
      >
        <i className="fa fa-angle-right fa-lg confirmation-network-switch__check" />
        <div className="confirmation-network-switch__dashed-line" />
      </Box>
      <Box
        className="confirmation-network-switch__icon"
        display={Display.Block}
      >
        {newNetwork.chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP ? (
          <SiteIcon
            icon={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[newNetwork.chainId]}
            name={newNetwork.nickname}
            size={64}
          />
        ) : (
          <div className="confirmation-network-switch__unknown-icon">
            <i className="fa fa-question fa-2x" />
          </div>
        )}
        <Typography
          color={TextColor.textDefault}
          variant={TypographyVariant.H6}
          fontWeight={FontWeight.Normal}
          align={TextAlign.Center}
          boxProps={{
            display: Display.Flex,
            justifyContent: JustifyContent.center,
          }}
        >
          {newNetwork.nickname}
        </Typography>
      </Box>
    </Box>
  );
}

ConfirmationNetworkSwitch.propTypes = {
  newNetwork: PropTypes.shape({
    chainId: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    type: PropTypes.string,
  }),
  fromNetwork: PropTypes.shape({
    chainId: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    type: PropTypes.string,
  }),
};
