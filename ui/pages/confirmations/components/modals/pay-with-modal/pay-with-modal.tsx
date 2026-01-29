import React, { useCallback } from 'react';
import { Hex } from '@metamask/utils';
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

export type PayWithModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const PayWithModal = ({ isOpen, onClose }: PayWithModalProps) => {
  const t = useI18nContext();
  const { payToken, setPayToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleTokenSelect = useCallback(
    (token: AssetType) => {
      if (token.disabled) {
        return;
      }

      setPayToken({
        address: token.address as Hex,
        chainId: token.chainId as Hex,
      });

      handleClose();
    },
    [handleClose, setPayToken],
  );

  const tokenFilter = useCallback(
    (tokens: AssetType[]) => {
      return getAvailableTokens({
        payToken,
        requiredTokens,
        tokens,
      });
    },
    [payToken, requiredTokens],
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
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
