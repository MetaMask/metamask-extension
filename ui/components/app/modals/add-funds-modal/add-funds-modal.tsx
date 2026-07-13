import React, { useCallback, useState } from 'react';
import {
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { TokenPaymentInfo } from '@metamask/subscription-controller';
import { Hex } from '@metamask/utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import useRampsNavigation from '../../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { ReceiveModal } from '../../../multichain/receive-modal';
import useBridging from '../../../../hooks/bridge/useBridging';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { trace, TraceName } from '../../../../../shared/lib/trace';

const AddFundsModal = ({
  onClose,
  token,
  chainId,
  payerAddress,
}: {
  onClose: () => void;
  token: TokenPaymentInfo;
  chainId: string | number;
  payerAddress: Hex;
}) => {
  const t = useI18nContext();
  const { goToBuy } = useRampsNavigation();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const { openBridgeExperience } = useBridging();

  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const handleBuyAndSellOnClick = useCallback(async () => {
    await goToBuy();
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NavBuyButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'Transaction Shield',
          text: 'Buy',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: token.symbol,
        })
        .build(),
    );
    onClose();
  }, [
    chainId,
    onClose,
    goToBuy,
    token.symbol,
    createEventBuilder,
    trackEvent,
  ]);

  const handleReceiveOnClick = useCallback(() => {
    trace({ name: TraceName.ReceiveModal });
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NavReceiveButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          text: 'Receive',
          location: 'Transaction Shield',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainId,
        })
        .build(),
    );

    setShowReceiveModal(true);
  }, [chainId, createEventBuilder, trackEvent]);

  const handleSwapOnClick = useCallback(async () => {
    openBridgeExperience(MetaMetricsSwapsEventSource.TransactionShield, {
      symbol: token.symbol,
      address: token.address,
      chainId,
    });
  }, [chainId, token, openBridgeExperience]);

  const buttonRow = ({
    label,
    iconName,
    onClick,
    id,
    disabled = false,
  }: {
    label: string;
    iconName: IconName;
    onClick: () => void;
    id: string;
    disabled?: boolean;
  }) => {
    return (
      <Box
        asChild
        data-testid={id}
        className="add-funds-modal__row flex items-center w-full gap-3 p-4"
        onClick={onClick}
      >
        <button disabled={disabled}>
          <Icon
            name={iconName}
            size={IconSize.Lg}
            color={IconColor.IconAlternative}
          />
          <Text variant={TextVariant.BodyMd}>{label}</Text>
        </button>
      </Box>
    );
  };

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      data-testid="add-funds-modal"
      className="add-funds-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('addFunds')}</ModalHeader>
        <ModalBody
          className="add-funds-modal__body"
          paddingLeft={0}
          paddingRight={0}
        >
          {buttonRow({
            id: 'add-funds-modal-buy-crypto-button',
            label: t('addFundsModalBuyCrypto'),
            iconName: IconName.Add,
            onClick: handleBuyAndSellOnClick,
          })}
          {buttonRow({
            id: 'add-funds-modal-receive-crypto-button',
            label: t('addFundsModalReceiveTokens'),
            iconName: IconName.QrCode,
            onClick: handleReceiveOnClick,
          })}
          {buttonRow({
            id: 'add-funds-modal-swap-crypto-button',
            label: t('addFundsModalSwapTokens'),
            iconName: IconName.SwapHorizontal,
            onClick: handleSwapOnClick,
          })}
          {showReceiveModal && (
            <ReceiveModal
              address={payerAddress}
              onClose={() => setShowReceiveModal(false)}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddFundsModal;
