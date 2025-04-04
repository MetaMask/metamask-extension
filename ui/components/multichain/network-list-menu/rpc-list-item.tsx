import { RpcEndpointType } from '@metamask/network-controller';
import React from 'react';
import { infuraProjectId } from '../../../../shared/constants/network';
import { Box, Tag, Text } from '../../component-library';
import {
  Display,
  FlexDirection,
  BorderStyle,
  BorderColor,
  TextColor,
  TextVariant,
  BackgroundColor,
  BlockSize,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

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
    failoverUrls?: string[];
    type: RpcEndpointType;
  };
}) => {
  const t = useI18nContext();
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
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={1}
        >
          {name || displayEndpoint(url)}
          {rpcEndpoint.failoverUrls && rpcEndpoint.failoverUrls.length > 0 ? (
            <Tag label={t('failover')} display={Display.Inline} />
          ) : null}
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
