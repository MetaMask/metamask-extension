import React from 'react';
import { infuraProjectId } from '../../../../shared/constants/network';
import { Box, Text } from '../../component-library';
import {
  Display,
  FlexDirection,
  BorderStyle,
  BorderColor,
  TextColor,
  TextVariant,
  BackgroundColor,
  BlockSize,
} from '../../../helpers/constants/design-system';

// TODO: Use version from network controller with v21 upgrade
enum RpcEndpointType {
  Custom = 'custom',
  Infura = 'infura',
}

export const stripKeyFromInfuraUrl = (endpoint: string) => {
  let modifiedEndpoint = endpoint;

  if (modifiedEndpoint.endsWith('/v3/{infuraProjectId}')) {
    modifiedEndpoint = modifiedEndpoint.replace('/v3/{infuraProjectId}', '');
  } else if (modifiedEndpoint.endsWith(`/v3/${infuraProjectId}`)) {
    modifiedEndpoint = modifiedEndpoint.replace(`/v3/${infuraProjectId}`, '');
  }

  return modifiedEndpoint;
};

export const stripProtocol = (endpoint: string) => {
  const url = new URL(endpoint);
  return `${url.host}${url.pathname === '/' ? '' : url.pathname}`;
};

// This components represents an RPC endpoint in a list,
// currently when selecting or editing endpoints for a network.
const RpcListItem = ({
  rpcEndpoint,
}: {
  rpcEndpoint: {
    name?: string;
    url: string;
    type: RpcEndpointType;
  };
}) => {
  const { url, type } = rpcEndpoint;
  const name = type === RpcEndpointType.Infura ? 'Infura' : rpcEndpoint.name;

  const displayEndpoint = (endpoint?: string) =>
    endpoint ? stripProtocol(stripKeyFromInfuraUrl(endpoint)) : '\u00A0';

  const padding = name ? 2 : 4;

  return (
    <Box
      className="rpc-list-item"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      paddingTop={padding}
      paddingBottom={padding}
      {...(!name && {
        borderWidth: 2,
        borderStyle: BorderStyle.solid,
        borderColor: BorderColor.transparent,
      })}
    >
      <Box>
        <Text
          as="button"
          padding={0}
          width={BlockSize.Full}
          color={name ? TextColor.textDefault : TextColor.textAlternative}
          variant={name ? TextVariant.bodyMdMedium : TextVariant.bodySm}
          backgroundColor={BackgroundColor.transparent}
          ellipsis
        >
          {name || displayEndpoint(url)}
        </Text>
      </Box>
      {name && (
        <Box>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            ellipsis
          >
            {displayEndpoint(url)}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default RpcListItem;
