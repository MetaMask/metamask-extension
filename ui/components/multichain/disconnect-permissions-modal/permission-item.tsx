import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { hexToNumber, KnownCaipNamespace, CaipChainId } from '@metamask/utils';
import {
  TextColor,
  TextVariant,
  Text,
  Box,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarBaseShape,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/modules/selectors/networks';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import {
  formatGatorAmountLabel,
  getGatorPermissionDisplayMetadata,
  GatorPermissionData,
} from '../../../../shared/lib/gator-permissions';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { shortenAddress } from '../../../helpers/utils/util';
import { useDisplayName } from '../../../hooks/snaps/useDisplayName';
import { useGatorPermissionTokenInfo } from '../../../hooks/gator-permissions/useGatorPermissionTokenInfo';
import { PermissionItemProps } from './types';

export const PermissionItem: React.FC<PermissionItemProps> = ({
  permission,
}) => {
  const networkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );
  const locale = useSelector(getIntlLocale);
  const t = useI18nContext();

  const permissionData = permission.permission.permissionResponse.permission
    .data as GatorPermissionData;

  const caipChainId: CaipChainId = `${KnownCaipNamespace.Eip155}:${hexToNumber(permission.chainId)}`;

  const networkConfig = networkConfigurationsByCaipChainId?.[caipChainId];

  // Use the hook to fetch token information (handles both native and ERC-20 tokens)
  const { tokenInfo } = useGatorPermissionTokenInfo(
    permissionData.tokenAddress as string | undefined,
    permission.chainId,
    permission.permissionType,
  );

  // Format amount description for this permission
  const formatAmountDescription = useCallback(
    (
      amount: string,
      tokenName: string,
      frequency: string,
      tokenDecimals: number,
    ) =>
      formatGatorAmountLabel({
        amount,
        tokenSymbol: tokenName,
        frequency,
        tokenDecimals,
        locale,
      }),
    [locale],
  );

  const signerAddress = permission.permission.permissionResponse.address;

  // Always call useDisplayName hook (hooks must be called unconditionally)
  const displayNameResult = useDisplayName({
    chain: {
      namespace: KnownCaipNamespace.Eip155,
      reference: hexToNumber(permission.chainId).toString(),
    },
    chainId: caipChainId,
    address: signerAddress || '',
  });

  // Only use the display name if signerAddress exists
  const accountName = displayNameResult || undefined;

  // Network configuration values (simple derived values, no need for memoization)
  const networkIcon =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[permission.chainId] || '';
  const networkName = networkConfig?.name || permission.chainId;

  // Get permission display metadata (returns translation keys)
  const { displayNameKey, amount, frequencyKey } =
    getGatorPermissionDisplayMetadata(
      permission.permissionType,
      permissionData,
    );

  // Translate the keys to get display strings
  const displayName = t(displayNameKey);
  const frequency = t(frequencyKey);

  // Only memoize the formatted description since it depends on multiple values
  const formattedDescription = useMemo(() => {
    let description = formatAmountDescription(
      amount,
      tokenInfo.symbol,
      frequency,
      tokenInfo.decimals,
    );

    // Append account information to the formatted description
    if (signerAddress) {
      const accountInfo = accountName || shortenAddress(signerAddress);
      description = `${description} • ${accountInfo}`;
    }

    return description;
  }, [
    amount,
    tokenInfo.symbol,
    tokenInfo.decimals,
    frequency,
    signerAddress,
    accountName,
    formatAmountDescription,
  ]);

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      flexDirection={BoxFlexDirection.Row}
      gap={4}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      paddingBottom={4}
    >
      <AvatarNetwork
        size={AvatarNetworkSize.Md}
        src={networkIcon}
        name={networkName}
        shape={AvatarBaseShape.Circle}
      />
      <Box flexDirection={BoxFlexDirection.Column}>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
          {displayName}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {formattedDescription}
        </Text>
      </Box>
    </Box>
  );
};
