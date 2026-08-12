import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../../../components/component-library';
import { IconColor } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../../context/confirm';
import { TokenIcon } from '../../../components/token-icon';
import type {
  PayWithRowConfig,
  PayWithSectionConfig,
} from '../../../components/modals/pay-with-modal/pay-with-modal.types';
import { useTransactionPayToken } from '../useTransactionPayToken';
import { useClearPaymentOverride } from '../useClearPaymentOverride';

export const PAY_WITH_CRYPTO_SECTION_TEST_ID = 'pay-with-section-crypto';
export const PAY_WITH_CRYPTO_SELECTED_TOKEN_ROW_TEST_ID =
  'pay-with-crypto-section-selected-token-row';
export const PAY_WITH_CRYPTO_OTHER_ASSETS_ROW_TEST_ID =
  'pay-with-crypto-section-other-assets-row';

type UsePayWithCryptoSectionArgs = {
  onClose: () => void;
  onOtherAssetsPress: () => void;
};

export function usePayWithCryptoSection({
  onClose,
  onOtherAssetsPress,
}: UsePayWithCryptoSectionArgs): PayWithSectionConfig | null {
  const t = useI18nContext();
  const fiatFormatter = useFiatFormatter({ overrideCurrency: 'usd' });
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const { payToken, setPayToken } = useTransactionPayToken();
  const clearOverride = useClearPaymentOverride();

  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const isMoneyAccountSelected =
    paymentOverride === PaymentOverride.MoneyAccount;

  const handleSelectedTokenPress = useCallback(() => {
    if (!payToken) {
      return;
    }
    if (!isMoneyAccountSelected) {
      onClose();
      return;
    }
    clearOverride();
    setPayToken({
      address: payToken.address,
      chainId: payToken.chainId,
    });
    onClose();
  }, [clearOverride, isMoneyAccountSelected, onClose, payToken, setPayToken]);

  const handleOtherAssetsPress = useCallback(() => {
    onOtherAssetsPress();
  }, [onOtherAssetsPress]);

  const selectedTokenBalance = useMemo(
    () => fiatFormatter(new BigNumber(payToken?.balanceUsd ?? '0').toNumber()),
    [fiatFormatter, payToken?.balanceUsd],
  );

  return useMemo((): PayWithSectionConfig => {
    const rows: PayWithRowConfig[] = [];

    if (payToken) {
      rows.push({
        id: 'crypto-selected-token',
        icon: (
          <TokenIcon
            chainId={payToken.chainId}
            tokenAddress={payToken.address}
            symbol={payToken.symbol}
            size="sm"
          />
        ),
        title: payToken.symbol,
        subtitle: `${selectedTokenBalance} ${t('available')}`,
        isSelected: !isMoneyAccountSelected,
        trailingElement: isMoneyAccountSelected ? 'none' : 'checkmark',
        onPress: handleSelectedTokenPress,
        testId: PAY_WITH_CRYPTO_SELECTED_TOKEN_ROW_TEST_ID,
      });
    }

    rows.push({
      id: 'crypto-other-assets',
      icon: (
        <Icon
          name={IconName.Coin}
          size={IconSize.Md}
          color={IconColor.iconAlternative}
        />
      ),
      title: t('payWithOtherAssets'),
      subtitle: t('payWithOtherAssetsDescription'),
      trailingElement: 'chevron',
      onPress: handleOtherAssetsPress,
      testId: PAY_WITH_CRYPTO_OTHER_ASSETS_ROW_TEST_ID,
    });

    return {
      id: 'crypto',
      title: t('payWithCrypto'),
      testId: PAY_WITH_CRYPTO_SECTION_TEST_ID,
      rows,
    };
  }, [
    handleOtherAssetsPress,
    handleSelectedTokenPress,
    isMoneyAccountSelected,
    payToken,
    selectedTokenBalance,
    t,
  ]);
}
