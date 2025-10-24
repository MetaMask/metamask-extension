import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
  getGatorPermissionTokenInfo,
  GatorPermissionData,
  TranslationFunction,
} from '../../../../shared/lib/gator-permissions';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getUseExternalServices } from '../../../selectors';
import {
  getMemoizedAccountName,
  AccountsMetaMaskState,
} from '../../../selectors/snaps/accounts';
import { shortenAddress } from '../../../helpers/utils/util';
import { getTokenStandardAndDetailsByChain } from '../../../store/actions';
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

  const allowExternalServices = useSelector(getUseExternalServices);

  // Resolve token info (native or ERC-20) for this permission
  const [resolvedTokenInfo, setResolvedTokenInfo] = useState<{
    symbol: string;
    decimals: number;
  }>({ symbol: 'Unknown Token', decimals: 18 });

  // Resolve token info (native or ERC-20) for this permission
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const info = await getGatorPermissionTokenInfo({
        permissionType: permission.permissionType,
        chainId: permission.chainId,
        networkConfig: networkConfigurationsByCaipChainId?.[permission.chainId],
        permissionData,
        allowExternalServices,
        getTokenStandardAndDetailsByChain,
      });
      if (!cancelled) {
        setResolvedTokenInfo(info);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    allowExternalServices,
    permission.permissionType,
    permission.chainId,
    permissionData,
    networkConfigurationsByCaipChainId,
  ]);

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

  // Get permission metadata for this permission
  const getPermissionMetadata = useCallback(
    (permissionType: string, permissionDataParam: GatorPermissionData) =>
      getGatorPermissionDisplayMetadata(
        permissionType,
        permissionDataParam,
        t as TranslationFunction,
      ),
    [t],
  );

  const signerAddress = permission.permission.permissionResponse.address;

  const accountName = useSelector((state: AccountsMetaMaskState) =>
    signerAddress ? getMemoizedAccountName(state, signerAddress) : '',
  );

  // Network configuration values (simple derived values, no need for memoization)
  const networkConfig =
    networkConfigurationsByCaipChainId?.[permission.chainId];
  const networkIcon =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[permission.chainId] || '';
  const networkName = networkConfig?.name || permission.chainId;

  // Get permission display metadata
  const { displayName, amount, frequency } = getPermissionMetadata(
    permission.permissionType,
    permissionData,
  );

  // Only memoize the formatted description since it depends on multiple values
  const formattedDescription = useMemo(() => {
    let description = formatAmountDescription(
      amount,
      resolvedTokenInfo.symbol,
      frequency,
      resolvedTokenInfo.decimals,
    );

    // Append account information to the formatted description
    if (signerAddress) {
      const accountInfo = accountName || shortenAddress(signerAddress);
      description = `${description} • ${accountInfo}`;
    }

    return description;
  }, [
    amount,
    resolvedTokenInfo.symbol,
    resolvedTokenInfo.decimals,
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
