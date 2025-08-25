import React, { useCallback, useState } from 'react';
import classnames from 'classnames';
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
import { AssetPickerModal } from '../../components/multichain/asset-picker-amount/asset-picker-modal';
import { TabName } from '../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { PAYMENT_METHODS, PaymentMethod } from './types';

export const ShieldPaymentModal = ({
  isOpen,
  onClose,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  selectedToken,
  onAssetChange,
  paymentTokens,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  selectedToken:
    | AssetWithDisplayData<ERC20Asset>
    | AssetWithDisplayData<NativeAsset>;
  onAssetChange: (
    asset: AssetWithDisplayData<ERC20Asset> | AssetWithDisplayData<NativeAsset>,
  ) => void;
  paymentTokens: (keyof typeof AssetPickerModal)['customTokenListGenerator'];
}) => {
  const t = useI18nContext();
  const [showAssetPickerModal, setShowAssetPickerModal] = useState(false);

  const selectPaymentMethod = useCallback(
    (selectedMethod: PaymentMethod) => {
      setSelectedPaymentMethod(selectedMethod);

      if (selectedMethod === PAYMENT_METHODS.TOKEN) {
        setShowAssetPickerModal(true);
      } else {
        onClose();
      }
    },
    [setSelectedPaymentMethod, onClose],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      className="shield-payment-modal"
      data-testid="shield-payment-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onClose={onClose}>
          {t('shieldPlanPaymentTitle')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
        >
          <Box
            data-testid="shield-payment-method-token-button"
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
              selectPaymentMethod(PAYMENT_METHODS.TOKEN);
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
                    name={selectedToken.symbol}
                    src={selectedToken.image}
                    marginTop={1}
                    borderColor={BorderColor.borderMuted}
                  />
                </BadgeWrapper>
                <Box textAlign={TextAlign.Left}>
                  <Text variant={TextVariant.bodyMdMedium}>
                    {t('shieldPlanPayWithToken', [selectedToken.symbol])}
                  </Text>
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                  >
                    {t('balance')}: 123.43 {selectedToken.symbol}
                  </Text>
                </Box>
              </Box>

              <Icon size={IconSize.Md} name={IconName.ArrowRight} />
            </Box>
          </Box>
          <Box
            data-testid="shield-payment-method-card-button"
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
            onClick={() => selectPaymentMethod(PAYMENT_METHODS.CARD)}
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
                  <Text variant={TextVariant.bodyMdMedium}>
                    {t('shieldPlanPayWithCard')}
                  </Text>
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
          onClose={() => {
            setShowAssetPickerModal(false);
          }}
          asset={selectedToken}
          onAssetChange={(asset) => {
            onAssetChange(asset);
            setShowAssetPickerModal(false);
            onClose();
          }}
          header="Select a token"
          autoFocus={false}
          visibleTabs={[TabName.TOKENS]}
          customTokenListGenerator={() => {
            return paymentTokens;
          }}
        />
      </ModalContent>
    </Modal>
  );
};
