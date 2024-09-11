import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import {
  setActiveNetwork,
  setEditedNetwork,
  toggleNetworkMenu,
} from '../../../../store/actions';
import RpcListItem from '../rpc-list-item';

export const SelectRpcUrlModal = ({
  networkConfiguration,
}: {
  networkConfiguration: NetworkConfiguration;
}) => {
  const dispatch = useDispatch();

  const image =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      networkConfiguration.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ];

  return (
    <Box>
      <Box display={Display.Flex}>
        <Box
          margin="auto"
          paddingTop={1}
          paddingBottom={8}
          display={Display.Flex}
          alignItems={AlignItems.center}
        >
          {image && (
            <AvatarNetwork
              src={image}
              name={networkConfiguration.name}
              size={AvatarNetworkSize.Sm}
              marginRight={1}
            />
          )}
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {networkConfiguration.name}
          </Text>
        </Box>
      </Box>

      {networkConfiguration.rpcEndpoints.map((rpcEndpoint, index) => (
        <Box
          alignItems={AlignItems.center}
          paddingLeft={4}
          paddingRight={4}
          display={Display.Flex}
          key={rpcEndpoint.url}
          onClick={() => {
            // todo : call updateNetwork with the new configuration
            dispatch(setActiveNetwork(rpcEndpoint.networkClientId));
            dispatch(setEditedNetwork());
            dispatch(toggleNetworkMenu());
          }}
          className={classnames('networks-tab__item', {
            'networks-tab__item--selected':
              index === networkConfiguration.defaultRpcEndpointIndex,
          })}
        >
          {index === networkConfiguration.defaultRpcEndpointIndex && (
            <Box
              className="networks-tab__item-selected-pill"
              borderRadius={BorderRadius.pill}
              backgroundColor={BackgroundColor.primaryDefault}
            />
          )}
          <RpcListItem rpcEndpoint={rpcEndpoint} />
        </Box>
      ))}
    </Box>
  );
};

export default SelectRpcUrlModal;
