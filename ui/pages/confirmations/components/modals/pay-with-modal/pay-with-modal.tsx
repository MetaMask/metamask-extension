import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
import { useTransactionPayBlockedTokens } from '../../../hooks/pay/useTransactionPayBlockedTokens';
import { usePayWithNoFeeToken } from '../../../hooks/pay/usePayWithNoFeeToken';
import {
  clearPaymentOverride,
  getAvailableTokens,
} from '../../../utils/transaction-pay';
import { Asset } from '../../send/asset';
import { type Asset as AssetType } from '../../../types/send';
import {
  useMusdConversionTokens,
  useMusdPaymentToken,
} from '../../../../../hooks/musd';
import { usePostQuoteWithdrawTokenFilter } from '../../../hooks/pay/useWithdrawTokenFilter';
import { useConfirmContext } from '../../../context/confirm';
import {
  addToken,
  findNetworkClientIdByChainId,
} from '../../../../../store/actions';
import { isPostQuoteWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { useDispatch } from '../../../../../store/hooks';
import { selectIsMoneyAccountTransactionEnabled } from '../../../selectors/feature-flags';
import { usePayWithSections } from '../../../hooks/pay/usePayWithSections';
import { PayWithSection } from './pay-with-section';

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
  const blockedTokens = useTransactionPayBlockedTokens();
  const [showOtherAssets, setShowOtherAssets] = useState(false);

  const isMoneyAccountPayEnabled = useSelector((state) =>
    selectIsMoneyAccountTransactionEnabled(state, currentConfirmation?.type),
  );

  const { filterTokens: musdTokenFilter } = useMusdConversionTokens({
    transactionType: currentConfirmation?.type,
  });
  const {
    filterTokens: postQuoteWithdrawTokenFilter,
    isFilterApplied: isPostQuoteWithdrawTokenFilterApplied,
  } = usePostQuoteWithdrawTokenFilter();

  // Use the mUSD-specific payment token handler for same-chain enforcement
  const { onPaymentTokenChange: onMusdPaymentTokenChange } =
    useMusdPaymentToken();

  const isPostQuoteWithdraw =
    isPostQuoteWithdrawTransaction(currentConfirmation);
  const isMoneyAccountDeposit =
    currentConfirmation?.type === TransactionType.moneyAccountDeposit;
  const { renderNoFeeTag } = usePayWithNoFeeToken();
  const tagRenderers = useMemo(
    () => (isMoneyAccountDeposit ? [renderNoFeeTag] : undefined),
    [isMoneyAccountDeposit, renderNoFeeTag],
  );

  const handleClose = useCallback(() => {
    setShowOtherAssets(false);
    onClose();
  }, [onClose]);

  const handleOtherAssetsPress = useCallback(() => {
    setShowOtherAssets(true);
  }, []);

  const { sections } = usePayWithSections({
    onClose: handleClose,
    onOtherAssetsPress: handleOtherAssetsPress,
  });

  const handleTokenSelect = useCallback(
    async (token: AssetType) => {
      if (token.disabled) {
        return;
      }

      if (
        payToken &&
        payToken.address.toLowerCase() === token.address?.toLowerCase() &&
        payToken.chainId.toLowerCase() ===
          (token.chainId as string)?.toLowerCase()
      ) {
        handleClose();
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
        isPostQuoteWithdraw &&
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

      if (currentConfirmation?.id) {
        clearPaymentOverride(currentConfirmation.id);
      }
      setPayToken(tokenSelection);
      handleClose();
    },
    [
      currentConfirmation,
      dispatch,
      handleClose,
      isPostQuoteWithdraw,
      onMusdPaymentTokenChange,
      payToken,
      setPayToken,
    ],
  );

  const tokenFilter = useCallback(
    (tokens: AssetType[]) => {
      if (isPostQuoteWithdraw && isPostQuoteWithdrawTokenFilterApplied) {
        return postQuoteWithdrawTokenFilter(tokens);
      }

      let available = getAvailableTokens({
        payToken,
        requiredTokens,
        tokens,
        blockedTokens,
      });

      available = musdTokenFilter(available);

      return available;
    },
    [
      blockedTokens,
      isPostQuoteWithdraw,
      isPostQuoteWithdrawTokenFilterApplied,
      musdTokenFilter,
      payToken,
      postQuoteWithdrawTokenFilter,
      requiredTokens,
    ],
  );

  const showSections = isMoneyAccountPayEnabled && !showOtherAssets;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isClosedOnOutsideClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={handleClose}
          {...(showOtherAssets
            ? {
                onBack: () => setShowOtherAssets(false),
              }
            : {})}
        >
          {t(isPostQuoteWithdraw ? 'withdrawTo' : 'payWithModalTitle')}
        </ModalHeader>
        <ScrollContainer
          style={{
            flex: 1,
            overflow: 'auto',
          }}
        >
          {showSections ? (
            <div data-testid="pay-with-sections">
              {sections.map((section) => (
                <PayWithSection key={section.id} config={section} />
              ))}
            </div>
          ) : (
            <Asset
              includeNoBalance
              hideNfts
              tokenFilter={tokenFilter}
              onAssetSelect={handleTokenSelect}
              tagRenderers={tagRenderers}
              searchPlaceholder={
                isPostQuoteWithdraw ? t('searchTokens') : undefined
              }
            />
          )}
        </ScrollContainer>
      </ModalContent>
    </Modal>
  );
};
