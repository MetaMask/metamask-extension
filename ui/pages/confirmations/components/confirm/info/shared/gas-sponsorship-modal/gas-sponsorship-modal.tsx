import React, { useCallback } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { AvatarToken, AvatarTokenSize } from '@metamask/design-system-react';

import {
  Box,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
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
  const { isOptedOut, setOptedOut } = useGasSponsorshipPreference(chainId);
  const { nativeCurrencySymbol } = useNativeCurrencySymbol(chainId);
  const { estimatedFeeFiat, estimatedFeeNative } =
    useFeeCalculations(transactionMeta);

  const handleSelectSponsored = useCallback(() => {
    setOptedOut(false);
    onClose();
  }, [setOptedOut, onClose]);

  const handleSelectNative = useCallback(() => {
    setOptedOut(true);
    onClose();
  }, [setOptedOut, onClose]);

  const isSponsoredSelected = !isOptedOut;

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay data-testid="gas-sponsorship-modal-overlay" />
      <ModalContent
        size={ModalContentSize.Md}
        modalDialogProps={{ paddingBottom: 0 }}
      >
        <ModalHeader onClose={onClose}>
          {t('gasSponsorshipModalTitle')}
        </ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={0}
          paddingRight={0}
          paddingBottom={0}
        >
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
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      backgroundColor={isSelected ? BackgroundColor.primaryMuted : undefined}
      padding={4}
      marginBottom={0}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={3}
      >
        {icon}
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Text variant={TextVariant.bodyMdMedium}>{primaryText}</Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {secondaryText}
          </Text>
        </Box>
      </Box>
      {isSelected && (
        <Icon
          name={IconName.Check}
          size={IconSize.Lg}
          color={IconColor.primaryDefault}
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
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.backgroundMuted}
      borderRadius={BorderRadius.full}
      style={{ width: 40, height: 40, flexShrink: 0 }}
    >
      {children}
    </Box>
  );
}
