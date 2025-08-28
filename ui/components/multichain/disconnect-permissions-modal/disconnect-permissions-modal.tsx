import React from 'react';
import { useSelector } from 'react-redux';

import {
  StoredGatorPermissionSanitized,
  SignerParam,
  PermissionTypes,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';

import {
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Box,
  ButtonSize,
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/modules/selectors/networks';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
} from '../../../../shared/constants/network';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { formatWithThreshold } from '../../app/assets/util/formatWithThreshold';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getPeriodDescription } from '../../../../shared/lib/gator-permissions-utils';
import {
  TextColor,
  TextVariant,
  Display,
  AlignItems,
  BorderRadius,
  BackgroundColor,
  BlockSize,
  FlexDirection,
} from '../../../helpers/constants/design-system';

const PermissionItem = ({
  permission,
}: {
  permission: {
    permission: StoredGatorPermissionSanitized<SignerParam, PermissionTypes>;
    chainId: Hex;
    permissionType: string;
  };
}) => {
  const networkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );
  const locale = useSelector(getIntlLocale);
  const t = useI18nContext();

  const permissionData =
    permission.permission.permissionResponse.permission.data;

  // Helper function to get token information based on permission type and chain
  const getTokenInfo = React.useCallback(
    (
      permissionType: string,
      chainId: string,
      networkConfig: { nativeCurrency?: string } | null | undefined,
    ) => {
      const isNativeToken = permissionType.includes('native-token');

      if (isNativeToken) {
        const nativeSymbol =
          networkConfig?.nativeCurrency ||
          CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
            chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
          ] ||
          'ETH';
        return {
          name: nativeSymbol,
          decimals: 18,
        };
      }

      // TODO: Get actual token data for ERC20 tokens
      return {
        name: 'Unknown Token',
        decimals: 18,
      };
    },
    [],
  );

  // Helper function to format amount with proper frequency
  const formatAmountDescription = React.useCallback(
    (
      amount: string,
      tokenName: string,
      frequency: string,
      tokenDecimals: number,
      permissionType: string,
    ) => {
      if (!amount || amount === '0') {
        return 'Permission details unavailable';
      }

      try {
        let numericAmount: number;

        if (amount.startsWith('0x')) {
          const tokenAmount = calcTokenAmount(amount, tokenDecimals);
          numericAmount = tokenAmount.toNumber();
        } else {
          numericAmount = parseFloat(amount);
          if (isNaN(numericAmount)) {
            return 'Permission details unavailable';
          }
        }

        const formattedAmount = formatWithThreshold(
          numericAmount,
          0.00001,
          locale,
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 5,
          },
        );

        const isStreaming = permissionType.includes('stream');
        const frequencyText = isStreaming ? t('perSecond') : frequency;

        return `${formattedAmount} ${tokenName} ${frequencyText}`;
      } catch (error) {
        console.error('Error formatting amount:', error);
        return 'Permission details unavailable';
      }
    },
    [locale, t],
  );

  // Helper function to get permission metadata
  const getPermissionMetadata = React.useCallback(
    (permissionType: string, permissionDataParam: unknown) => {
      if (
        permissionType === 'native-token-stream' ||
        permissionType === 'erc20-token-stream'
      ) {
        return {
          displayName: t('tokenStream'),
          amount: (permissionDataParam as any).amountPerSecond as string,
          frequency: t('perSecond'),
        };
      }

      if (
        permissionType === 'native-token-periodic' ||
        permissionType === 'erc20-token-periodic'
      ) {
        const periodDuration = (permissionDataParam as any)
          .periodDuration as string;
        return {
          displayName: t('tokenSubscription'),
          amount: (permissionDataParam as any).periodAmount as string,
          frequency: getPeriodDescription(periodDuration, t),
        };
      }

      return {
        displayName: 'Permission',
        amount: '',
        frequency: '',
      };
    },
    [t, permissionData],
  );

  const computedValues = React.useMemo(() => {
    if (
      !networkConfigurationsByCaipChainId ||
      typeof networkConfigurationsByCaipChainId !== 'object'
    ) {
      return {
        displayName: 'Permission',
        formattedDescription: 'Permission details unavailable',
        networkIcon: '',
        networkName: permission.chainId,
        canRender: false,
      };
    }

    const networkConfig =
      networkConfigurationsByCaipChainId[permission.chainId];
    const networkIcon =
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[permission.chainId] || '';
    const networkName = networkConfig?.name || permission.chainId;

    const { displayName, amount, frequency } = getPermissionMetadata(
      permission.permissionType,
      permissionData,
    );

    const { name: tokenName, decimals: tokenDecimals } = getTokenInfo(
      permission.permissionType,
      permission.chainId,
      networkConfig,
    );

    const formattedDescription = formatAmountDescription(
      amount,
      tokenName,
      frequency,
      tokenDecimals,
      permission.permissionType,
    );

    return {
      displayName,
      formattedDescription,
      networkIcon,
      networkName,
      canRender: true,
    };
  }, [
    permission,
    permissionData,
    networkConfigurationsByCaipChainId,
    getTokenInfo,
    formatAmountDescription,
    getPermissionMetadata,
  ]);

  if (!computedValues.canRender) {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        gap={4}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={4}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
      >
        <Box width={BlockSize.Full}>
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
          >
            {computedValues.displayName}
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {computedValues.formattedDescription}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      gap={4}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
      paddingBottom={4}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <AvatarNetwork
        size={AvatarNetworkSize.Md}
        src={computedValues.networkIcon}
        name={computedValues.networkName}
        borderRadius={BorderRadius.full}
      />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.Full}
      >
        <Text variant={TextVariant.bodyMdMedium} color={TextColor.textDefault}>
          {computedValues.displayName}
        </Text>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
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
  hostname,
  permissions = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onRemoveAll: () => void;
  hostname: string;
  permissions?: {
    permission: StoredGatorPermissionSanitized<SignerParam, PermissionTypes>;
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
          {permissions && permissions.length > 0 && (
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
          <Box display={Display.Flex} gap={2} width={BlockSize.Full}>
            <Button
              onClick={onSkip}
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              block
              data-testid="skip-disconnect-permissions"
            >
              {t('skip')}
            </Button>
            <Button
              onClick={onRemoveAll}
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              block
              danger
              data-testid="remove-all-disconnect-permissions"
            >
              {t('removeAll')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
