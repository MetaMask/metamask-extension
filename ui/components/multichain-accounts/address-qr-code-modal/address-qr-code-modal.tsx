import React, { useCallback, useContext, useMemo } from 'react';
import qrCode from 'qrcode-generator';
import {
  Text,
  TextVariant,
  TextAlign,
  TextColor,
  Button,
  IconName,
  ButtonVariant,
  ButtonSize,
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  AvatarNetwork,
  FontWeight,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../component-library';
import type { ModalProps } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { openBlockExplorer } from '../../multichain/menu-items/view-explorer-menu-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';

// Constants for QR code generation
const QR_CODE_TYPE_NUMBER = 4;
const QR_CODE_CELL_SIZE = 5;
const QR_CODE_MARGIN = 16;
const QR_CODE_ERROR_CORRECTION_LEVEL = 'M';

// Constants for address segmentation
const PREFIX_LEN = 6;
const SUFFIX_LEN = 5;

export type AddressQRCodeModalProps = Omit<
  ModalProps,
  'isOpen' | 'onClose' | 'children'
> & {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  accountName: string;
  networkName: string;
  networkImageSrc?: string | undefined;
};

export const AddressQRCodeModal: React.FC<AddressQRCodeModalProps> = ({
  isOpen,
  onClose,
  address,
  accountName,
  networkName,
  networkImageSrc,
}) => {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();
  const trackEvent = useContext(MetaMetricsContext);

  // Address segmentation for display
  const addressStart = address.substring(0, PREFIX_LEN);
  const addressMiddle = address.substring(
    PREFIX_LEN,
    address.length - SUFFIX_LEN,
  );
  const addressEnd = address.substring(address.length - SUFFIX_LEN);

  // Generate QR code
  const qrImage = qrCode(QR_CODE_TYPE_NUMBER, QR_CODE_ERROR_CORRECTION_LEVEL);
  qrImage.addData(address);
  qrImage.make();

  // Handle copy address
  const handleCopyClick = useCallback(() => {
    handleCopy(address);
  }, [address, handleCopy]);

  // TODO: Move this out into a utility or selector
  // Centralized explorer configuration
  const explorerInfo = useMemo(() => {
    const networkNameLower = networkName.toLowerCase();

    if (networkNameLower.includes('ethereum')) {
      return {
        url: 'https://etherscan.io',
        name: 'Etherscan',
        buttonText: t('viewAddressOnExplorer', ['Etherscan']),
      };
    }

    if (networkNameLower.includes('solana')) {
      return {
        url: 'https://solscan.io',
        name: 'Solscan',
        buttonText: t('viewAddressOnExplorer', ['Solscan']),
      };
    }

    if (networkNameLower.includes('bitcoin')) {
      return {
        url: 'https://blockstream.info',
        name: 'Blockstream',
        buttonText: t('viewAddressOnExplorer', ['Blockstream']),
      };
    }

    // Return null if no valid explorer found - button won't be shown
    return null;
  }, [networkName, t]);

  const handleExplorerNavigation = useCallback(() => {
    if (!explorerInfo) {
      return;
    }

    const addressLink = `${explorerInfo.url}/address/${address}`;
    openBlockExplorer(addressLink, 'Address QR Code Modal', trackEvent);
  }, [address, explorerInfo, trackEvent]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          backButtonProps={{
            'data-testid': 'address-qr-code-modal-back-button',
          }}
        >
          {t('addressQrCodeModalTitle', [accountName, networkName])}
        </ModalHeader>
        {/* 4px bottom padding needed to show focus so it's not hidden when using keyboard navigation */}
        <ModalBody className="pb-1">
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={4}
          >
            <Box
              className="relative flex border-1 border-muted rounded-2xl"
              justifyContent={BoxJustifyContent.Center}
              alignItems={BoxAlignItems.Center}
            >
              <Box
                dangerouslySetInnerHTML={{
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  __html: qrImage.createTableTag(
                    QR_CODE_CELL_SIZE,
                    QR_CODE_MARGIN,
                  ),
                }}
                // Background and border must remain white regardless of theme
                className="bg-white border-4 border-white rounded-2xl"
              />

              <Box
                // Background and border must remain white regardless of theme
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-8 border-white bg-white rounded-xl flex"
                justifyContent={BoxJustifyContent.Center}
                alignItems={BoxAlignItems.Center}
              >
                <AvatarNetwork
                  name={networkName}
                  src={networkImageSrc}
                  className="bg-white" // stay white regardless of theme
                />
              </Box>
            </Box>

            <div>
              <Text
                textAlign={TextAlign.Center}
                variant={TextVariant.HeadingSm}
              >
                {t('addressQrCodeModalHeading', [networkName])}
              </Text>
              <Text
                textAlign={TextAlign.Center}
                color={TextColor.TextAlternative}
              >
                {t('addressQrCodeModalDescription', [networkName])}
              </Text>
            </div>

            <Box
              flexDirection={BoxFlexDirection.Column}
              justifyContent={BoxJustifyContent.Center}
              alignItems={BoxAlignItems.Center}
              gap={1}
              className="w-full"
            >
              <Text
                textAlign={TextAlign.Center}
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                className="break-all max-w-64"
              >
                <Text asChild>
                  <span>{addressStart}</span>
                </Text>
                <Text asChild color={TextColor.TextAlternative}>
                  <span>{addressMiddle}</span>
                </Text>
                <Text asChild>
                  <span>{addressEnd}</span>
                </Text>
              </Text>
              <Button
                variant={ButtonVariant.Tertiary}
                endIconName={copied ? IconName.CopySuccess : IconName.Copy}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={handleCopyClick}
              >
                {t('copyAddressShort')}
              </Button>
            </Box>

            {explorerInfo && (
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={handleExplorerNavigation}
                asChild
              >
                <a
                  href={`${explorerInfo.url}/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {explorerInfo.buttonText}
                </a>
              </Button>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
