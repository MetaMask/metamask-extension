import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../../components/component-library';
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
import { getProviderConfig } from '../../../../ducks/metamask/metamask';

export default function ConfirmationNetworkSwitch({ newNetwork }) {
  const { chainId, nickname, type } = useSelector(getProviderConfig);

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
        {chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP ? (
          <AvatarNetwork
            src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]}
            margin={'auto'}
            name={nickname}
            size={AvatarNetworkSize.Xl}
          />
        ) : (
          <div className="confirmation-network-switch__unknown-icon">
            <i className="fa fa-question fa-2x" />
          </div>
        )}
        <Text
          color={TextColor.textDefault}
          variant={TypographyVariant.H6}
          fontWeight={FontWeight.Normal}
          align={TextAlign.Center}
          boxProps={{
            display: Display.Flex,
            justifyContent: JustifyContent.center,
          }}
        >
          {nickname || NETWORK_TO_NAME_MAP[type]}
        </Text>
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
          <AvatarNetwork
            src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[newNetwork.chainId]}
            margin={'auto'}
            name={newNetwork.nickname}
            size={AvatarNetworkSize.Xl}
          />
        ) : (
          <div className="confirmation-network-switch__unknown-icon">
            <i className="fa fa-question fa-2x" />
          </div>
        )}
        <Text
          color={TextColor.textDefault}
          variant={TypographyVariant.H6}
          fontWeight={FontWeight.Normal}
          align={TextAlign.Center}
        >
          {newNetwork.nickname}
        </Text>
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
