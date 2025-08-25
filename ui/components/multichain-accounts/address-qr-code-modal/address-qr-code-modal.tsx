import React from 'react';
import qrCode from 'qrcode-generator';
import {
  Text,
  TextVariant,
  TextAlign,
  Button,
  IconName,
  ButtonVariant,
  ButtonSize,
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  AvatarNetwork,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../component-library';
import type { ModalProps } from '../../component-library';

type AddressQRCodeModalProps = Omit<
  ModalProps,
  'isOpen' | 'onClose' | 'children'
> & {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * AddressQRCodeModal
 *
 * Renders a modal displaying a QR code for a given address.
 *
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 */
export const AddressQRCodeModal: React.FC<AddressQRCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const address = '0x1234567890123456789012345678901234567890';
  const qrImage = qrCode(4, 'M');
  qrImage.addData(address);
  qrImage.make();
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Account 1 / Ethereum</ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Box
              className="relative flex"
              justifyContent={BoxJustifyContent.Center}
              alignItems={BoxAlignItems.Center}
            >
              <Box
                dangerouslySetInnerHTML={{
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  __html: qrImage.createTableTag(5, 16),
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
                <AvatarNetwork name="Ethereum" src="./images/ethereum.svg" />
              </Box>
            </Box>
            <Text textAlign={TextAlign.Center} variant={TextVariant.HeadingSm}>
              Ethereum Address
            </Text>
            <Text textAlign={TextAlign.Center}>
              Use this address to receive tokens and collectibles on Ethereum
            </Text>

            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              <Button
                variant={ButtonVariant.Secondary}
                startIconName={IconName.Copy}
                size={ButtonSize.Lg}
                isFullWidth
              >
                EqT4z...a8f3x
              </Button>
              <Button
                variant={ButtonVariant.Tertiary}
                size={ButtonSize.Lg}
                isFullWidth
              >
                Share
              </Button>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
