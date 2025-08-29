import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
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
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
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
import { getImageForChainId } from '../../../selectors/multichain';
import { getInternalAccountByAddress } from '../../../selectors/selectors';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain/networks';
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
  chainId: string;
  account?: InternalAccount;
};

export const AddressQRCodeModal: React.FC<AddressQRCodeModalProps> = ({
  isOpen,
  onClose,
  address,
  chainId,
  account,
}) => {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();
  const trackEvent = useContext(MetaMetricsContext);

  const accountInfo = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );

  // Get network configuration for the specific chainId
  const [networkConfigurationsByChainId] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  // Get the network configuration
  // chainId might be in hex format (0x1) or CAIP format (eip155:1)
  let multichainNetwork = null;
  if (chainId && typeof chainId === 'string') {
    let caipChainId: string;

    if (chainId.startsWith('eip155:')) {
      // Already in CAIP format
      caipChainId = chainId;
    } else if (chainId.startsWith('0x')) {
      // Convert from hex to CAIP format
      try {
        caipChainId = toEvmCaipChainId(chainId);
      } catch (error) {
        console.warn(
          'Invalid hex chainId for CAIP conversion:',
          chainId,
          error,
        );
        caipChainId = '';
      }
    } else {
      console.warn('Unknown chainId format:', chainId);
      caipChainId = '';
    }

    if (caipChainId) {
      multichainNetwork = networkConfigurationsByChainId[caipChainId];
    }
  }

  const networkImageSrc = useSelector(() => getImageForChainId(chainId));

  const accountName =
    accountInfo?.metadata?.name || account?.metadata?.name || '';
  const networkName = multichainNetwork?.name || 'Unknown Network';

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

  const handleCopyClick = useCallback(() => {
    handleCopy(address);
  }, [address, handleCopy]);

  const getExplorerButtonText = (): string => {
    if (!multichainNetwork?.blockExplorerUrls?.length) {
      return t('viewOnExplorer');
    }

    const explorerUrl = multichainNetwork.blockExplorerUrls[0];
    if (explorerUrl.includes('etherscan')) {
      return t('viewAddressOnExplorer', ['Etherscan']);
    }
    if (explorerUrl.includes('bscscan')) {
      return t('viewAddressOnExplorer', ['BSCScan']);
    }
    if (explorerUrl.includes('polygonscan')) {
      return t('viewAddressOnExplorer', ['Polygonscan']);
    }
    if (explorerUrl.includes('arbiscan')) {
      return t('viewAddressOnExplorer', ['Arbiscan']);
    }
    if (explorerUrl.includes('solscan')) {
      return t('viewAddressOnExplorer', ['Solscan']);
    }
    return t('viewOnExplorer');
  };

  const handleExplorerNavigation = useCallback(() => {
    if (!multichainNetwork?.blockExplorerUrls?.length) {
      return;
    }

    const explorerUrl = multichainNetwork.blockExplorerUrls[0];
    const addressLink = `${explorerUrl.replace(/\/$/, '')}/address/${address}`;

    openBlockExplorer(addressLink, 'Address QR Code Modal', trackEvent);
  }, [address, multichainNetwork, trackEvent]);

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
        <ModalBody>
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
                <AvatarNetwork name={networkName} src={networkImageSrc} />
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
                {t('addressQrCodeModalDescription')}{' '}
                <Text asChild>
                  <span>{networkName}</span>
                </Text>
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
                {t('copyAddress')}
              </Button>
            </Box>

            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={handleExplorerNavigation}
              className="mb-1" // needed to show focus so it's not hidden when using keyboard navigation
            >
              {getExplorerButtonText()}
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
