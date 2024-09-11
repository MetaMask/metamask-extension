import React from 'react';
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
  // TODO: `NetworkConfiguration` with network controller v21 upgrade
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  networkConfiguration: any;
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

      {networkConfiguration.rpcEndpoints.map(
        // TODO: types will be inferred with network controller v21 upgrade
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rpcEndpoint: any, index: number) => (
          <Box
            alignItems={AlignItems.center}
            paddingLeft={4}
            paddingRight={4}
            display={Display.Flex}
            key={rpcEndpoint.url}
            onClick={() => {
              // TODO: When this API becomes available with network controller v21 upgrade
              // dispatch(
              //   updateNetwork({
              //     ...networkConfiguration,
              //     defaultRpcEndpointIndex: index,
              //   }),
              // );
              dispatch(setActiveNetwork(rpcEndpoint.networkClientId));
              dispatch(setEditedNetwork());
              dispatch(toggleNetworkMenu());
            }}
            className={classnames('select-rpc-url__item', {
              'select-rpc-url__item--selected':
                index === networkConfiguration.defaultRpcEndpointIndex,
            })}
          >
            {index === networkConfiguration.defaultRpcEndpointIndex && (
              <Box
                className="select-rpc-url__item-selected-pill"
                borderRadius={BorderRadius.pill}
                backgroundColor={BackgroundColor.primaryDefault}
              />
            )}
            <RpcListItem rpcEndpoint={rpcEndpoint} />
          </Box>
        ),
      )}
    </Box>
  );
};

export default SelectRpcUrlModal;
