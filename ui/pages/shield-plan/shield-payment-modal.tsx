import React, { useCallback, useState, useMemo } from 'react';
import classnames from 'classnames';
import { PAYMENT_TYPES, PaymentType } from '@metamask/subscription-controller';
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
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_IDS,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import { TokenWithApprovalAmount } from '../../hooks/subscription/useSubscriptionPricing';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';

export const ShieldPaymentModal = ({
  isOpen,
  onClose,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  availableTokenBalances,
  selectedToken,
  onAssetChange,
  hasStableTokenWithBalance,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedPaymentMethod: PaymentType;
  setSelectedPaymentMethod: (method: PaymentType) => void;
  availableTokenBalances: TokenWithApprovalAmount[];
  selectedToken?: TokenWithApprovalAmount;
  onAssetChange: (asset: TokenWithApprovalAmount) => void;
  hasStableTokenWithBalance: boolean;
}) => {
  const t = useI18nContext();
  const [showAssetPickerModal, setShowAssetPickerModal] = useState(false);

  const selectPaymentMethod = useCallback(
    (selectedMethod: PaymentType) => {
      setSelectedPaymentMethod(selectedMethod);

      if (selectedMethod === PAYMENT_TYPES.byCrypto) {
        setShowAssetPickerModal(true);
      } else {
        onClose();
      }
    },
    [setSelectedPaymentMethod, onClose],
  );

  // Create custom token list generator that filters for USDT/USDC with balance
  const customTokenListGenerator = useMemo(() => {
    return function* (
      filterPredicate: (
        symbol: string,
        address?: null | string,
        chainId?: string,
      ) => boolean,
    ): Generator<AssetWithDisplayData<ERC20Asset | NativeAsset>> {
      // Filter for USDT and USDC tokens that have balance
      for (const token of availableTokenBalances) {
        if (filterPredicate(token.symbol, token.address, token.chainId)) {
          yield token;
        }
      }
    };
  }, [availableTokenBalances]);

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
                selectedPaymentMethod === PAYMENT_TYPES.byCrypto,
            })}
            padding={4}
            gap={4}
            backgroundColor={
              selectedPaymentMethod === PAYMENT_TYPES.byCrypto
                ? BackgroundColor.primaryMuted
                : BackgroundColor.transparent
            }
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            width={BlockSize.Full}
            onClick={() => {
              selectPaymentMethod(PAYMENT_TYPES.byCrypto);
            }}
            disabled={!hasStableTokenWithBalance}
          >
            {selectedPaymentMethod === PAYMENT_TYPES.byCrypto && (
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
                {hasStableTokenWithBalance ? (
                  <BadgeWrapper
                    badge={
                      <AvatarNetwork
                        size={AvatarNetworkSize.Xs}
                        name={NETWORK_TO_NAME_MAP[CHAIN_IDS.MAINNET]}
                        src={
                          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[CHAIN_IDS.MAINNET]
                        }
                        borderColor={BorderColor.borderMuted}
                      />
                    }
                  >
                    <AvatarToken
                      name={selectedToken?.symbol}
                      src={selectedToken?.image}
                      marginTop={1}
                      borderColor={BorderColor.borderMuted}
                    />
                  </BadgeWrapper>
                ) : (
                  <Icon size={IconSize.Xl} name={IconName.Coin} />
                )}

                <Box textAlign={TextAlign.Left}>
                  <Text variant={TextVariant.bodyMdMedium}>
                    {t('shieldPlanPayWithToken', [
                      hasStableTokenWithBalance
                        ? selectedToken?.symbol
                        : 'Crypto',
                    ])}
                  </Text>
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                  >
                    {hasStableTokenWithBalance
                      ? `${t('balance')}: ${selectedToken?.string} ${selectedToken?.symbol}`
                      : t('shieldPlanNoFunds')}
                  </Text>
                </Box>
              </Box>
              {hasStableTokenWithBalance && (
                <Icon size={IconSize.Md} name={IconName.ArrowRight} />
              )}
            </Box>
          </Box>
          <Box
            data-testid="shield-payment-method-card-button"
            as="button"
            className={classnames('payment-method-item', {
              'payment-method-item--selected':
                selectedPaymentMethod === PAYMENT_TYPES.byCard,
            })}
            padding={4}
            gap={4}
            backgroundColor={
              selectedPaymentMethod === PAYMENT_TYPES.byCard
                ? BackgroundColor.primaryMuted
                : BackgroundColor.transparent
            }
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            width={BlockSize.Full}
            onClick={() => selectPaymentMethod(PAYMENT_TYPES.byCard)}
          >
            {selectedPaymentMethod === PAYMENT_TYPES.byCard && (
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
            onAssetChange(asset as TokenWithApprovalAmount);
            setShowAssetPickerModal(false);
            onClose();
          }}
          header={t('shieldPlanSelectToken')}
          autoFocus={false}
          visibleTabs={[TabName.TOKENS]}
          customTokenListGenerator={customTokenListGenerator}
        />
      </ModalContent>
    </Modal>
  );
};
