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
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionPayToken } from '../../../hooks/pay/useTransactionPayToken';
import { useTransactionPayRequiredTokens } from '../../../hooks/pay/useTransactionPayData';
import { getAvailableTokens } from '../../../utils/transaction-pay';
import { Asset } from '../../send/asset';
import { type Asset as AssetType } from '../../../types/send';
///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import { useMusdConversionTokenFilter } from '../../../hooks/musd';
///: END:ONLY_INCLUDE_IF

export type PayWithModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const PayWithModal = ({ isOpen, onClose }: PayWithModalProps) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { payToken, setPayToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();

  ///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
  const { filterTokens: musdTokenFilter } = useMusdConversionTokenFilter();
  const isMusdConversion =
    currentConfirmation?.type === TransactionType.musdConversion;
  ///: END:ONLY_INCLUDE_IF

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
      const availableTokens = getAvailableTokens({
        payToken,
        requiredTokens,
        tokens,
      });

      ///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
      // Apply mUSD-specific filtering for conversion transactions
      if (isMusdConversion) {
        return musdTokenFilter(availableTokens);
      }
      ///: END:ONLY_INCLUDE_IF

      return availableTokens;
    },
    [
      payToken,
      requiredTokens,
      ///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
      isMusdConversion,
      musdTokenFilter,
      ///: END:ONLY_INCLUDE_IF
    ],
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
