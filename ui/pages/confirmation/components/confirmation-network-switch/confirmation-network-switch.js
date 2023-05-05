import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Box from '../../../../components/ui/box';
import SiteIcon from '../../../../components/ui/site-icon';
import Typography from '../../../../components/ui/typography/typography';
import {
  TypographyVariant,
  FontWeight,
  DISPLAY,
  JustifyContent,
  BLOCK_SIZES,
  AlignItems,
  TextAlign,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../shared/constants/network';
import { getProviderConfig } from '../../../../ducks/metamask/metamask';

export default function ConfirmationNetworkSwitch({ newNetwork }) {
  const { chainId, nickname, type } = useSelector(getProviderConfig);

  return (
    <Box
      className="confirmation-network-switch"
      display={DISPLAY.FLEX}
      height={BLOCK_SIZES.FULL}
      justifyContent={JustifyContent.center}
      marginTop={8}
    >
      <Box
        className="confirmation-network-switch__icon"
        display={DISPLAY.BLOCK}
      >
        {chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP ? (
          <SiteIcon
            icon={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]}
            name={nickname}
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
            display: DISPLAY.FLEX,
            justifyContent: JustifyContent.center,
          }}
        >
          {nickname || NETWORK_TO_NAME_MAP[type]}
        </Typography>
      </Box>
      <Box
        className="confirmation-network-switch__center-icon"
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
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
            display: DISPLAY.FLEX,
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
  }),
};
