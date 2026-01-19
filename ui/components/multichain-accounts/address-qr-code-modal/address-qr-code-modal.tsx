import React, {
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';
import qrCode from 'qrcode-generator';
import { CaipChainId } from '@metamask/utils';
import {
  Text,
  TextVariant,
  TextAlign,
  TextColor,
  Button,
  IconName,
  IconColor,
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
  BackgroundColor,
  TextColor as DesignSystemTextColor,
} from '../../../helpers/constants/design-system';
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
import { getBlockExplorerInfo } from '../../../helpers/utils/multichain/getBlockExplorerInfo';

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
  chainId: CaipChainId;
  networkImageSrc?: string | undefined;
};

export const AddressQRCodeModal: React.FC<AddressQRCodeModalProps> = ({
  isOpen,
  onClose,
  address,
  accountName,
  networkName,
  chainId,
  networkImageSrc,
}) => {
  const t = useI18nContext();
  const [, handleCopy] = useCopyToClipboard();
  const trackEvent = useContext(MetaMetricsContext);

  const [addressCopied, setAddressCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Address segmentation for display
  const addressStart = address.substring(0, PREFIX_LEN);
  const addressMiddle = address.substring(
    PREFIX_LEN,
    address.length - SUFFIX_LEN,
  );
  const addressEnd = address.substring(address.length - SUFFIX_LEN);

  // Generate QR code data URL
  const qrImageUrl = useMemo(() => {
    const qr = qrCode(QR_CODE_TYPE_NUMBER, QR_CODE_ERROR_CORRECTION_LEVEL);
    qr.addData(address);
    qr.make();

    // Get the HTML img tag and extract the data URL
    const imgTag = qr.createImgTag(QR_CODE_CELL_SIZE, QR_CODE_MARGIN);
    const srcMatch = imgTag.match(/src="([^"]+)"/u);
    return srcMatch ? srcMatch[1] : null;
  }, [address]);

  // Handle copy address
  const handleCopyClick = useCallback(() => {
    handleCopy(address);
    setAddressCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setAddressCopied(false);
      timeoutRef.current = null;
    }, 1000);
  }, [address, handleCopy]);

  // Get block explorer info from network configuration
  const explorerInfo = getBlockExplorerInfo(
    t as (key: string, args: string[]) => string,
    address,
    { networkName, chainId },
  );

  const handleExplorerNavigation = useCallback(() => {
    if (!explorerInfo) {
      return;
    }

    openBlockExplorer(
      explorerInfo.addressUrl,
      'Address QR Code Modal',
      trackEvent,
    );
  }, [explorerInfo, trackEvent]);

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
              {qrImageUrl && (
                <img
                  src={qrImageUrl}
                  alt={`QR code: ${address}`}
                  // Background and border must remain white regardless of theme
                  className="bg-white border-4 border-white rounded-2xl"
                />
              )}

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
                data-testid="account-address"
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
                endIconName={
                  addressCopied ? IconName.CopySuccess : IconName.Copy
                }
                endIconProps={{
                  color: addressCopied
                    ? IconColor.SuccessDefault
                    : IconColor.IconDefault,
                }}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={handleCopyClick}
                style={
                  addressCopied
                    ? {
                        backgroundColor: `var(--color-${BackgroundColor.successMuted})`,
                        color: `var(--color-${DesignSystemTextColor.successDefault})`,
                      }
                    : undefined
                }
                data-testid="address-qr-code-modal-copy-button"
              >
                {addressCopied ? t('addressCopied') : t('copyAddressShort')}
              </Button>
            </Box>

            {explorerInfo && (
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={handleExplorerNavigation}
                data-testid="view-address-on-etherscan"
              >
                {explorerInfo.buttonText}
              </Button>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
