import React from 'react';
import { useSelector } from 'react-redux';

import {
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';

import {
  TextColor,
  TextVariant,
  Button,
  ButtonVariant,
  Text,
  Box,
  ButtonSize,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarBaseShape,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
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

const PermissionItem = ({
  permission,
}: {
  permission: {
    permission: StoredGatorPermissionSanitized<
      Signer,
      PermissionTypesWithCustom
    >;
    chainId: Hex;
    permissionType: string;
  };
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
  const [resolvedTokenInfo, setResolvedTokenInfo] = React.useState<{
    symbol: string;
    decimals: number;
  }>({ symbol: 'Unknown Token', decimals: 18 });

  // Resolve token info (native or ERC-20) for this permission
  React.useEffect(() => {
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
  const formatAmountDescription = React.useCallback(
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
  const getPermissionMetadata = React.useCallback(
    (permissionType: string, permissionDataParam: GatorPermissionData) =>
      getGatorPermissionDisplayMetadata(
        permissionType,
        permissionDataParam,
        t as TranslationFunction,
      ),
    [t],
  );

  // Get account address from permission response
  const signerAddress = React.useMemo(() => {
    // The address field in permissionResponse represents the account that granted the permission
    return permission.permission.permissionResponse.address;
  }, [permission]);

  const accountName = useSelector((state: AccountsMetaMaskState) =>
    signerAddress ? getMemoizedAccountName(state, signerAddress) : '',
  );

  const computedValues = React.useMemo(() => {
    const networkConfig =
      networkConfigurationsByCaipChainId?.[permission.chainId];
    const networkIcon =
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[permission.chainId] || '';
    const networkName = networkConfig?.name || permission.chainId;

    const { displayName, amount, frequency } = getPermissionMetadata(
      permission.permissionType,
      permissionData,
    );

    let formattedDescription = formatAmountDescription(
      amount,
      resolvedTokenInfo.symbol,
      frequency,
      resolvedTokenInfo.decimals,
    );

    // Append account information to the formatted description
    if (signerAddress) {
      const accountInfo = accountName || shortenAddress(signerAddress);
      formattedDescription = `${formattedDescription} • ${accountInfo}`;
    }

    return {
      displayName,
      formattedDescription,
      networkIcon,
      networkName,
    };
  }, [
    permission,
    permissionData,
    networkConfigurationsByCaipChainId,
    resolvedTokenInfo,
    formatAmountDescription,
    getPermissionMetadata,
    signerAddress,
    accountName,
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
        src={computedValues.networkIcon}
        name={computedValues.networkName}
        shape={AvatarBaseShape.Circle}
      />
      <Box flexDirection={BoxFlexDirection.Column}>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
          {computedValues.displayName}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {computedValues.formattedDescription}
        </Text>
      </Box>
    </Box>
  );
};

export const DisconnectPermissionsModal = ({
  isOpen,
  onClose,
  onSkip,
  onRemoveAll,
  permissions = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onRemoveAll: () => void;
  permissions?: {
    permission: StoredGatorPermissionSanitized<
      Signer,
      PermissionTypesWithCustom
    >;
    chainId: Hex;
    permissionType: string;
  }[];
}) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="disconnect-permissions-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('otherPermissionsOnSiteTitle')}
        </ModalHeader>
        <ModalBody paddingLeft={0} paddingRight={0}>
          <Box padding={4}>
            <Text>{t('otherPermissionsOnSiteDescription')}</Text>
          </Box>
          {permissions.length > 0 && (
            <Box>
              {permissions.map((permission, index) => {
                return (
                  <PermissionItem
                    key={`${permission.chainId}-${permission.permissionType}-${index}`}
                    permission={permission}
                  />
                );
              })}
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Box flexDirection={BoxFlexDirection.Row} gap={2}>
            <Button
              onClick={onSkip}
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              data-testid="skip-disconnect-permissions"
              isFullWidth
            >
              {t('skip')}
            </Button>
            <Button
              onClick={onRemoveAll}
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isDanger
              data-testid="remove-all-disconnect-permissions"
              isFullWidth
            >
              {t('removeAll')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
