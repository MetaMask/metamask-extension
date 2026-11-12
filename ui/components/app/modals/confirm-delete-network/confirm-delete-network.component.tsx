import React, { useCallback, useEffect } from 'react';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { CaipChainId, Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalContent,
  ModalOverlay,
  Text,
  TextAlign,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import {
  NetworkManagementEntryPoint,
  NetworkManagementInteractionType,
  NetworkRemovalType,
} from '../../../../../shared/constants/metametrics';
import {
  trackNetworkManagementInteracted,
  trackNetworkRemoved,
} from '../../../../helpers/utils/network-management-metrics';
import { getNetworkSectionKey } from '../../../../helpers/utils/network-sections';

type ConfirmDeleteNetworkProps = {
  hideModal: () => void;
  removeNetwork: (chainId: CaipChainId) => Promise<void>;
  onConfirm: () => void;
  networkNickname: string;
  chainId: Hex;
  isChainToDeleteSelected?: boolean;
  switchToEthereumNetwork?: () => Promise<void>;
  metricsEntryPoint?: NetworkManagementEntryPoint;
};

export default function ConfirmDeleteNetwork({
  hideModal,
  removeNetwork,
  onConfirm,
  networkNickname,
  chainId,
  isChainToDeleteSelected,
  switchToEthereumNetwork,
  metricsEntryPoint = NetworkManagementEntryPoint.SettingsNetworks,
}: ConfirmDeleteNetworkProps) {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();

  useEffect(() => {
    trackNetworkManagementInteracted(
      { trackEvent, createEventBuilder },
      {
        interactionType:
          NetworkManagementInteractionType.NetworkRemovalRequested,
        entryPoint: metricsEntryPoint,
        chainId,
        networkType: getNetworkSectionKey(chainId),
      },
    );
    // The confirmation is shown once when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = useCallback(async () => {
    // NOTE: We only support EVM networks removal, so the conversion is safe here.
    const caipChainId = toEvmCaipChainId(chainId);

    // NOTE: ensure that we are not deleting a selected evm chain
    if (isChainToDeleteSelected) {
      await switchToEthereumNetwork?.();
    }

    await removeNetwork(caipChainId);
    trackNetworkRemoved(
      { trackEvent, createEventBuilder },
      {
        chainId,
        entryPoint: metricsEntryPoint,
        removalType: NetworkRemovalType.Deleted,
      },
    );

    onConfirm();
    hideModal();
  }, [
    chainId,
    hideModal,
    isChainToDeleteSelected,
    metricsEntryPoint,
    onConfirm,
    removeNetwork,
    switchToEthereumNetwork,
    trackEvent,
    createEventBuilder,
  ]);

  return (
    <Modal
      isOpen
      onClose={hideModal}
      data-testid="confirm-delete-network-modal"
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          className: 'overflow-hidden p-4 shadow-lg',
        }}
        className="items-center p-4 sm:py-6 md:py-6"
      >
        <ModalHeader
          className="items-start px-0 pb-4"
          onClose={hideModal}
          closeButtonProps={{
            ariaLabel: t('close'),
          }}
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={2}
            className="min-w-0"
          >
            <Icon
              name={IconName.Danger}
              size={IconSize.Xl}
              color={IconColor.ErrorDefault}
            />
            <Text
              asChild
              variant={TextVariant.HeadingSm}
              textAlign={TextAlign.Center}
            >
              <h2>{t('deleteNetworkTitle', [networkNickname])}</h2>
            </Text>
          </Box>
        </ModalHeader>
        <Text className="w-full" variant={TextVariant.BodyMd}>
          {t('deleteNetworkIntro')}
        </Text>
        <ModalFooter
          className="px-0 pt-6"
          secondaryButtonProps={
            {
              children: t('cancel'),
              onClick: hideModal,
              size: ButtonSize.Lg,
              variant: ButtonVariant.Secondary,
            } as React.ComponentProps<
              typeof ModalFooter
            >['secondaryButtonProps']
          }
          primaryButtonProps={
            {
              children: t('delete'),
              'data-testid': 'confirm-delete-network-modal-delete-button',
              isDanger: true,
              onClick: handleDelete,
              size: ButtonSize.Lg,
              variant: ButtonVariant.Primary,
            } as React.ComponentProps<typeof ModalFooter>['primaryButtonProps']
          }
        />
      </ModalContent>
    </Modal>
  );
}
