import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
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
import {
  addToken,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';

export type PayWithModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const PayWithModal = ({ isOpen, onClose }: PayWithModalProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { payToken, setPayToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();

  const { filterTokens: musdTokenFilter } = useMusdConversionTokens({
    transactionType: currentConfirmation?.type,
  });

  // Use the mUSD-specific payment token handler for same-chain enforcement
  const { onPaymentTokenChange: onMusdPaymentTokenChange } =
    useMusdPaymentToken();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleTokenSelect = useCallback(
    async (token: AssetType) => {
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

      // Withdraw flows (e.g. Perps Withdraw) let the user pick a destination
      // token they don't necessarily hold. TransactionPayController requires
      // the token to be tracked by TokensController before `updatePaymentToken`
      // can resolve its metadata, otherwise it throws "Payment token not
      // found" and the selection silently fails. Ensure the token is imported
      // first, then update the pay token.
      if (
        isPerpsWithdraw &&
        !token.isNative &&
        (token.rawBalance === '0x0' || !token.rawBalance)
      ) {
        try {
          const networkClientId = await findNetworkClientIdByChainId(
            tokenSelection.chainId,
          );
          await dispatch(
            addToken(
              {
                address: tokenSelection.address,
                symbol: token.symbol,
                decimals: Number(token.decimals ?? 18),
                networkClientId,
                image: token.image,
              },
              true,
            ),
          );
        } catch (error) {
          // `setPayToken` resolves the token via `TokensController`. If the
          // import failed, the controller will throw "Payment token not
          // found", leaving the user with a silently broken selection.
          // Keep the modal open so they can retry or pick a different token.
          console.error('Failed to import withdraw destination token', error);
          return;
        }
      }

      setPayToken(tokenSelection);
      handleClose();
    },
    [
      currentConfirmation?.type,
      dispatch,
      handleClose,
      isPerpsWithdraw,
      onMusdPaymentTokenChange,
      setPayToken,
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
