import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Box } from '../../../../component-library';
import { IconName } from '../../../../component-library/icon';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../../selectors/selectors.types';
import { PermissionsCellConnectionListItem } from './permissions-cell-connection-list-item.js';
import { TOKEN_STREAMS_ROUTE, TOKEN_SUBSCRIPTIONS_ROUTE } from '../../../../../helpers/constants/routes';

type PermissionsCellProps = {
  nonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  testNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  streamsCount: number;
  subscriptionsCount: number;
  streamsChainIds: string[];
  subscriptionsChainIds: string[];
};

export const PermissionsCell: React.FC<PermissionsCellProps> = ({
  nonTestNetworks,
  testNetworks,
  streamsCount,
  subscriptionsCount,
  streamsChainIds,
  subscriptionsChainIds,
}) => {
  const t = useI18nContext();
  const history = useHistory();
  const allNetworks = [...nonTestNetworks, ...testNetworks];

  // Get network objects for streams and subscriptions
  const streamsNetworks = allNetworks.filter(({ chainId }) =>
    streamsChainIds.includes(chainId),
  );
  const subscriptionsNetworks = allNetworks.filter(({ chainId }) =>
    subscriptionsChainIds.includes(chainId),
  );

  // Only show items if they have permissions
  if (streamsCount === 0 && subscriptionsCount === 0) {
    return null;
  }

  // Only show items if they have networks
  if (streamsNetworks.length === 0 && subscriptionsNetworks.length === 0) {
    return null;
  }

  return (
    <Box
      padding={4}
      paddingTop={0}
      gap={4}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.LG}
    >
      {streamsCount > 0 && streamsNetworks.length > 0 && (
        <PermissionsCellConnectionListItem
          title={t('tokenStreams')}
          iconName={IconName.Coin}
          count={streamsCount}
          networks={streamsNetworks}
          countMessage={t('streams')}
          paddingBottomValue={2}
          paddingTopValue={0}
          onClick={() => history.push(TOKEN_STREAMS_ROUTE)}
        />
      )}
      {subscriptionsCount > 0 && subscriptionsNetworks.length > 0 && (
        <PermissionsCellConnectionListItem
          title={t('tokenSubscriptions')}
          iconName={IconName.Coin}
          count={subscriptionsCount}
          networks={subscriptionsNetworks}
          countMessage={t('subscriptions')}
          paddingTopValue={2}
          paddingBottomValue={0}
          onClick={() => history.push(TOKEN_SUBSCRIPTIONS_ROUTE)}
        />
      )}
    </Box>
  );
};
