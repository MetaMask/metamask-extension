import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Box } from '../../../../component-library';
import type { SizeNumber } from '../../../../component-library/box/box.types';
import { IconName } from '../../../../component-library/icon';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../../selectors/selectors.types';
import { TOKEN_TRANSFER_ROUTE } from '../../../../../helpers/constants/routes';
import { PermissionsCellConnectionListItem } from './permissions-cell-connection-list-item';

type PermissionsCellProps = {
  nonTestNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  testNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[];
  totalCount: number;
  chainIds: string[];
  paddingTop?: SizeNumber;
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
      padding={4}
      paddingTop={paddingTop === undefined ? 0 : paddingTop}
      gap={4}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderRadius={BorderRadius.LG}
    >
      <PermissionsCellConnectionListItem
        title={t('tokenTransfer')}
        iconName={IconName.Coin}
        count={totalCount}
        networks={allNetworksWithPermissions}
        countMessage={totalCount === 1 ? t('permission') : t('permissions')}
        paddingBottomValue={0}
        paddingTopValue={0}
        onClick={() => history.push(TOKEN_TRANSFER_ROUTE)}
      />
    </Box>
  );
};
