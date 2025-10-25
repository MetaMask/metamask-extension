import React from 'react';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { NetworkConfiguration } from '@metamask/network-controller';
import { type CaipChainId } from '@metamask/utils';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom-v5-compat';
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
import { setEditedNetwork, updateNetwork } from '../../../../store/actions';
import RpcListItem from '../rpc-list-item';
import { getMultichainNetworkConfigurationsByChainId } from '../../../../selectors';

export const SelectRpcUrlModal = ({
  networkConfiguration,
  onNetworkChange,
}: {
  networkConfiguration?: NetworkConfiguration;
  onNetworkChange: (chainId: CaipChainId, networkClientId: string) => void;
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const chainId = location.state?.chainId;

  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const networkConfigurationToUse =
    networkConfiguration ?? evmNetworks[chainId as keyof typeof evmNetworks];

  // Handle case where both networkConfiguration and chainId are undefined
  if (!networkConfigurationToUse) {
    return null;
  }

  const image =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      networkConfigurationToUse.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
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
              name={networkConfigurationToUse.name}
              size={AvatarNetworkSize.Sm}
              marginRight={1}
            />
          )}
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {networkConfigurationToUse.name}
          </Text>
        </Box>
      </Box>

      {networkConfigurationToUse.rpcEndpoints.map((rpcEndpoint, index) => (
        <Box
          alignItems={AlignItems.center}
          paddingLeft={4}
          paddingRight={4}
          display={Display.Flex}
          key={rpcEndpoint.url}
          onClick={() => {
            const network = {
              ...networkConfigurationToUse,
              defaultRpcEndpointIndex: index,
            };
            dispatch(updateNetwork(network));
            dispatch(setEditedNetwork());
            onNetworkChange(
              toEvmCaipChainId(network.chainId),
              rpcEndpoint.networkClientId,
            );
          }}
          className={classnames('select-rpc-url__item', {
            'select-rpc-url__item--selected':
              index === networkConfigurationToUse.defaultRpcEndpointIndex,
          })}
        >
          {index === networkConfigurationToUse.defaultRpcEndpointIndex && (
            <Box
              className="select-rpc-url__item-selected-pill"
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
