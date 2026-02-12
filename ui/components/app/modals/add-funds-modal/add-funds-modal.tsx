import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
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
import { getBuyableChains } from '../../../../ducks/ramps';
import useRamps from '../../../../hooks/ramps/useRamps/useRamps';
import { ReceiveModal } from '../../../multichain/receive-modal';
import useBridging from '../../../../hooks/bridge/useBridging';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { AggregatorNetwork } from '../../../../ducks/ramps/types';
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
  const { openBuyCryptoInPdapp } = useRamps();
  const trackEvent = useContext(MetaMetricsContext);

  const buyableChains = useSelector(getBuyableChains);

  const { openBridgeExperience } = useBridging();

  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const isBuyableChain = useMemo(() => {
    if (!chainId) {
      return false;
    }
    return buyableChains.some(
      (network: AggregatorNetwork) =>
        String(network.chainId) === hexToDecimal(chainId),
    );
  }, [buyableChains, chainId]);

  const handleBuyAndSellOnClick = useCallback(() => {
    openBuyCryptoInPdapp();
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: 'Transaction Shield',
        text: 'Buy',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: token.symbol,
      },
    });
    onClose();
  }, [chainId, openBuyCryptoInPdapp, token.symbol, trackEvent]);

  const handleReceiveOnClick = useCallback(() => {
    trace({ name: TraceName.ReceiveModal });
    trackEvent({
      event: MetaMetricsEventName.NavReceiveButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        text: 'Receive',
        location: 'Transaction Shield',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
      },
    });

    setShowReceiveModal(true);
  }, [chainId, trackEvent]);

  const handleSwapOnClick = useCallback(async () => {
    openBridgeExperience(MetaMetricsSwapsEventSource.TransactionShield, {
      symbol: token.symbol,
      address: token.address,
      chainId,
    });
  }, [token, openBridgeExperience]);

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
            disabled: !isBuyableChain,
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
