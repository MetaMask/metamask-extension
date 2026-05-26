import React, { useCallback } from 'react';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../../../components/component-library';
import { ScrollContainer } from '../../../../../contexts/scroll-container';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useTransactionPayRequiredTokens } from '../../../hooks/pay/useTransactionPayData';
import { getAvailableTokens } from '../../../utils/transaction-pay';
import { Asset } from '../../send/asset';
import { type Asset as AssetType } from '../../../types/send';
import {
  useMusdConversionTokens,
  useMusdPaymentToken,
} from '../../../../../hooks/musd';
import { useConfirmContext } from '../../../context/confirm';

export type PayWithModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const PayWithModal = ({ isOpen, onClose }: PayWithModalProps) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { payToken, setPayToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();

  const { filterTokens: musdTokenFilter } = useMusdConversionTokens({
    transactionType: currentConfirmation?.type,
  });

  // Use the mUSD-specific payment token handler for same-chain enforcement
  const { onPaymentTokenChange: onMusdPaymentTokenChange } =
    useMusdPaymentToken();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleTokenSelect = useCallback(
    (token: AssetType) => {
      if (token.disabled) {
        return;
      }

      const tokenSelection = {
        address: token.address as Hex,
        chainId: token.chainId as Hex,
      };

      // For mUSD conversions, use the specialized handler that enforces same-chain
      if (currentConfirmation?.type === TransactionType.musdConversion) {
        onMusdPaymentTokenChange(tokenSelection);
        handleClose();
        return;
      }

      // Default behavior for other transaction types
      setPayToken(tokenSelection);
      handleClose();
    },
    [
      handleClose,
      setPayToken,
      onMusdPaymentTokenChange,
      currentConfirmation?.type,
    ],
  );

  const tokenFilter = useCallback(
    (tokens: AssetType[]) => {
      let available = getAvailableTokens({ payToken, requiredTokens, tokens });

      available = musdTokenFilter(available);

      return available;
    },
    [payToken, requiredTokens, musdTokenFilter],
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isClosedOnOutsideClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>
          {t('payWithModalTitle')}
        </ModalHeader>
        <ScrollContainer
          style={{
            flex: 1,
            overflow: 'auto',
          }}
        >
          <Asset
            includeNoBalance
            hideNfts
            tokenFilter={tokenFilter}
            onAssetSelect={handleTokenSelect}
          />
        </ScrollContainer>
      </ModalContent>
    </Modal>
  );
};
