import React from 'react';
import { NetworkConfiguration } from '@metamask/network-controller';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
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
  grantPermittedChain,
  setActiveNetwork,
  setEditedNetwork,
  setNetworkClientIdForDomain,
  showPermittedNetworkToast,
  toggleNetworkMenu,
  updateNetwork,
} from '../../../../store/actions';
import RpcListItem from '../rpc-list-item';
import {
  getAllDomains,
  getOriginOfCurrentTab,
  getPermittedAccountsForSelectedTab,
  getPermittedChainsForSelectedTab,
  getUseRequestQueue,
} from '../../../../selectors';

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
  const useRequestQueue = useSelector(getUseRequestQueue);
  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const permittedAccountAddresses = useSelector((state) =>
    getPermittedAccountsForSelectedTab(state, selectedTabOrigin),
  );
  const permittedChainIds = useSelector((state) =>
    getPermittedChainsForSelectedTab(state, selectedTabOrigin),
  );
  const domains = useSelector(getAllDomains);
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
            dispatch(
              updateNetwork({
                ...networkConfiguration,
                defaultRpcEndpointIndex: index,
              }),
            );
            dispatch(setActiveNetwork(rpcEndpoint.networkClientId));
            dispatch(
              setEditedNetwork({ chainId: networkConfiguration.chainId }),
            );
            dispatch(toggleNetworkMenu());
            if (permittedAccountAddresses.length > 0) {
              grantPermittedChain(
                selectedTabOrigin,
                networkConfiguration.chainId,
              );
              if (!permittedChainIds.includes(networkConfiguration.chainId)) {
                dispatch(showPermittedNetworkToast());
              }
            }
            if (
              useRequestQueue &&
              selectedTabOrigin &&
              domains[selectedTabOrigin]
            ) {
              setNetworkClientIdForDomain(
                selectedTabOrigin,
                rpcEndpoint.networkClientId,
              );
            }
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
      ))}
    </Box>
  );
};

export default SelectRpcUrlModal;
