import React, { useCallback } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import { useGasSponsorshipPreference } from '../../../../../hooks/gas/useGasSponsorshipPreference';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../../../../shared/constants/network';
import { useNativeCurrencySymbol } from '../../hooks/useNativeCurrencySymbol';
import { useFeeCalculations } from '../../hooks/useFeeCalculations';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function GasSponsorshipModal({ onClose }: { onClose: () => void }) {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta;
  const { isSponsorshipOptedOut, setSponsorshipOptedOut } =
    useGasSponsorshipPreference(chainId);
  const { nativeCurrencySymbol } = useNativeCurrencySymbol(chainId);
  const { estimatedFeeFiat, estimatedFeeNative } =
    useFeeCalculations(transactionMeta);

  const handleSelectSponsored = useCallback(() => {
    setSponsorshipOptedOut(false);
    onClose();
  }, [setSponsorshipOptedOut, onClose]);

  const handleSelectNative = useCallback(() => {
    setSponsorshipOptedOut(true);
    onClose();
  }, [setSponsorshipOptedOut, onClose]);

  const isSponsoredSelected = !isSponsorshipOptedOut;

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay data-testid="gas-sponsorship-modal-overlay" />
      <ModalContent
        size={ModalContentSize.Md}
        modalDialogProps={{ paddingBottom: 0 }}
      >
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {t('gasSponsorshipModalTitle')}
        </ModalHeader>
        <ModalBody className="flex flex-col pl-0 pr-0 pb-0">
          <SponsorshipOption
            isSelected={isSponsoredSelected}
            onClick={handleSelectSponsored}
            icon={
              <CircularIconWrapper>
                <img
                  src="./images/logo/metamask-fox.svg"
                  width={20}
                  height={20}
                />
              </CircularIconWrapper>
            }
            primaryText={t('paidByMetaMask')}
            secondaryText={t('includesSmartAccountActivation')}
          />
          <SponsorshipOption
            isSelected={!isSponsoredSelected}
            onClick={handleSelectNative}
            icon={
              <CircularIconWrapper>
                <AvatarToken
                  src={
                    CHAIN_ID_TOKEN_IMAGE_MAP[
                      chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
                    ]
                  }
                  name={nativeCurrencySymbol}
                  size={AvatarTokenSize.Sm}
                />
              </CircularIconWrapper>
            }
            primaryText={nativeCurrencySymbol}
            secondaryText={
              estimatedFeeFiat
                ? `~${estimatedFeeFiat}`
                : `~${estimatedFeeNative}`
            }
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function SponsorshipOption({
  icon,
  isSelected,
  onClick,
  primaryText,
  secondaryText,
}: {
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  primaryText: string;
  secondaryText: string;
}) {
  return (
    <Box
      data-testid={`gas-sponsorship-option-${primaryText}`}
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      backgroundColor={isSelected ? BoxBackgroundColor.PrimaryMuted : undefined}
      padding={4}
      marginBottom={0}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
      >
        {icon}
        <Box flexDirection={BoxFlexDirection.Column}>
          <Text variant={TextVariant.BodyMd} className="font-medium">
            {primaryText}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {secondaryText}
          </Text>
        </Box>
      </Box>
      {isSelected && (
        <Icon
          name={IconName.Check}
          size={IconSize.Lg}
          color={IconColor.PrimaryDefault}
          data-testid="gas-sponsorship-selected-check"
        />
      )}
    </Box>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function CircularIconWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Box
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      className="flex items-center justify-center rounded-full shrink-0"
      style={{ width: 40, height: 40 }}
    >
      {children}
    </Box>
  );
}
