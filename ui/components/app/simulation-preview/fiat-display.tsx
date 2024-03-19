import React from 'react';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, Text } from '../../component-library';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { BalanceChange, Erc20AssetIdentifier, Amount } from './types';

const textStyle = {
  color: TextColor.textAlternative,
  variant: TextVariant.bodySm,
};

const FiatNotAvailableDisplay: React.FC = () => {
  const t = useI18nContext();
  return <Text {...textStyle}>{t('simulationPreviewFiatNotAvailable')}</Text>;
};

const NativeFiatDisplay: React.FC<{ amount: Amount }> = ({ amount }) => {
  const wei = amount.quantity;
  return (
    <UserPreferencedCurrencyDisplay
      value={wei}
      showFiat
      textProps={textStyle}
      suffixProps={textStyle}
    />
  );
};

const Erc20FiatDisplay: React.FC<{
  asset: Erc20AssetIdentifier;
  amount: Amount;
}> = ({ asset, amount }) => {
  const { address } = asset;
  const f = useTokenFiatAmount(address, amount.quantity, undefined, {}, false);
  if (!f) {
    return <FiatNotAvailableDisplay />;
  }
  return <Text {...textStyle}>{f}</Text>;
};

export const IndividualFiatDisplay: React.FC<BalanceChange> = ({
  asset,
  amount,
}) => {
  function renderContent() {
    if (asset.standard === TokenStandard.none) {
      return <NativeFiatDisplay amount={amount} />;
    }
    if (asset.standard === TokenStandard.ERC20) {
      return <Erc20FiatDisplay asset={asset} amount={amount} />;
    }
    return <FiatNotAvailableDisplay />;
  }

  return <Box paddingRight={2}>{renderContent()}</Box>;
};

export const TotalFiatDisplay: React.FC<{
  balanceChanges: BalanceChange[];
}> = () => {
  const t = useI18nContext();
  const totalFiat = 123456;
  // let hasUnknownFiat = false;
  // const fiatBreakdown = [] as string[];
  // const totalFiat = balanceChanges.reduce((total, bc) => {
  //   const fiat = getFiatValue(bc);
  //   if (fiat === undefined) {
  //     hasUnknownFiat = true;
  //     return total;
  //   }
  //   return total + fiat;
  // }, 0);

  // if (totalFiat === 0) {
  //   return <FiatNotAvailableDisplay />;
  // }

  return (
    <Text {...textStyle} paddingRight={2}>
      {t('simulationPreviewTotalFiat', totalFiat)}
    </Text>
  );
};
