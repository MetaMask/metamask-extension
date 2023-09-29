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
  Display,
  JustifyContent,
  BlockSize,
  AlignItems,
  TextAlign,
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
        <AvatarNetwork
          src={
            chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
              ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]
              : ''
          }
          name={nickname}
          size={AvatarNetworkSize.Xl}
          marginBottom={2}
        />
        <Text
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          align={TextAlign.Center}
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
        <AvatarNetwork
          src={
            newNetwork.chainId in CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
              ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[newNetwork.chainId]
              : ''
          }
          name={newNetwork.nickname}
          size={AvatarNetworkSize.Xl}
          marginBottom={2}
        />
        <Text
          display={Display.Flex}
          justifyContent={JustifyContent.center}
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
