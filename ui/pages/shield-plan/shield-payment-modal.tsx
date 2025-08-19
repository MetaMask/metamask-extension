import React, { useState } from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import classnames from 'classnames';
import { AssetPickerModal } from '../../components/multichain/asset-picker-amount/asset-picker-modal';
import { TabName } from '../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { PAYMENT_METHODS, PaymentMethod } from './types';

export const ShieldPaymentModal = ({
  isOpen,
  onClose,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
}) => {
  const [showAssetPickerModal, setShowAssetPickerModal] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="shield-payment-modal">
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onClose={onClose}>Change payment method</ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
        >
          <Box
            as="button"
            className={classnames('payment-method-item', {
              'payment-method-item--selected':
                selectedPaymentMethod === PAYMENT_METHODS.TOKEN,
            })}
            padding={4}
            gap={4}
            backgroundColor={
              selectedPaymentMethod === PAYMENT_METHODS.TOKEN
                ? BackgroundColor.primaryMuted
                : BackgroundColor.transparent
            }
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            width={BlockSize.Full}
            onClick={() => {
              setSelectedPaymentMethod(PAYMENT_METHODS.TOKEN);
              setShowAssetPickerModal(true);
            }}
          >
            {selectedPaymentMethod === PAYMENT_METHODS.TOKEN && (
              <Box
                className="payment-method-item__selected-indicator"
                borderRadius={BorderRadius.pill}
                backgroundColor={BackgroundColor.primaryDefault}
              />
            )}
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
              width={BlockSize.Full}
            >
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={4}
              >
                <BadgeWrapper
                  badge={
                    <AvatarNetwork
                      size={AvatarNetworkSize.Xs}
                      name="Avalanche"
                      src="./images/avax-token.svg"
                      borderColor={BorderColor.borderMuted}
                    />
                  }
                >
                  <AvatarToken
                    name="Eth"
                    src="./images/eth_logo.svg"
                    marginTop={1}
                    borderColor={BorderColor.borderMuted}
                  />
                </BadgeWrapper>
                <Box textAlign={TextAlign.Left}>
                  <Text variant={TextVariant.bodyMdMedium}>Pay with USDT</Text>
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                  >
                    Balance: 123.43 USDT
                  </Text>
                </Box>
              </Box>

              <Icon size={IconSize.Md} name={IconName.ArrowRight} />
            </Box>
          </Box>
          <Box
            as="button"
            className={classnames('payment-method-item', {
              'payment-method-item--selected':
                selectedPaymentMethod === PAYMENT_METHODS.CARD,
            })}
            padding={4}
            gap={4}
            backgroundColor={
              selectedPaymentMethod === PAYMENT_METHODS.CARD
                ? BackgroundColor.primaryMuted
                : BackgroundColor.transparent
            }
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            width={BlockSize.Full}
            onClick={() => setSelectedPaymentMethod(PAYMENT_METHODS.CARD)}
          >
            {selectedPaymentMethod === PAYMENT_METHODS.CARD && (
              <Box
                className="payment-method-item__selected-indicator"
                borderRadius={BorderRadius.pill}
                backgroundColor={BackgroundColor.primaryDefault}
              />
            )}
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
              width={BlockSize.Full}
            >
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={4}
              >
                <Icon size={IconSize.Xl} name={IconName.Card} />
                <Box textAlign={TextAlign.Left}>
                  <Text variant={TextVariant.bodyMdMedium}>Pay with card</Text>
                  <Box
                    display={Display.Flex}
                    gap={1}
                    alignItems={AlignItems.center}
                  >
                    <img src="./images/card-mc.svg" alt="Mastercard" />
                    <img src="./images/card-visa.svg" alt="Visa" />
                    <img src="./images/card-amex.svg" alt="American Express" />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
        <AssetPickerModal
          isOpen={showAssetPickerModal}
          onClose={() => setShowAssetPickerModal(false)}
          asset={undefined}
          onAssetChange={() => {}}
          header="Select a token"
          autoFocus={false}
          visibleTabs={[TabName.TOKENS]}
        />
      </ModalContent>
    </Modal>
  );
};
