import { RpcEndpointType } from '@metamask/network-controller';
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
  TextAlign,
} from '../../../helpers/constants/design-system';

export const stripKeyFromInfuraUrl = (endpoint: string) =>
  (endpoint = endpoint.endsWith('/v3/{infuraProjectId}')
    ? endpoint.replace('/v3/{infuraProjectId}', '')
    : endpoint.endsWith(`/v3/${infuraProjectId}`)
    ? endpoint.replace(`/v3/${infuraProjectId}`, '')
    : endpoint);
9;
export const stripProtocol = (endpoint: string) => {
  const url = new URL(endpoint);
  return `${url.host}${url.pathname === '/' ? '' : url.pathname}`;
};

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
  const name = type == RpcEndpointType.Infura ? 'Infura' : rpcEndpoint.name;

  const displayEndpoint = (endpoint?: string) =>
    !endpoint ? '\u00A0' : stripProtocol(stripKeyFromInfuraUrl(endpoint));

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
