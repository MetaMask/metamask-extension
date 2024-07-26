import React, { useRef } from 'react';
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
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  infuraProjectId,
} from '../../../../../shared/constants/network';
import {
  setActiveNetwork,
  setEditedNetwork,
  toggleNetworkMenu,
  updateNetwork,
} from '../../../../store/actions';

const SelectRpcUrlModal = ({
  networkConfiguration,
}: {
  networkConfiguration: NetworkConfiguration;
}) => {
  const dispatch = useDispatch();

  const image = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[networkConfiguration.chainId];

  const displayEndpoint = (endpoint: string) => {
    endpoint = endpoint.endsWith('/v3/{infuraProjectId}')
      ? endpoint.replace('/v3/{infuraProjectId}', '')
      : endpoint.endsWith(`/v3/${infuraProjectId}`)
      ? endpoint.replace(`/v3/${infuraProjectId}`, '')
      : endpoint;

    console.log(endpoint, 'endpoint');

    const url = new URL(endpoint);
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}`;
  };
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
          padding={4}
          display={Display.Flex}
          key={rpcEndpoint.url}
          onClick={() => {
            dispatch(
              updateNetwork({
                ...networkConfiguration,
                defaultRpcEndpointIndex: index,
              }),
            );
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
          {/* TODO: Check if this should have tooltip to show full url on hover.
              maybe only when its long enough to get truncated??? */}
          <Text
            as="button"
            padding={0}
            color={TextColor.textDefault}
            variant={TextVariant.bodyMdMedium}
            backgroundColor={BackgroundColor.transparent}
          >
            {rpcEndpoint.name
              ? rpcEndpoint.name
              : displayEndpoint(rpcEndpoint.url)}
          </Text>

          {rpcEndpoint.name && (
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
              ellipsis
            >
              &nbsp;{'•'}&nbsp;
              {displayEndpoint(rpcEndpoint.url)}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default SelectRpcUrlModal;
