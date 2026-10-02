import React from 'react';
import { useSelector } from 'react-redux';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { BalanceProjection } from '../../../../../components/app/money/balance-projection';
import { useUpgradeMoneyAccount } from '../../../../../hooks/money/use-upgrade-money-account';
import { selectMoneyAccountVaultConfig } from '../../../../../selectors/money/money-account-feature-flags';
import {
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
} from '../../../constants/musd';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { useConfirmationNavigationOptions } from '../../../hooks/useConfirmationNavigation';
import { CustomAmountInfo } from '../custom-amount-info';

const MONEY_ACCOUNT_DEPOSIT_CURRENCY = 'usd';

/**
 * Amount-screen subtitle for the deposit flow.
 *
 * Defined at module scope rather than inline in {@link MoneyAccountDepositInfo}
 * so the reference stays stable across renders: an inline arrow would be a new
 * function on every render, defeating the `React.memo` on `CustomAmountInfo`
 * and remounting the subtree it returns.
 *
 * @param amountFiat - Fiat amount currently in the custom-amount input.
 * @returns The APY pitch / projected balance subtitle.
 */
const renderAmountDetails = (amountFiat: string) => (
  <BalanceProjection amountFiat={amountFiat} />
);

export const MoneyAccountDepositInfo = () => {
  const { preferredPaymentToken } = useConfirmationNavigationOptions();
  const vaultConfig = useSelector(selectMoneyAccountVaultConfig);
  // Pay parses the required mUSD token on the vault chain. Registering it on
  // mainnet leaves that lookup empty, so the amount screen stays on its
  // skeleton.
  const depositChainId = vaultConfig?.chainId ?? CHAIN_IDS.MONAD;
  const depositAssetAddress =
    MUSD_TOKEN_ADDRESS_BY_CHAIN[depositChainId] ?? MUSD_TOKEN_ADDRESS;

  useAddToken({
    chainId: depositChainId,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: depositAssetAddress,
  });

  // A deposit reached without visiting the Money home page must still ensure
  // the account is upgraded, mirroring mobile's trigger on its confirmation
  // stack.
  useUpgradeMoneyAccount();

  return (
    <CustomAmountInfo
      amountDetails={renderAmountDetails}
      autoFocusAmount
      currency={MONEY_ACCOUNT_DEPOSIT_CURRENCY}
      displayAccountRow
      displayPercentageButtons
      hidePayTokenAmount
      preferredToken={preferredPaymentToken}
    />
  );
};
