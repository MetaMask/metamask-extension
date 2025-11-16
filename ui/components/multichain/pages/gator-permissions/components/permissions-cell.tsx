import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  BoxBackgroundColor,
  BoxSpacing,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../../selectors/selectors.types';
import { TOKEN_TRANSFER_ROUTE } from '../../../../../helpers/constants/routes';
import { PermissionsCellConnectionListItem } from './permissions-cell-connection-list-item';

type PermissionsCellProps = {
  nonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  testNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  totalCount: number;
  chainIds: string[];
  paddingTop?: BoxSpacing;
};

export const PermissionsCell: React.FC<PermissionsCellProps> = ({
  nonTestNetworks,
  testNetworks,
  totalCount,
  chainIds,
  paddingTop,
}) => {
  const t = useI18nContext();
  const history = useHistory();
  const allNetworks = [...nonTestNetworks, ...testNetworks];

  const allNetworksWithPermissions = allNetworks.filter(({ chainId }) =>
    chainIds.includes(chainId),
  );

  // Only show items if they have permissions
  if (totalCount === 0) {
    return null;
  }

  return (
    <Box
      data-testid="gator-permissions-cell"
      padding={4}
      paddingTop={paddingTop === undefined ? 0 : paddingTop}
      gap={4}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      <PermissionsCellConnectionListItem
        title={t('tokenTransfer')}
        iconName={IconName.Coin}
        count={totalCount}
        networks={allNetworksWithPermissions}
        countMessage={totalCount === 1 ? t('tokenCount') : t('tokensCount')}
        paddingBottomValue={0}
        paddingTopValue={0}
        onClick={() => history.push(TOKEN_TRANSFER_ROUTE)}
      />
    </Box>
  );
};
